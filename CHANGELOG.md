# HMS Bug Fix Changelog
**Date:** April 2026 | **Fixes Applied:** 35 issues resolved across 50+ files

---

## 🔴 Critical Bugs Fixed

### BUG-001 — Raw axios Without Auth Token
**Files:** `src/pages/ipd/IpdMedications.jsx`, `src/pages/IpdPatientDetails.jsx`
- Replaced all raw `axios` calls with authenticated `apiClient`
- All IPD medication orders and patient details now send JWT token correctly

### BUG-002 — OPD Blood Pressure Never Displayed
**Files:** `src/pages/opd/OPDVitals.jsx`, `src/pages/opd/OPDConsultation.jsx`, `backend/src/controllers/OpdVitalController.js`, `backend/src/models/OpdVital.js`, `backend/src/migrations/091_add_bp_fields_to_opd_vitals.js`
- Split single `blood_pressure` string into `bp_systolic` + `bp_diastolic` numeric fields
- Migration `091` adds both columns to `opd_vitals` table
- OPDConsultation now correctly reads `vitals.bp_systolic`/`vitals.bp_diastolic`
- BMI is now also saved (was calculated but never persisted)
- After saving vitals, navigates directly to consultation (better UX flow)

### BUG-003 — Stale Duplicate IpdVitalsForm
**File:** `src/pages/IpdVitalsForm.jsx`
- Deleted the stale root-level duplicate that used raw axios

### BUG-004 — hospital_id Hardcoded as 1 in 10 Files
**Files:** `OPDVisits.jsx`, `AppointmentBooking.jsx`, `AdvancePayment.jsx`, `GoodsReceipt.jsx`, `PurchaseOrders.jsx`, `OTConsumables.jsx`, `OTRooms.jsx`, `OTManagement.jsx`, `OTIntraOpNotes.jsx`
- All replaced with `user?.hospital_id` from `useAuthStore`

### BUG-005 — PatientDetail History Tabs Always Empty
**Files:** `src/services/OpdAppointmentService.js`, `src/services/IpdAdmissionService.js`, `src/pages/patients/PatientDetail.jsx`
- Added `getByPatient(uhid)` to both services
- Fixed column renders: `r.doctor?.name`, `r.admittingDoctor?.name`, `r.ward?.ward_name`

### BUG-006 — api.js Missing Fallback URL
**File:** `src/config/api.js`
- Added `|| 'http://localhost:5000/api'` fallback

---

## 🟠 High Severity Fixes

### HIGH-001 + HIGH-004 — N+1 Queries + Missing Hospital Filter in IpdAdmissionController
**File:** `backend/src/controllers/IpdAdmissionController.js`
- `getAllAdmissions`, `getAdmissionById`, `updateAdmission` now use Sequelize `include` (JOINs)
- Added `hospital_id` filter to `getAllAdmissions` — no more cross-hospital data leaks
- Supports `?uhid=` and `?status=` query filters
- Performance improvement: 100 admissions = 1 query instead of 700+

### HIGH-002 — Billing.jsx Used Raw fetch()
**File:** `src/pages/billing/Billing.jsx`
- Complete rewrite using `apiClient` throughout
- Token expiry now triggers proper redirect instead of silent 401

### HIGH-003 — Missing Sidebar Navigation Items
**File:** `src/components/layout/AppLayout.jsx`
- Added: Inventory → Purchase Orders, Goods Receipt (GRN), Issue & Return
- Added: Pharmacy → IPD Pharmacy

### HIGH-005 — ipdVitalsController Inconsistent Response Shape
**File:** `backend/src/controllers/ipdVitalsController.js`
- All responses now return `{ success: true, data: ... }` standard wrapper

### HIGH-006 — IPD Discharge JSON Crash
**File:** `src/pages/ipd/IPDDischarge.jsx`
- Replaced plain text area with structured `InputNumber` fields for discharge vitals
- No more `JSON.parse` crash on free-text input

### HIGH-007 — OPD Consultation Duplicate Prevention
**File:** `src/pages/opd/OPDConsultation.jsx`, `backend/src/controllers/OpdConsultationController.js`
- On load, fetches existing consultation for the visit and populates form (edit mode)
- Backend `getAllConsultations` now supports `?visit_id=` filter
- Submit button shows "Update" vs "Save" based on state
- Post-save shows Print Prescription button

### HIGH-008 — OPD Token Number Bug
**File:** `src/pages/opd/OPDVisits.jsx`
- Token now calculated from today's visits only using `reduce` (no `Math.max(...spread)` stack overflow risk)

