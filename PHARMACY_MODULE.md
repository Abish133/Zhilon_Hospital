# Pharmacy Module — Complete Reference

This document describes the **Pharmacy module** of the HMS and every part of the
system it touches: medicine master data, batch/stock management, procurement
(PO → GRN), prescribing (OPD & IPD), dispensing, billing integration, RBAC, the
REST API surface, and the React front end. It also records known gaps.

> Stack: **Node.js / Express / Sequelize (MySQL)** backend, **React + Ant Design**
> frontend. Everything is **multi-tenant** — scoped by `hospital_id`.

---

## 1. High-level picture

The module has two halves that meet at the **`medicine_batches`** table:

- **Stock-IN (procurement):** Purchase Order → Goods Receipt Note → Medicine Batch.
- **Stock-OUT (dispensing):** one engine (`dispenseMedicine`) serves three patient
  contexts — **Walk-in**, **OPD (prescription-linked)**, **IPD (ward issuance)**.

```
PROCUREMENT              PRESCRIBING                  DISPENSING                       BILLING
-----------              -----------                  ----------                       -------
PO ─► GRN ─┐             OPD: Doctor ─► OpdPresc      Walk-in ─────┐
           ├─► Medicine     (dispense_status=Pending) OPD (presc) ─┤─► dispenseMedicine ─┐
Manual ────┘   Batch     IPD: Doctor ─► IpdMedication IPD (admit) ─┘   • FEFO batch pick │
              (FEFO by      (status=Active, clinical)                   • deduct stock    │
               expiry)                                                  • PharmacySale +  │
                          Nurse administers (IPD)                         SaleDetails     │
                          = clinical log ONLY                          • mark presc       │
                            (no stock / no bill)                         Dispensed        │
                                                                       • OPD/IPD ─► BillCharge 
                                                                       ┘
                                                                                       ▼
                                                                               BillingEpisode
                                                                              (final patient bill)
```

---

## 2. Data model

### Core tables

| Model (file) | Table | Purpose |
|---|---|---|
| [Medicine.js](backend/src/models/Medicine.js) | `medicines` | Catalog/master: name, code, strength, dosage form, manufacturer, HSN, `gst_percentage`, schedule. Holds a **cached** `available_quantity`. |
| [MedicineBatch.js](backend/src/models/MedicineBatch.js) | `medicine_batches` | **The real stock.** Per-batch: `batch_number`, `expiry_date`, `purchase_rate`, `selling_rate`, `mrp`, `received_quantity`, `available_quantity`, vendor/PO/GRN links. |
| [MedicineCategory.js](backend/src/models/MedicineCategory.js) | `medicine_categories` | Medicine grouping. |
| [PharmacySale.js](backend/src/models/PharmacySale.js) | `pharmacy_sales` | Dispense **header**: patient, `visit_type` (OPD/IPD/Walk-in), `visit_id`, `prescription_id`, totals, `tax_amount`, `net_amount`, `payment_mode`, `dispensed_by`. |
| [PharmacySaleDetail.js](backend/src/models/PharmacySaleDetail.js) | `pharmacy_sale_details` | Dispense **line items**: medicine, batch, `quantity`, `rate`, `amount`, `gst_percentage`. |

### Linked tables (other modules)

| Model | Table | Link to pharmacy |
|---|---|---|
| [OpdPrescription.js](backend/src/models/OpdPrescription.js) | `opd_prescriptions` | Doctor's OPD prescription. Has `dispense_status` (`Pending` → `Dispensed`). Source of OPD dispensing. |
| [IpdMedication.js](backend/src/models/IpdMedication.js) | IPD medication orders | Doctor's inpatient orders (clinical). |
| [IpdMedicationAdministration.js](backend/src/models/IpdMedicationAdministration.js) | Nurse administration log | **Clinical only** — does NOT move stock or bill. |
| `PurchaseOrder` / `PurchaseOrderDetail` | procurement | Upstream of GRN. |
| `GoodsReceiptNote` / `GrnDetail` | goods receipt | Creates/tops up `medicine_batches`. |
| `InventoryItem` | general (non-medicine) stock | GRN also updates `current_stock` here. |
| `Vendor` | suppliers | Batch & PO vendor. |
| `BillingEpisode` / `BillCharge` | billing | OPD/IPD pharmacy charges land here. |
| `Patient`, `Hospital`, `User`, `Doctor` | masters | FKs throughout. |

