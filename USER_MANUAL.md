# Bay Hospital HMS — User Manual & Workflow Guide

A complete, role-based, A‑to‑Z guide to operating the Hospital Management System,
**written from the actual screens and the actual backend behaviour** (verified in
code, not assumed). The last section is an honest **correctness & gaps review** so
you know exactly what is solid and what to double‑check.

> Conventions used below
> - **URL** = the in‑app path (e.g. `/ipd/admit`). In dev that is `http://localhost:5173/ipd/admit`.
> - **Auto** = the app fills this for you (hospital, logged‑in user, dates, tokens, UHID, billing links). You never type these.
> - **Golden rule:** the flow is *chained by IDs* — move forward using the list/row buttons; you rarely type an ID by hand.

---

## 0. Getting started

### 0.1 Logging in
- **URL:** `/login`
- Seed accounts (all share password `password123`): `admin@nbh.in` (Admin),
  `dr.anita@nbh.in` (Doctor), `nurse1@nbh.in` (Nurse), `pharmacist@nbh.in`,
  `labtech@nbh.in`, etc.
- First‑time tenant setup is at `/setup` (creates the hospital + first admin).

### 0.2 The 10 roles
| Role | Primary job in the system |
|---|---|
| **Admin** | Full access. Master data, users, settings, audit, everything below. |
| **Receptionist** | Registration, appointments, check‑in, beds, OPD billing/payments. |
| **Doctor** | Consultations, orders, prescriptions, IPD care, OT, discharge. |
| **Nurse** | Vitals, IPD daily care, MAR, nurse assignment, nursing checklist, beds. |
| **Pharmacist** | Dispensing (walk‑in/OPD/IPD), medicines, batches, procurement, stock. |
| **LabTech** | Lab orders, sample collection, result entry, reports. |
| **Radiologist** | Radiology orders, scheduling, imaging, reports. |
| **Accountant** | Bills, payments, advances, refunds, insurance, finance reports. |
| **HR** | Employees, doctors, shifts, roster, attendance, payroll, equipment. |
| **Employee** | Self‑service: mark attendance, raise leave requests, profile. |

Access is enforced **on the server** for every request (read vs. write per module
and HTTP method). **Admin bypasses all gates.** The menu you see is also filtered by
your role, so each user only sees what they can use.

---

## 1. One‑time setup (Admin) — do this first

Most forms pick from dropdowns, so the master data must exist **before** day‑to‑day work.

| # | Set up | URL | Needed for |
|---|---|---|---|
| 1 | Hospital profile, logo, tax %, numbering | `/settings` | Branding on bills/cards; GST; auto numbering |
| 2 | Departments | `/settings` (Departments) | Doctor dept, consultation charge, routing |
| 3 | Users & roles | `/admin/users` | Staff logins |
| 4 | Doctors (+ qualifications, schedules, leaves) | `/admin/doctors` | Appointments, consults, OT |
| 5 | Employees (incl. nurses) | `/employees` | Nurse assignment, payroll |
| 6 | **Charge Master** | `/admin/charges` | **Auto‑pricing of consultations, lab, radiology, etc.** |
| 7 | Service Packages | `/admin/packages` | Bundled/package billing & credits |
| 8 | Wards & Beds | `/ipd/wards`, `/beds/management` | IPD admission |
| 9 | OT Rooms | `/ot/rooms` | OT bookings |
| 10 | Medicine categories, medicines | `/pharmacy/medicine-categories`, `/pharmacy/medicines` | Prescribing & dispensing |
| 11 | Inventory categories & items | `/inventory/categories`, `/inventory` | Consumables, GRN |
| 12 | Vendors | `/inventory/vendors` | Purchase orders, batches |
| 13 | Lab test master | `/lab/test-master` | Lab orders |
| 14 | Radiology test master | `/radiology/test-master` | Radiology orders |
| 15 | Shifts / Salary structures | `/hr/shifts`, `/hr/salary-structure` | Roster, payroll |

> ⚠️ **Critical:** the **Charge Master** drives automatic pricing. If a
> `Consultation` charge is **not** configured for a doctor's department, the
> consultation is recorded but **no consultation fee is billed** (silently). See
> §10, item 1.

---