### HIGH-009 — Lab Orders N+1
**Files:** `src/pages/lab/LabOrders.jsx`, `backend/src/controllers/LabOrderController.js`, `backend/src/models/LabOrder.js`
- Added `hasMany LabOrderDetail` association to LabOrder model
- `getAllLabOrders` now uses Sequelize `include` with details embedded
- Frontend no longer fires per-order detail requests in a loop

### HIGH-010 — OPD Queue Timezone Issue
**File:** `src/pages/opd/OPDQueue.jsx`
- Passes `visit_date` and `hospital_id` as server-side query params
- Server filters by date, eliminating UTC/IST mismatch

---

## 🟡 Medium Severity Fixes

### MEDIUM-001 — 146 console.log Statements Removed
- Removed from 44 frontend files and 4 backend files
- Some were logging full patient PHI data to browser console

### MEDIUM-007 — OPD Visit Doctor Required
**File:** `src/pages/opd/OPDVisits.jsx`
- Doctor field now required with validation message

### MEDIUM-008 — Progress Note Type Detection
**File:** `src/pages/ipd/IPDDailyCare.jsx`
- Added explicit "Note Type" dropdown (Doctor / Nurse / Physiotherapist / Dietitian)
- No longer inferred from which text field is filled

### MEDIUM-009 — Lab Sample Barcode Print
**File:** `src/pages/lab/LabOrders.jsx`
- After sample collection, automatically opens a print window with formatted label
- Label includes barcode, patient name, UHID, tests ordered, collection time

### MEDIUM-010 — Existing Consultation Pre-fill
**File:** `src/pages/opd/OPDConsultation.jsx`
- Fetches any existing consultation for the visit on load
- Form pre-populated with existing data for editing
- Alert banner shown when editing existing record

### MEDIUM-011 — Discharge Without Bill Warning
**Files:** `src/pages/ipd/IPDDischarge.jsx`, `backend/src/controllers/BillController.js`, `backend/src/routes/billRoutes.js`
- Added `GET /bills/admission/:admissionId` endpoint
- Discharge page fetches outstanding balance on load
- Shows warning banner with outstanding amount and "Go to Bill" button

### MEDIUM-012 — Global Search Button Non-functional
**File:** `src/components/layout/AppLayout.jsx`
- Implemented patient search modal triggered by header search button
- Searches by name, UHID, or mobile number
- Clicking result navigates to patient detail page

---

## 🟢 Low Severity Fixes

### LOW-001 — Mixed Auth Patterns
- `Doctors.jsx` updated from `AuthService.getCurrentUser()` to `useAuthStore`

### LOW-004 — Duplicate `/ipd/progress-notes` Route
**File:** `src/router.jsx`
- Removed the redundant route that pointed to the same `IPDDailyCare` component

### LOW-005 — isLoading → isPending (React Query v5)
- Fixed in 9 files: admit button spinner now works correctly

### LOW-007 — Missing .env.example
- Created `backend/.env.example` with all required environment variables
- Created `frontend/.env.example`

### LOW-008/009 — Inconsistent Route Naming
- `/inventorycategory` → `/inventory/categories`
- `/medicine-category` → `/pharmacy/medicine-categories`
- Both router and sidebar updated

### LOW-012 — No Pagination on getAllVitals
**File:** `backend/src/controllers/OpdVitalController.js`
- Added `page` / `pageSize` query params with max 200 per page

---

## Additional Backend Improvements

- `OpdConsultationController.getAllConsultations` — Added Sequelize include, hospital scope, visit_id/patient_id filters (eliminates N+1)
- `OpdAppointmentController.getAllAppointments` — Added Sequelize include, hospital scope, uhid/date filters (eliminates N+1)
- `IpdAdmissionController.updateAdmission` — Return value now uses Sequelize include instead of N+1 findByPk calls
- `OpdVitalController.getAllVitals` — Added hospital scope, visit_id filter, pagination
- `OpdVitalController.createVital` — Accepts both `bp_systolic`/`bp_diastolic` and legacy `blood_pressure` string
- `OpdConsultation model` — Added `Patient` and `OpdVisit` associations
- `helpers.js` — Added `maskAadhaar()` and `maskMobile()` utilities

---

## Database Migrations Added

| Migration | Description |
|-----------|-------------|
| `091_add_bp_fields_to_opd_vitals.js` | Adds `bp_systolic` (INT) and `bp_diastolic` (INT) columns to `opd_vitals` table |

**Run after deploying:**
```bash
cd backend && npm run migrate
```