### Key relationships

```
Medicine 1───* MedicineBatch *───1 Vendor / PurchaseOrder / GoodsReceiptNote
Medicine 1───* PharmacySaleDetail
PharmacySale 1───* PharmacySaleDetail
PharmacySale *───1 Patient / OpdPrescription / User(dispensed_by) / Hospital
PharmacySaleDetail *───1 MedicineBatch
OpdConsultation 1───* OpdPrescription *───1 Medicine / Doctor / OpdVisit
```

### Cached-stock automation (important)

`MedicineBatch` has Sequelize **hooks** ([MedicineBatch.js:116-151](backend/src/models/MedicineBatch.js#L116-L151)):
`afterCreate`, `afterUpdate`, `afterDestroy`, `afterBulkUpdate` all recompute
`Medicine.available_quantity` as the **SUM of active batches' `available_quantity`**.

> Consequence: `medicines.available_quantity` is **derived, never set manually**.
> Any code path that changes batch quantity automatically refreshes the master total.

---

## 3. RBAC / permissions

Auth chain in [app.js](backend/src/app.js): `guard(mod) = [authMiddleware, enforceHospitalScope, globalAuditLogger, gateFor(mod)]`.

- **`authMiddleware`** — validates JWT, sets `req.user`.
- **`enforceHospitalScope`** ([rbac.js:37-66](backend/src/middleware/rbac.js#L37-L66)) — sets `req.hospitalId`, and **forces `hospital_id`** into query (GET) or body (POST/PUT/PATCH) so every request is tenant-scoped. (Note the Express 5 quirk handled: `req.query` is redefined as an own property because it is otherwise a read-only getter.)
- **`gateFor(mod)`** ([roleMatrix.js:127-136](backend/src/middleware/roleMatrix.js#L127-L136)) — branches by HTTP method: **GET → read gate, POST/PUT/PATCH/DELETE → write gate**.
- **Admin bypasses all gates** ([rbac.js:26](backend/src/middleware/rbac.js#L26)).

Pharmacy-relevant matrix ([roleMatrix.js](backend/src/middleware/roleMatrix.js)):

| Module guard | Read roles | Write roles |
|---|---|---|
| `pharmacy` | clinical staff + Pharmacist | **Pharmacist** |
| `medicine` | clinical staff + Pharmacist | Pharmacist, HR |
| `medicineBatch` | clinical staff + Pharmacist | Pharmacist |
| `medicineCategory` | clinical staff + Pharmacist | Pharmacist, HR |
| `opdPrescription` | clinical staff + Pharmacist | **Doctor** (write) |
| `ipdMedication` | clinical staff + Pharmacist | Doctor, Nurse, Pharmacist |
| `inventory` | Pharmacist, HR, Nurse | Pharmacist, HR |
| `vendor` | Pharmacist, HR, Accountant | HR, Accountant |
| `purchaseOrder` | Pharmacist, HR, Accountant | Pharmacist, HR, Accountant |
| `grn` | Pharmacist, HR, Accountant | Pharmacist, HR |
| `stock` | Pharmacist, HR, Nurse | Pharmacist, Nurse, HR |

(`READ_CLINICAL = Doctor, Nurse, Receptionist, Pharmacist, LabTech, Radiologist`.)

---

## 4. REST API surface

Mounted in [app.js](backend/src/app.js):

| Mount | Guard | Routes file | Controller |
|---|---|---|---|
| `/api/pharmacy-sales` | `pharmacy` | [pharmacySaleRoutes.js](backend/src/routes/pharmacySaleRoutes.js) | `PharmacySaleController` |
| `/api/pharmacy-sale-details` | `pharmacy` | [pharmacySaleDetailRoutes.js](backend/src/routes/pharmacySaleDetailRoutes.js) | `PharmacySaleDetailController` |
| `/api/pharmacy/sales` | `pharmacy` | [pharmacySales.js](backend/src/routes/pharmacySales.js) | `PharmacySaleController` (dispense) |
| `/api/medicine` | `medicine` | [medicineRoutes.js](backend/src/routes/medicineRoutes.js) | `MedicineController` |
| `/api/medicine-batch` | `medicineBatch` | medicineBatchRoutes.js | `MedicineBatchController` |
| `/api/medicine_category` | `medicineCategory` | medicineCategoryRoutes.js | `MedicineCategoryController` |
| `/api/opd-prescriptions` | `opdPrescription` | opdPrescriptionRoutes.js | `OpdPrescriptionController` |
| `/api/purchase-orders` | `purchaseOrder` | purchaseOrderRoutes.js | `PurchaseOrderController` |
| `/api/goods-receipt-notes` | `grn` | goodsReceiptNoteRoutes.js | `GoodsReceiptNoteController` |
| `/api/grn-details` | `grn` | grnDetailRoutes.js | `GrnDetailController` |
| `/api/vendors` | `vendor` | vendorRoutes.js | `VendorController` |
| `/api/inventory-items` | `inventory` | inventoryItemRoutes.js | `InventoryItemController` |
| `/api/stock-issues` / `/api/stock-returns` | `stock` | stock*Routes.js | Stock controllers |

### Pharmacy endpoints in detail

**Sales (CRUD)** — `/api/pharmacy-sales`
- `POST /` — `createSale` (raw create, no stock logic)
- `GET /` — `getAllSales` (filters: `uhid`, `patient_id`, `start_date`, `end_date`; tenant-scoped)
- `GET /:id` — `getSaleById`
- `PUT /:id` — `updateSale`
- `DELETE /:id` — **`deleteSale`** (reverses stock + removes BillCharge)

**Dispense** — `/api/pharmacy/sales`
- `POST /dispense` — **`dispenseMedicine`** (the core engine)
- `GET /` , `GET /:id`

**Sale details** — `/api/pharmacy-sale-details`
- Full CRUD; `createSaleDetail` independently checks/decrements batch stock.

---

## 5. The dispense engine (core logic)

`PharmacySaleController.dispenseMedicine` — [PharmacySaleController.js:5-177](backend/src/controllers/PharmacySaleController.js#L5).
Runs entirely in a **DB transaction** with row locks.

**Request body**
```jsonc
{
  "uhid": "UH0001",
  "prescription_id": 12,          // OPD only (optional)
  "prescription_ids": [12, 13],   // all OPD lines being filled (optional)
  "admission_id": 45,             // IPD only (optional)
  "medicines": [ { "medicine_id": 7, "quantity": 10 } ],
  "dispensed_by": 3,              // user id
  "hospital_id": 1
}
```

**Steps**
1. Validate `uhid`, `medicines[]`, `hospital_id`; resolve patient by `(uhid, hospital_id)`.
2. Determine context:
   - `admission_id` → `visit_type = 'IPD'`, `visit_id = admission_id`.
   - else `prescription_id` → `visit_type = 'OPD'`, `visit_id = prescription.visit_id`.
   - else → `visit_type = 'Walk-in'`.
3. For each line:
   - **FEFO batch selection** — earliest `expiry_date` with `available_quantity >= quantity`, `is_active`, matching hospital, locked `FOR UPDATE` ([line 49-59](backend/src/controllers/PharmacySaleController.js#L49-L59)). *First-Expiry-First-Out.*
   - No batch → **rollback**, `"Insufficient stock for <name>"`.
   - Rate priority: `batch.mrp` → `batch.selling_rate` → `medicine.mrp`. Zero → **rollback**, `"Price not set"`.
   - `lineTax = amount * medicine.gst_percentage / 100`.
   - **Decrement** `batch.available_quantity` and save (hook refreshes master).
4. Create `PharmacySale` header (`payment_mode: 'Pending'`) + `PharmacySaleDetail` rows.
5. **Billing (OPD/IPD only):** find the **open `BillingEpisode`** for the visit/admission and insert a `BillCharge` with `service_type: 'Pharmacy'`, `service_id = sale_id`, weighted-average `gst_percent` ([line 121-148](backend/src/controllers/PharmacySaleController.js#L121-L148)).
6. **Prescription closure (OPD):** set `dispense_status = 'Dispensed'` for all `prescription_ids` (or the single `prescription_id`) ([line 152-160](backend/src/controllers/PharmacySaleController.js#L152)).
7. **Commit.** Any failure rolls back the whole transaction → no partial stock loss.

---

## 6. The three dispensing scenarios

### A) Walk-in (counter sale)
- **UI:** [PharmacyDispense.jsx](frontend/src/pages/pharmacy/PharmacyDispense.jsx), "Add Manual Item".
- `visit_type = 'Walk-in'`, no `visit_id`/`prescription_id`.
- Stock deducted; sale recorded. **No `BillCharge`** (billing block only fires for OPD/IPD).
- Self-contained sale; `payment_mode` stays `Pending` until updated.

### B) OPD (prescription-linked)
- **Source:** Doctor writes prescription during OPD consultation → `opd_prescriptions` rows with `dispense_status = 'Pending'`.
- **UI:** [PharmacyDispense.jsx](frontend/src/pages/pharmacy/PharmacyDispense.jsx) — search patient by UHID/ID; only **non-dispensed** prescriptions shown ([line 95](frontend/src/pages/pharmacy/PharmacyDispense.jsx#L95)). Pharmacist clicks **Add** per line, then **Complete Dispense**.
- `visit_type = 'OPD'`; `BillCharge` posted to the open OPD `BillingEpisode`; filled prescriptions marked **Dispensed** (drop off the screen, can't be double-filled).

### C) IPD (ward issuance)
- **UI:** [IpdPharmacy.jsx](frontend/src/pages/pharmacy/IpdPharmacy.jsx) — "Issue to Ward" for an admitted patient.
- `visit_type = 'IPD'`, `visit_id = admission_id`; `BillCharge` posted to the admission's open `BillingEpisode`.
- **Critical distinction** ([ipdMedicationController.js:99-104](backend/src/controllers/ipdMedicationController.js#L99-L104)): for IPD, **stock deduction and billing happen ONCE, at ward issuance**. The nurse **administration** record (`administerMedication`) is a **clinical-only log** — it intentionally does **not** touch stock or post charges, to avoid double-billing per dose.

---

## 7. Stock-IN (procurement)

```
Purchase Order ─► Goods Receipt Note (GRN) ─► MedicineBatch (create or top-up)
```

`GoodsReceiptNoteController.createGRN` — [GoodsReceiptNoteController.js:5-148](backend/src/controllers/GoodsReceiptNoteController.js#L5) (transactional):
- Auto-generates `grn_number` (`GRN######`) if absent.
- For each item:
  - Creates a `GrnDetail`.
  - If `item_id`: increments `InventoryItem.current_stock` (general/non-medicine stock).
  - If `medicine_id`: **upserts a `MedicineBatch`** keyed by `(medicine_id, batch_number, hospital_id)` — existing batch gets quantity added and rates refreshed; otherwise a new batch is created with expiry, rates, vendor, PO & GRN links ([line 71-110](backend/src/controllers/GoodsReceiptNoteController.js#L71-L110)).
- Updates PO status: `Received`, or `Partially Received` if any line was short.

> Manual stock entry is also possible via `MedicineBatchController.createMedicineBatch`
> ([MedicineBatchController.js](backend/src/controllers/MedicineBatchController.js)) — same effect, no PO.

---

## 8. Billing integration

- OPD/IPD pharmacy sales create a **`BillCharge`** (`service_type: 'Pharmacy'`,
  `service_id = sale_id`) against the visit's **open `BillingEpisode`**, so pharmacy
  charges settle alongside consultation, lab, etc. in
  [BillGeneration.jsx](frontend/src/pages/billing/BillGeneration.jsx).
- GST is stored per line (`gst_percentage`) and as a header `tax_amount`; the bill
  charge expresses it as one **weighted-average** `gst_percent` =
  `totalTax / totalAmount * 100`.
- The sale's own `payment_mode` defaults to `'Pending'`; actual collection happens
  through the billing module.

---

## 9. Cancellation / reversal

`PharmacySaleController.deleteSale` — [PharmacySaleController.js:254-296](backend/src/controllers/PharmacySaleController.js#L254) (transactional):
1. Loads sale + details under lock.
2. **Restores `available_quantity`** to each batch (hook refreshes master).
3. Deletes the linked `BillCharge` (`service_type: 'Pharmacy', service_id: sale_id`).
4. Deletes details + header, commits.

→ A cancelled sale fully reverses both stock and billing.

---

## 10. Frontend

### Pages ([frontend/src/pages/pharmacy/](frontend/src/pages/pharmacy/))

| Page | Route | Purpose |
|---|---|---|
| [Pharmacy.jsx](frontend/src/pages/pharmacy/Pharmacy.jsx) | `/pharmacy` | Dashboard: total medicines, **low-stock count** (`available_quantity < 100`, computed client-side), inventory value, stock-health bar; links to Dispense / IPD / Manage Medicines. |
| [PharmacyDispense.jsx](frontend/src/pages/pharmacy/PharmacyDispense.jsx) | `/pharmacy/dispense` | OPD / Walk-in dispensing. Patient search, prescription pick, manual items, FEFO batch auto-pick, totals + GST. |
| [IpdPharmacy.jsx](frontend/src/pages/pharmacy/IpdPharmacy.jsx) | `/pharmacy/ipd` | Ward-wise issuance to admitted patients. |
| [PharmacySales.jsx](frontend/src/pages/pharmacy/PharmacySales.jsx) | `/pharmacy/sales` | Sales register with drill-down to line items (read-only). |

Navigation menu defined in [AppLayout.jsx](frontend/src/components/layout/AppLayout.jsx) (Dashboard, Dispense (OPD), IPD Pharmacy, Sales, Medicines, Batches, Categories).

### Services ([frontend/src/services/](frontend/src/services/))

| Service | Endpoint | Notes |
|---|---|---|
| [PharmacySaleService.js](frontend/src/services/PharmacySaleService.js) | `/pharmacy-sales` + `dispense()` → `/pharmacy/sales/dispense` | **The dispense path actually used by the UI.** |
| [PharmacySaleDetailService.js](frontend/src/services/PharmacySaleDetailService.js) | `/pharmacy-sale-details` | |
| [PharmacyService.js](frontend/src/services/PharmacyService.js) | `/pharmacy` | ⚠️ See gaps below. |
| `MedicineService`, `MedicineBatchService`, `MedicineCategoryService` | masters | |

---

## 11. Validations & edge cases (already handled)

- **Insufficient stock** → 400, transaction rolled back.
- **Missing price** (no MRP/selling rate on batch) → 400, rollback.
- **Patient not found / medicine not found** → 404, rollback.
- **FEFO** prevents dispensing newer stock before older (expiry-aware).
- **Tenant isolation** — every query carries `hospital_id`; IPD medication inherits
  tenancy from its parent admission ([ipdMedicationController.js:7-11](backend/src/controllers/ipdMedicationController.js#L7-L11)).
- **Frontend pre-checks** — `PharmacyDispense` blocks dispense if a medicine isn't in
  the master or has no in-stock batch, with guidance ("add to Medicine Master" /
  "receive stock via GRN first").
- **Double-dispense guard (OPD)** — dispensed prescriptions are filtered out of the
  dispense screen and marked `Dispensed` server-side.

---

## 12. Issues found & fixed (and remaining gaps)

### ✅ Fixed

1. **Medicine search returned nothing / 404** — `MedicineService.search()`
   ([MedicineService.js](frontend/src/services/MedicineService.js)) calls
   `GET /medicine/search?q=`, which the backend caught as `GET /:id` (`id="search"`)
   and 404'd. This broke the search box on **both** the Pharmacy dashboard
   ([Pharmacy.jsx](frontend/src/pages/pharmacy/Pharmacy.jsx)) and the Medicine List
   ([MedicineList.jsx](frontend/src/pages/pharmacy/MedicineList.jsx)).
   **Fix:** added `MedicineController.searchMedicines` (filters name/code/manufacturer
   via `Op.like`, reads `?q=`) and mounted `GET /medicine/search` **before** `/:id`
   ([medicineRoutes.js](backend/src/routes/medicineRoutes.js)), mirroring the patient
   search convention.

2. **`detail_id` vs `sale_detail_id` mismatch** — `getSaleDetailById` and
   `updateSaleDetail` queried a non-existent `detail_id` column (PK is
   `sale_detail_id`, per [migration 040](backend/src/migrations/040_create_pharmacySaleDetails.js)),
   so single-detail fetch/update silently 404'd.
   **Fix:** all four lookups now use `sale_detail_id`
   ([PharmacySaleDetailController.js](backend/src/controllers/PharmacySaleDetailController.js)).

3. **No expiry guard on dispense** — FEFO ordered by expiry but an already-expired
   batch was still eligible.
   **Fix:** the dispense batch query now requires `expiry_date >= today`
   ([PharmacySaleController.js](backend/src/controllers/PharmacySaleController.js));
   FEFO still picks the nearest valid expiry. Failure message clarified to
   "No in-stock, non-expired batch available for …". *(All seed batches are
   future-dated, so the working OPD flow is unaffected.)*

4. **Misleading dead method in `PharmacyService.js`** — `dispense()` pointed at the
   unmounted `/pharmacy/dispense`, and `getLowStock()/getExpiringStock()` pointed at
   non-existent routes. (None were actually called — the UI dispenses via
   `PharmacySaleService`.)
   **Fix:** `PharmacyService.dispense()` now targets the correct
   `/pharmacy/sales/dispense`; the unused stock helpers were removed.

### ⚠️ Remaining (by design / future work)

5. **No low-stock / reorder automation** — low stock is a UI calc with a hard-coded
   threshold (`< 100`) in [Pharmacy.jsx:32](frontend/src/pages/pharmacy/Pharmacy.jsx#L32);
   no per-medicine reorder level or alerting.

6. **`createSale` / `createSaleDetail` bypass the engine** — the raw CRUD
   `POST /api/pharmacy-sales` does no stock/billing logic; `createSaleDetail` decrements
   stock independently. Only `dispenseMedicine` is fully consistent. Avoid the raw
   create paths for real dispensing.

7. **`payment_mode` is never reconciled here** — sales are created `Pending`; the
   billing module owns collection. There is no pharmacy-side "mark paid" flow.

8. **IPD stock leaves at issuance, not bedside** — intentional (see §6C), but ward
   stock and actual administration can drift if ordered doses aren't given.

---

## 13. Quick file index

**Backend controllers:** `PharmacySaleController.js`, `PharmacySaleDetailController.js`,
`MedicineController.js`, `MedicineBatchController.js`, `MedicineCategoryController.js`,
`GoodsReceiptNoteController.js`, `GrnDetailController.js`, `PurchaseOrderController.js`,
`ipdMedicationController.js`, `OpdPrescriptionController.js`
(all under [backend/src/controllers/](backend/src/controllers/)).

**Backend models:** `PharmacySale.js`, `PharmacySaleDetail.js`, `Medicine.js`,
`MedicineBatch.js`, `MedicineCategory.js`, `OpdPrescription.js`, `IpdMedication.js`,
`IpdMedicationAdministration.js`, `PurchaseOrder*.js`, `GrnDetail.js`
(under [backend/src/models/](backend/src/models/)).

**Middleware:** [rbac.js](backend/src/middleware/rbac.js), [roleMatrix.js](backend/src/middleware/roleMatrix.js).

**Frontend:** [frontend/src/pages/pharmacy/](frontend/src/pages/pharmacy/),
[frontend/src/services/](frontend/src/services/) (Pharmacy*, Medicine* services).