## 2. Role → screens map (what each role can open)

Derived directly from the route guards.

| Area | Screens (URLs) | Roles allowed |
|---|---|---|
| Dashboard / Profile / Mark attendance | `/dashboard`, `/profile`, `/attendance/mark` | All |
| Patients | `/patients`, `/patients/:uhid` | Receptionist, Doctor, Nurse, Admin |
| OPD | `/opd`, `/opd/appointments`, `/opd/visits`, `/opd/queue` | Receptionist, Doctor, Nurse, Admin |
| OPD vitals | `/opd/vitals/:visitId` | Nurse, Doctor, Admin |
| OPD consultation | `/opd/consultation/:visitId` | **Doctor, Admin** |
| OPD prescriptions | `/opd/prescriptions` | Doctor, Pharmacist, Admin |
| Appointment booking | `/appointments/book` | Receptionist, Admin |
| IPD list / admit | `/ipd`, `/ipd/admit` | Receptionist, Doctor, (Nurse view), Admin |
| IPD care / vitals / meds / discharge | `/ipd/care/:id`, `/ipd/vitals/:id`, `/ipd/medications`, `/ipd/discharge/:id` | Doctor, Nurse, Admin (discharge: Doctor/Admin) |
| Wards / nurse assignment / checklist | `/ipd/wards`, `/ipd/nurse-assignments`, `/ipd/nursing-checklist` | Admin, Nurse |
| Beds | `/beds/management` | Admin, Nurse, Receptionist |
| OT | `/ot`, `/ot/preop`, `/ot/intraop`, `/ot/postop`, `/ot/consumables`, `/ot/anesthesia/:id` | Doctor, (Nurse for pre‑op/consumables), Admin |
| OT rooms | `/ot/rooms` | Admin |
| Lab | `/lab`, `/lab/results/:id`, `/lab/report/:id` | LabTech, (Doctor view report), Admin |
| Radiology | `/radiology`, `/radiology/scheduling`, `/radiology/imaging/:id`, `/radiology/report/:id` | Radiologist, (Doctor), Admin |
| Pharmacy | `/pharmacy`, `/pharmacy/dispense`, `/pharmacy/ipd`, `/pharmacy/sales`, `/pharmacy/medicines`, `/pharmacy/batches` | Pharmacist, Admin |
| Inventory | `/inventory`, `/inventory/purchase-orders`, `/inventory/goods-receipt`, `/inventory/vendors`, `/inventory/issue-return` | Admin, Pharmacist, HR (+Accountant on some) |
| Billing | `/billing`, `/billing/generate/:episodeId`, `/opd/billing`, `/lab/billing`, `/pharmacy/billing` | Accountant, Receptionist, Admin (+ dept roles on dept billing) |
| Advance / Refund / Insurance | `/billing/advance`, `/billing/refunds`, `/billing/insurance` | Accountant, Admin (advance also Receptionist) |
| Equipment | `/equipment`, `/equipment/maintenance`, `/equipment/calibration`, … | Admin, HR (+Nurse on maintenance) |
| HR | `/hr/shifts`, `/hr/roster`, `/hr/payroll`, `/hr/salary-structure`, `/hr/leave-requests` | Admin, HR (payroll +Accountant; leave +Employee/Doctor/Nurse) |
| Reports | `/reports`, `/reports/detailed`, `/reports/advanced`, `/admin/analytics` | Admin, Accountant, HR (advanced +Doctor) |
| Admin | `/admin/users`, `/admin/audit-logs`, `/settings` | Admin only |

---

## 3. End‑to‑end workflow A — Outpatient (OPD), A to Z

**Who:** Receptionist → Nurse → Doctor → LabTech/Radiologist → Pharmacist → Accountant.

1. **Register the patient** (Receptionist) — `/patients` → *Register New Patient*.
   - Required: First/Last name, Gender, DOB, Mobile (unique, 10 digits 6–9), City, State.
   - **Auto:** Age from DOB; **UHID** generated (e.g. `UHID‑2026‑000001`).
   - You can immediately **print / download the Patient ID Card** (card drawer opens after saving).
2. **Book an appointment** (Receptionist) — `/appointments/book` (or `/opd/appointments`).
   - Pick patient, doctor, department, date/time. Status = `Scheduled`.
3. **Check‑in** (Receptionist) — from `/opd/appointments` (or `/opd/queue`).
   - **Auto on check‑in:** an **OPD Visit** is created with a **token number**, and an
     **OPD billing episode opens** (status `Open`). *(Verified: appointment check‑in
     creates visit + episode + token.)*
   - A **walk‑in** without an appointment can be created directly as a visit at `/opd/visits` (also opens an episode).
4. **Record vitals** (Nurse) — `/opd/vitals/:visitId`.
5. **Consultation** (Doctor) — `/opd/consultation/:visitId`.
   - Enter complaints, examination, diagnosis, treatment plan, follow‑up.
   - **Auto:** the **consultation fee** is added to the bill from the **Charge Master**
     (by the doctor's department). If a follow‑up date is set, a **follow‑up appointment
     is auto‑created**. If a package covers the consult, the fee is skipped and a credit is used.
6. **Order tests** (Doctor) — within the consultation / order screens.
   - **Lab orders** and **Radiology orders** automatically post an **"Investigation" charge** to the open episode.
7. **Prescribe** (Doctor) — prescription lines are saved with `dispense_status = Pending`.
8. **Diagnostics** (LabTech / Radiologist) — see workflows C and D.
9. **Dispense medicines** (Pharmacist) — `/pharmacy/dispense`; see workflow E.
   - **Auto:** a **"Pharmacy" charge** posts to the open OPD episode; the prescription is marked `Dispensed`.
10. **Bill & collect** (Accountant/Receptionist) — `/billing` → open the patient's bill
    (`/billing/generate/:episodeId`). All accumulated charges (consultation + investigation
    + pharmacy + packages) are shown. **Generate the bill**, take **payment** (cash/card/UPI/etc.),
    then **Print / Download PDF**. The new **Bill Details** view opens in a half‑width drawer.

> **Result:** one OPD episode collects every charge from every department automatically;
> the cashier settles a single bill.

---

## 4. End‑to‑end workflow B — Inpatient (IPD) + OT, A to Z

**Who:** Receptionist/Doctor (admit) → Nurse/Doctor (care) → OT team → Doctor (discharge) → Accountant.

1. **Admit** (Receptionist/Doctor/Admin) — `/ipd/admit`.
   - Pick patient, admitting doctor, ward, **bed (only Available beds shown)**, reason, **advance amount**.
   - **Auto:** bed → `Occupied`, an **IPD billing episode opens**, advance is recorded.
2. **IPD hub** — `/ipd`. Each row → **View (Daily Care)**, **Vitals**, **Transfer**, **Patient Details**, **Discharge**.
3. **Daily care** (Nurse/Doctor):
   - **Vitals** — `/ipd/vitals/:admissionId` (only while status = Admitted).
   - **Progress notes** — `/ipd/care/:admissionId` → Progress Notes tab.
   - **Medication orders** — Medications tab (Active → Complete/Stop).
   - **Orders** — Lab/Radiology/Pharmacy/Procedure tab.
   - **Nurse assignment / nursing checklist** — `/ipd/nurse-assignments`, `/ipd/nursing-checklist`.
4. **Operation Theatre (if surgical):**
   - **Book OT** — `/ot` → *Book OT* (double‑booking of room/surgeon is blocked).
   - **Pre‑op** `/ot/preop` → **Intra‑op** `/ot/intraop` → **Consumables** `/ot/consumables` → **Post‑op** `/ot/postop`.
   - **Auto:** OT consumables **deduct stock** and post an **"OT Consumable" charge**.
5. **Daily IPD charges** — the nightly job posts recurring bed/charges automatically (see §9).
6. **Discharge** (Doctor/Admin) — `/ipd/discharge/:admissionId`.
   - Fill discharge summary (diagnosis, course, meds, follow‑up). Optional nursing discharge summary.
   - **⚠️ Balance guard (verified):** discharge is **blocked (HTTP 409)** if there is an
     **outstanding balance**, unless `force_discharge = true` is passed (for LAMA/medico‑legal/death).
     Settle the bill or use the override.
   - **Auto on success:** bed → `Available`, IPD episode **closed**, admission → `Discharged`,
     and a **Print Discharge Summary** option appears.
7. **Final bill & payment** (Accountant) — `/billing` → the admission's episode → generate bill,
   adjust advance, collect balance, print/PDF.

---

## 5. Workflow C — Laboratory (order → report)
1. **Order** (Doctor, from consultation/IPD orders, or LabTech at `/lab`). → posts an **Investigation charge**.
2. **Collect sample** (LabTech) — sample tracking on the order.
3. **Enter results** (LabTech) — `/lab/results/:order_id`; flag **critical values**.
4. **Report** (LabTech/Doctor) — `/lab/report/:order_id`; verified report appears in the patient timeline.
5. **Billing** — the investigation charge settles in the patient's open episode (or via `/lab/billing` for department billing).

## 6. Workflow D — Radiology (order → report)
1. **Order** (Doctor/Radiologist) — `/radiology`. → posts an **Investigation charge**.
2. **Schedule** — `/radiology/scheduling`.
3. **Imaging** — `/radiology/imaging/:orderId`.
4. **Report** — `/radiology/report/:orderId` (verified report in timeline).
5. **Billing** — via the episode or `/lab`‑style department billing.

## 7. Workflow E — Pharmacy dispensing
One engine (`dispenseMedicine`, runs in a DB transaction with row locks) serves three contexts:
- **Walk‑in** (`/pharmacy/dispense` → Add Manual Item): deducts stock, records a sale. **No bill charge** (no episode).
- **OPD (prescription‑linked)** (`/pharmacy/dispense`): only *non‑dispensed* prescriptions show; pick lines → *Complete Dispense*. **Auto:** FEFO batch pick (earliest non‑expired), stock deducted, **Pharmacy charge** posted to the OPD episode, prescription marked `Dispensed`.
- **IPD (ward issuance)** (`/pharmacy/ipd`): issue to an admitted patient. **Auto:** stock deducted **once at issuance**, **Pharmacy charge** posted to the admission episode. The nurse's **administration** record (MAR) is a **clinical log only** — it does *not* move stock or bill (prevents double‑billing).
- **Cancellation** (`deleteSale`): restores batch stock **and** removes the linked bill charge.

## 8. Workflow F — Procurement & stock
1. **Purchase Order** — `/inventory/purchase-orders` (Pharmacist/HR/Accountant).
2. **Goods Receipt (GRN)** — `/inventory/goods-receipt`: for medicines it **creates/tops up a Medicine Batch** (expiry, rates, vendor/PO links); for general items it increments stock. PO status → Received / Partially Received.
3. **Manual batch** — `/pharmacy/batches` (same effect, no PO).
4. **Issue / Return between stores** — `/inventory/issue-return`.
5. **Cached stock:** `medicine.available_quantity` is **derived** (sum of active batches) and refreshed automatically — never set by hand.

## 9. Workflow G — Billing, payments, advances, refunds, insurance
- **How charges arrive:** every clinical action auto‑posts a **Bill Charge** to the patient's
  **open Billing Episode** — `Consultation`, `Investigation` (lab/radiology), `Pharmacy`,
  `OT Consumable`, `Package`.
- **Generate the bill** — `/billing` → `/billing/generate/:episodeId`: aggregates charges into a
  **Bill** (gross/discount/tax/net). Print or Download PDF.
- **Per‑department billing** — `/opd/billing`, `/lab/billing`, `/pharmacy/billing` (DepartmentBilling) for counter‑style billing of a single service type.
- **Payments** — recorded against the bill (Cash/Card/UPI/Cheque/Net Banking/Insurance), with
  multi‑allocation support; balance recomputed. Status → Unpaid / Partial / Paid.
- **Advance payments** — `/billing/advance` (e.g. IPD deposit); unutilised advance offsets the discharge balance.
- **Refunds** — `/billing/refunds` (Accountant).
- **Insurance claims** — `/billing/insurance` (tracked).
- **View** — the Bills list **View** action opens the new neat **half‑width Bill Details drawer** (header, patient, itemised charges, totals, Print/PDF).

## 10. Workflow H/I/J — HR, Equipment, Reports
- **HR & Payroll:** Employees `/employees`; Shifts `/hr/shifts`; Roster `/hr/roster`; Attendance (self `/attendance/mark`, admin `/admin/attendance`); Leave `/hr/leave-requests`; Salary structures `/hr/salary-structure`; Payroll `/hr/payroll`.
- **Equipment / Biomedical:** register `/equipment`; preventive `/equipment/preventive-maintenance`; requests/history `/equipment/maintenance`, `/equipment/maintenance-history`; calibration `/equipment/calibration`; calendar `/equipment/maintenance-calendar`.
- **Reports & Analytics:** dashboard `/dashboard`; `/reports`, `/reports/detailed`, `/reports/advanced`, analytics `/admin/analytics`. Exports to Excel/PDF. Finance reports are role‑scoped.

## 11. Background automation (no user action)
- **Daily IPD charges** — every day **01:00 IST**: posts recurring bed/inpatient charges for active admissions.
- **Inventory alerts** — every day **01:30 IST**: scans batches for **low stock / upcoming expiry** and raises notifications.
- (Scheduler: `node-cron`, timezone Asia/Kolkata.)

---

## 12. Permissions summary (read R / write W)
Admin = full. Sample of server‑enforced gates:

| Module | Doctor | Nurse | Recept. | Pharm. | LabTech | Radio. | Accts | HR |
|---|---|---|---|---|---|---|---|---|
| Patients | W | W | W | R | R | R | W | R |
| OPD consult | W | R | R | R | – | – | – | – |
| IPD care | W | W | R | R | – | – | – | – |
| Pharmacy/dispense | R | R | – | W | – | – | – | R |
| Lab | W | R | R | – | W | – | – | – |
| Radiology | W | R | R | – | – | W | – | – |
| Billing/payments | R | – | W | – | – | – | W | – |
| Payroll/salary | – | – | – | – | – | – | R | W |
| Reports (finance) | R | – | R | – | – | – | W | W |
| Audit log / Settings | – | – | – | – | – | – | – | – (Admin only) |

---

## 13. ✅ Correctness & gaps review (your "is this right / what's missing")

I traced the real code paths. Here is what is **solid**, what is **by design**, and what
you should **fix or double‑check**, with severity.

### What is working correctly (verified)
- **Billing is fully integrated and automatic.** Consultation, lab, radiology, pharmacy,
  OT consumables and packages all auto‑post charges to the patient's open episode. One bill collects everything.
- **OPD episode lifecycle** opens on check‑in/visit and is the spine of OPD billing.
- **IPD lifecycle** opens an episode + locks the bed on admission; discharge frees the bed + closes the episode.
- **IPD discharge enforces outstanding balance** (409 unless `force_discharge`). This is correct hospital behaviour.
- **Pharmacy dispense engine** is transactional, FEFO + expiry‑aware, reverses stock *and* billing on cancellation, and avoids IPD double‑billing (administration is clinical‑only).
- **Multi‑tenancy** — every request is confined to the caller's hospital; **RBAC** gates read/write per module; **audit log** records changes.

### ✅ Fixed in this pass (verified against code, then changed)

| # | Was | Fix applied |
|---|---|---|
| F1 | **Consultation fee silently ₹0** when no department‑specific `Consultation` charge exists. | `OpdConsultationController` now **falls back to any active hospital‑level `Consultation` charge** when a department‑specific one isn't configured, so the fee isn't dropped. *(Still configure per‑department rates to override.)* |
| F2 | **Discharge balance block had no UI override.** Backend returned 409 but `IPDDischarge.jsx` only showed an error — the cashier was stuck. | The discharge screen now catches the 409 and opens a **"Discharge anyway?"** confirm that re‑submits with `force_discharge`. Backend 409 message reworded for users (no developer wording). |
| F3 | **`GET /api/beds` ignored `status`/`ward_id`**, `deleteBed` was a hard delete (FK 500 risk), `getAllBeds` had an N+1. | `getAllBeds` now **honours `status`/`ward_id` filters** (backward‑compatible) and **batch‑loads** wards/hospital (no N+1); `deleteBed` is now a **soft delete** (`is_active=false`). |
| F4 | **Medicine add/edit form was fullscreen** (`width="100vw"`). | Now uses the reusable **half‑width `SliderModal`** (`width="50%"`), with the Reorder Level field surfaced and tool‑tipped. |
| F5 | **No UI warning when a charge wasn't configured** — consult/lab/radiology saved silently with the fee dropped. | `OpdConsultationController` now returns a `consultation_charge_added` flag; the consultation screen shows a **warning toast** when the consult fee wasn't billed, and another listing any **unpriced lab/radiology tests** that were ordered but not billed (saving still succeeds). |
| F6 | **Walk‑in pharmacy sales left `payment_mode = Pending`** with no way to record collection. | The dispense screen now shows a **Payment Mode** selector for walk‑in (counter) sales; the dispense engine persists it (`Cash/Card/UPI/…`) so counter revenue is reconciled. OPD/IPD sales still stay `Pending` (billing module collects). |
| F7 | **🔴 Security: "Admin‑only" API gates were open to every logged‑in user.** `authorize([])` (used for hospital writes, audit log, admin jobs) fell through to `next()` because of an `allowed.length &&` short‑circuit. | Fixed `authorize` so an empty role list denies all non‑Admins (Admin still bypasses). **Caught by the new test suite.** |
| F8 | **No automated tests** (`npm test` was a stub). | Added a runnable **`node:test`** suite (`npm test`, zero‑dependency) covering the RBAC primitives and the per‑module permission matrix — 20 tests, all passing. This is what surfaced F7. |

### ❌ Correction to the earlier review
- **My earlier "no per‑medicine reorder level" finding was WRONG.** The code already has it end‑to‑end:
  `Medicine.reorder_level` (default 100), the pharmacy dashboard low‑stock count uses it (not a hard‑coded `<100`),
  the **add/edit form** exposes it, and the **nightly alert job** raises low‑stock notifications via
  `available_quantity <= reorder_level`. No change needed beyond the form being half‑screen (done in F4).

### ⚠️ Still open (genuine, by priority)

| # | Severity | Finding | Recommended action |
|---|---|---|---|
| 1 | **Medium** | **Consultation/test fees still depend on the masters being set up.** With no `Consultation` charge (and no package) the consult fee is ₹0; an unpriced lab/radiology test bills ₹0. **The UI now warns** in these cases (F5), but the data is only billed once the masters are configured. | Configure a `Consultation` charge (ideally per department) and a `charge` on every lab/radiology test in their masters. |
| 2 | **Medium** | **Raw `createSale` / `createSaleDetail` bypass the dispense engine** (no consistent stock/billing). Only `dispenseMedicine` is safe. | Restrict or remove the raw create endpoints; route all dispensing through the engine. |
| 3 | **Low** | **IPD stock leaves at ward issuance, not at the bedside.** Ordered‑but‑not‑given doses can drift between ward stock and actual administration. | If accuracy matters, reconcile MAR vs. issued quantities, or move deduction to administration. |
| 4 | **Low** | **Test coverage is a starting point.** The new suite covers RBAC/permissions (pure logic). Transaction‑level flows (dispense, discharge, bill generation) still need integration tests against a test DB. | Add integration tests using a disposable MySQL/SQLite test database. |
| 5 | **Low (setup)** | **Frontend API URL default mismatch.** Frontend defaults to `http://localhost:5000/api` but the backend often runs on `8000`; it relies on `VITE_API_BASE_URL` being set. | Set `VITE_API_BASE_URL` in `.env` for local + deployed builds. |

### Things that are *by design* (not bugs — just so you're not confused)
- OPD/IPD pharmacy sale `payment_mode` stays `Pending`; **collection is owned by the billing module**. Walk‑in counter sales now capture the payment mode at dispense (F6).
- Nurse **medication administration** is intentionally a clinical log (no stock/bill).
- `medicines.available_quantity` is **derived** from batches — don't edit it directly.

---

### Bottom line
The **core clinical‑to‑cash flow is coherent and largely correct**: registration →
encounter → orders → pharmacy → one consolidated, auto‑populated bill → payment →
discharge with a balance guard. This pass fixed the consultation‑fee fallback, the
"unbilled charge" warnings, the discharge override, the bed API, the medicine form,
**walk‑in pharmacy payment capture**, and a **real "Admin‑only" authorization hole**
(F7) that the **new automated test suite** caught. Remaining items are smaller
hardening/coverage tasks (above).
