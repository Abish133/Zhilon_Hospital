# Hospital Management System (HMS) — Complete User Manual

**Read this first if you just bought the app.** This guide takes you from an empty
system to a fully running hospital, **step by step, role by role, in plain language**.
It is written from the actual screens and the actual backend behaviour (verified in
code, not assumed).

It is organised the way you will actually use it:

- **Part A — Admin first-time setup.** Start here. The Admin registers the hospital
  and enters all the "master data" the rest of the app depends on.
- **Part B — Day-to-day work, one role at a time.** Receptionist → Nurse → Doctor →
  Lab → Radiology → Pharmacy → Accountant → HR → Employee.
- **Part C–F — How billing auto-collects money, what runs automatically,
  who-can-do-what, and an honest correctness review.**

> **Conventions**
> - **URL** = the in-app address (e.g. `/opd/queue`). In a local dev setup that is
>   `http://localhost:5173/opd/queue`.
> - **Auto** = the system fills it for you (hospital, logged-in user, dates, tokens,
>   UHID, billing links). You never type these.
> - **Golden rule:** the flow is *chained by IDs*. You move a patient forward by
>   clicking the button on their row — you almost never type an ID by hand.

---

## The big picture (read once)

A patient's journey and the money follow the **same spine**:

```
Register patient → Book/Check-in → Vitals → Consultation → Orders (Lab/Radiology)
      → Pharmacy → ONE bill (auto-filled) → Payment → (IPD: Discharge)
```

Every clinical action **automatically posts its charge** to that patient's single
open "billing episode", so at the end the cashier settles **one bill** that already
contains the consultation, tests, medicines and room charges.

**But none of the dropdowns work until the master data exists.** That is why the
Admin setup in Part A must be done **first and in order**.

### The 10 roles at a glance

| Role | What they do in the system |
|---|---|
| **Admin** | Everything. Registers the hospital, sets up all master data, creates users, settings, audit. |
| **Receptionist** | Registers patients, books appointments, checks in, manages beds, collects OPD payments. |
| **Doctor** | Consultations, orders tests, prescriptions, IPD care, OT, discharge. |
| **Nurse** | Vitals, IPD daily care, medication administration, nurse assignment, nursing checklist. |
| **Pharmacist** | Dispenses medicines (walk-in/OPD/IPD), manages medicines, batches, procurement. |
| **LabTech** | Lab orders, sample collection, result entry, reports. |
| **Radiologist** | Radiology orders, scheduling, imaging, reports. |
| **Accountant** | Bills, payments, advances, refunds, insurance, finance reports. |
| **HR** | Employees, doctors, shifts, roster, attendance, payroll, equipment. |
| **Employee** | Self-service: mark attendance, request leave, edit profile. |

Access is enforced **on the server** for every request, and the **menu is filtered**
by your role — so each person only sees the screens they're allowed to use.
**Admin sees and can do everything.**

---

# PART A — ADMIN: First-time setup

Do these in order. Each step unlocks dropdowns used by the next.

## A0. Register your hospital — `/setup`

This is the very first screen on a brand-new system. It has two steps.

**Step 1 — Hospital details.** Fields and what they mean:

| Field | Required | What to enter |
|---|---|---|
| **Hospital name** | Yes | Your facility's official name. Appears on bills, patient cards, reports. |
| **Type** | Yes | `General Hospital`, `Specialty Hospital`, or `Clinic`. |
| **License number** | Yes | Your medical license / registration number. |
| **Address** | Yes | Street, city, state. Prints on bills and the back of the patient card. |
| **Phone** | Yes | Main contact number (prints on patient card / bills). |
| **Email** | Yes | Official contact email. |

Click **Continue**.

**Step 2 — Administrator account.** This is your first login:

| Field | Required | Notes |
|---|---|---|
| **Full name** | Yes | The admin's name. |
| **Email** | Yes | This becomes your **login username**. |
| **Password** | Yes | Minimum 8 characters. |
| **Confirm password** | Yes | Must match. |

Click **Create account** → you'll see "You're all set" → **Go to sign in**.

> **Auto:** the hospital gets an internal ID; your account is created with role
> **Admin** and linked to this hospital. Everything you create from now on lives
> inside this hospital (the system is multi-tenant and isolates each hospital's data).

## A1. Sign in — `/login`

Log in with the admin email + password you just created. You land on the
**Dashboard**. The left sidebar is your menu.

## A2. Finish the hospital profile & branding — `/settings`

Open **Settings** (gear icon, Admin only). Tabs:

- **General** — full hospital profile (name, license, address, phone, email,
  GST number, PAN, registration number, website). Fill these so they print correctly.
- **Branding** — **upload your logo** (shows on the sidebar, bills, and patient
  cards). Upload sends the image and stores it; the preview updates.
- **Billing** — **tax percentage** and **numbering prefixes** (e.g. UHID prefix
  `NBH`, bill prefix `BILL`). These drive auto-generated numbers and tax on bills.
- **Notifications** — toggle system notifications.
- **Departments** — add/edit departments (you can also do this here, see A3).

Click **Save** on each tab you edit.

## A3. Create departments — `/settings` (Departments tab)

Departments are used everywhere: a doctor belongs to one, consultation charges are
priced per department, and billing routes by department.

For each department enter: **Department code** (e.g. `GEN`), **Department name**
(e.g. General Medicine), **Type** (Clinical or Support). Create at least:
General Medicine, plus any specialties you run (Cardiology, Pediatrics, Orthopedics,
Gynecology, Neurology…), and support depts (Laboratory, Radiology, Pharmacy).

## A4. Add doctors — `/admin/doctors`

For each doctor: **name, specialization, registration number, email, phone,
experience, department**. Then add (from the same area / doctor profile):

- **Qualifications** — `/admin/doctor-qualifications` (degrees, councils, validity).
- **Schedules** — `/admin/schedules`: **day of week, start/end time, slot duration,
  max appointments per day**. ⚠️ **Appointments can only be booked inside a doctor's
  schedule** — no schedule means no bookable slots.
- **Leaves** — `/admin/doctor-leaves`: approved leave **blocks** booking on those dates.

## A5. Create staff users & employees

Two related things:

1. **Employees** — `/employees` (HR/Admin): the person's HR record (code, name,
   contact, role, department, joining date). Needed for nurse assignment & payroll.
2. **Users / logins** — `/admin/users` (Admin only): the **login account** with an
   email, password and **role**. Create one user per staff member who needs to log in
   (Receptionist, Nurse, Doctor, Pharmacist, LabTech, Radiologist, Accountant, HR,
   Employee). The role you pick here decides what menu and permissions they get.

## A6. Charge Master — `/admin/charges` ⚠️ **the most important step**

This is the **price list**. The system auto-bills using it.

For each service enter: **service code, service name, service type**
(`Consultation`, `Room`, `Procedure`, etc.), **department**, **charge amount**,
**GST %**. At minimum, create a **Consultation** charge **for every clinical
department**, and a **Room** charge per ward type.

> ⚠️ **Critical:** if a department has **no `Consultation` charge**, the doctor's
> consultation is still recorded but **₹0 is billed** for it (the app now shows a
> warning, but the money is only captured once the charge exists). The same applies
> to any lab/radiology test with no `charge` set. **Configure prices before going live.**

## A7. Service packages — `/admin/packages`

Optional. Bundle services into a fixed-price package (e.g. "Maternity package").
When a package covers a service, that individual fee is skipped and a package credit
is used instead.

## A8. Wards & beds — `/ipd/wards` and `/beds/management`

Needed for inpatient admissions.

- **Wards** — name, type (General/Private/ICU), floor, department.
- **Beds** — room number, bed number, type, **charge per day**, ward. Only
  **Available** beds appear when admitting.

## A9. OT rooms — `/ot/rooms`

If you do surgery: create operating theatre rooms so OT bookings have a place to go.

## A10. Pharmacy masters — `/pharmacy/medicine-categories`, `/pharmacy/medicines`

- **Categories** (Analgesics, Antibiotics…).
- **Medicines** — code, name, category, dosage form, manufacturer, and **reorder
  level** (the low-stock threshold used by the nightly alert job).
- **Stock** comes in via **batches** (A11/GRN), not typed by hand — see Part B Pharmacy.

## A11. Inventory & vendors — `/inventory/categories`, `/inventory`, `/inventory/vendors`

- **Inventory categories** and **items** (gloves, syringes, consumables) with reorder levels.
- **Vendors** — suppliers for purchase orders and goods receipt.

## A12. Lab & radiology test masters

- **Lab tests** — `/lab/test-master`: test code, name, category, sample type,
  normal range, turnaround time, **charge**.
- **Radiology tests** — `/radiology/test-master`: code, name, modality, body part,
  prep instructions, duration, **charge**.

## A13. HR masters — `/hr/shifts`, `/hr/salary-structure`

- **Shifts** — for the duty roster.
- **Salary structures** — per employee, the basis for monthly **payroll**.

### ✅ Admin setup checklist

| # | Set up | URL | Unlocks |
|---|---|---|---|
| 1 | Hospital + admin account | `/setup` | Logging in |
| 2 | Hospital profile, logo, tax, numbering | `/settings` | Branding, GST, auto numbers |
| 3 | Departments | `/settings` (Departments) | Doctors, charges, routing |
| 4 | Doctors + schedules + leaves | `/admin/doctors`, `/admin/schedules` | Appointments, consults |
| 5 | Employees + user logins | `/employees`, `/admin/users` | Staff access |
| 6 | **Charge Master** | `/admin/charges` | **Auto-pricing** |
| 7 | Packages | `/admin/packages` | Package billing |
| 8 | Wards & beds | `/ipd/wards`, `/beds/management` | IPD admission |
| 9 | OT rooms | `/ot/rooms` | OT bookings |
| 10 | Medicine categories + medicines | `/pharmacy/...` | Prescribing/dispensing |
| 11 | Inventory items + vendors | `/inventory/...` | Consumables, GRN |
| 12 | Lab & radiology test masters | `/lab/test-master`, `/radiology/test-master` | Diagnostics |
| 13 | Shifts + salary structures | `/hr/shifts`, `/hr/salary-structure` | Roster, payroll |

Once this is done, your staff can log in and work. The rest of the manual is what
**each role** does day to day.

---

# PART B — Daily operation, role by role

## B1. Receptionist — the front desk

**Logs in and mostly lives in:** Patients, OPD, Beds, OPD Billing.

**1) Register a new patient — `/patients` → "Register New Patient".**
Fill the form (it opens in a drawer):

| Field | Required | Notes |
|---|---|---|
| First / Last name | Yes | — |
| Gender | Yes | — |
| Date of Birth | Yes | **Age is auto-calculated** from this. |
| Mobile | Yes | 10 digits starting 6–9. |
| City, State | Yes | — |
| Blood group, marital status, email, pincode | No | Optional. |
| Alternate mobile, Aadhaar (12 digits), ABHA ID/address | No | Optional IDs. |
| Insurance status / provider / policy number | No | If the patient has insurance. |
| Address lines, Emergency contact name/number | No | Recommended. |

**Auto:** a unique **UHID** is generated. After saving, the **Patient ID Card**
drawer opens — you can **Print** or **Download PDF** (front = patient details,
back = hospital details & contact).

**2) Book an appointment — `/appointments/book` (or `/opd/appointments`).**
Pick patient → doctor → department → date → time slot (only times inside the
doctor's schedule are valid; booked/leave dates are blocked). Status becomes
`Booked`.

**3) Check the patient in** — `/opd/appointments`, click **Check-in** on their row.
- **Auto:** an **OPD Visit** is created with a **token number**, and an **OPD billing
  episode opens**. The patient now appears on the **Queue** and **Today's Board**.
- **Walk-in (no appointment):** go to `/opd/visits` → **Register Visit** (or add a
  walk-in card on the board). Same auto-token + episode.

**4) Use the live board** — `/opd/board` (**OPD → Today's Board**): see every
patient under their current step (Booked → Checked-in → In Consultation →
Completed) and move them forward with one click.

**5) Collect OPD payment** — `/opd/billing` or `/billing` (see Accountant section).

> **Tip — filters:** Appointments and Visits default to **today**. Use the search
> (name / UHID / mobile), the **date range**, appointment ID / token, and status
> filters to find anyone quickly.

## B2. Nurse — vitals & inpatient care

**1) Record OPD vitals — `/opd/vitals/:visitId`** (open from the Queue/Board "Vitals"
button): BP, pulse, temperature, respiratory rate, SpO₂, weight, height
(**BMI auto-calculates**).

**2) IPD daily care:**
- **Vitals** — `/ipd/vitals/:admissionId` (only while the patient is Admitted).
- **Progress notes & orders** — `/ipd/care/:admissionId`.
- **Medication administration (MAR)** — record each dose given. **Note:** this is a
  **clinical log only** — it does **not** move stock or bill (that already happened
  when pharmacy issued the medicine, to avoid double-charging).
- **Nurse assignment** — `/ipd/nurse-assignments`; **nursing checklist** — `/ipd/nursing-checklist`.

## B3. Doctor — consultation & orders

**1) Open the patient** from the **Queue** (`/opd/queue`) or **Today's Board** →
**Consult** → `/opd/consultation/:visitId`.

**2) Write the consultation:** chief complaints, examination findings, **diagnosis**,
treatment plan, follow-up date and instructions.
- **Auto:** the **consultation fee** is added to the bill from the **Charge Master**
  (by your department). If you set a follow-up date, a **follow-up appointment is
  auto-created**. If a package covers it, the fee is skipped.
- ⚠️ If no consultation charge is configured for your department, you'll see a
  **warning** that the fee wasn't billed (fix in Charge Master).

**3) Order tests** (within the consultation/orders): **Lab** and **Radiology** orders
**auto-post an "Investigation" charge** to the open episode.

**4) Prescribe medicines:** prescription lines save as `Pending` until pharmacy dispenses.

**5) IPD / OT (if applicable):** admit, write progress notes, order meds, book OT,
and finally **discharge** (`/ipd/discharge/:admissionId`).

## B4. Lab Technician — `/lab`

1. **See orders** — `/lab` (doctors' lab orders arrive here; each already posted an
   investigation charge).
2. **Collect sample** — record sample collection on the order.
3. **Enter results** — `/lab/results/:orderId`; flag **critical values**.
4. **Report** — `/lab/report/:orderId`; the verified report shows in the patient timeline.

## B5. Radiologist — `/radiology`

1. **Orders** — `/radiology`.
2. **Schedule** — `/radiology/scheduling`.
3. **Imaging** — `/radiology/imaging/:orderId`.
4. **Report** — `/radiology/report/:orderId` (appears in the patient timeline).

## B6. Pharmacist — dispensing & stock

**Dispensing** (one safe engine, three contexts):
- **Walk-in counter** — `/pharmacy/dispense` → Add Manual Item. Deducts stock, records
  a sale, and you pick the **Payment Mode** (Cash/Card/UPI) right there.
- **OPD (prescription-linked)** — `/pharmacy/dispense`: only **not-yet-dispensed**
  prescriptions show. Pick the lines → **Complete Dispense**. **Auto:** earliest-expiry
  batch is picked, stock deducted, a **Pharmacy charge** posts to the OPD episode, and
  the prescription is marked `Dispensed`.
- **IPD ward issuance** — `/pharmacy/ipd`: issue to an admitted patient. **Auto:** stock
  deducted once, Pharmacy charge posts to the admission's episode.

**Stock comes in through procurement** (never typed directly):
1. **Purchase Order** — `/inventory/purchase-orders`.
2. **Goods Receipt (GRN)** — `/inventory/goods-receipt`: for medicines this
   **creates/tops up a batch** (expiry, rates, vendor); for general items it adds stock.
3. **Manual batch** — `/pharmacy/batches` (same effect, no PO).
4. **Issue/return between stores** — `/inventory/issue-return`.

> A medicine's `available_quantity` is **derived from its active batches** and
> refreshed automatically — don't edit it by hand.

## B7. Accountant — billing & money

- **Generate a bill** — `/billing` → open the patient's episode →
  `/billing/generate/:episodeId`. Every charge already collected (consultation +
  investigations + pharmacy + room + packages) is shown. **Generate**, take
  **payment** (Cash/Card/UPI/Cheque/Net Banking/Insurance), then **Print / Download PDF**.
  The **Bill Details** view opens in a half-width drawer.
- **Per-department billing** — `/opd/billing`, `/lab/billing`, `/pharmacy/billing` for
  quick counter-style billing of a single service type.
- **Advance payments** — `/billing/advance` (e.g. IPD deposit); unused advance offsets
  the discharge balance.
- **Refunds** — `/billing/refunds`. **Insurance claims** — `/billing/insurance`.

## B8. HR — people & payroll

- **Employees** — `/employees`. **Doctors** — `/admin/doctors`.
- **Shifts** `/hr/shifts` → **Roster** `/hr/roster`.
- **Attendance** — staff mark their own at `/attendance/mark`; HR reviews at `/admin/attendance`.
- **Leave requests** — `/hr/leave-requests` (approve/reject).
- **Salary structures** `/hr/salary-structure` → **Payroll** `/hr/payroll` (generate, approve, pay).
- **Equipment / biomedical** — `/equipment` (register, maintenance, calibration, history).

## B9. Employee — self-service

- **Mark attendance** — `/attendance/mark`.
- **Request leave** — `/hr/leave-requests`.
- **Edit profile** — `/profile`.


---

# PART C — How one bill collects everything

- Every clinical action **auto-posts a Bill Charge** to the patient's **open Billing
  Episode**: `Consultation`, `Investigation` (lab/radiology), `Pharmacy`,
  `OT Consumable`, `Package`, plus **daily IPD/bed charges**.
- **Generate** at `/billing/generate/:episodeId` aggregates them into a Bill
  (gross → discount → tax → net). Print or download PDF.
- **Payments** support multiple modes and partial allocation; status moves
  Unpaid → Partial → Paid.
- **IPD discharge has a balance guard:** discharge is **blocked** if there's an
  outstanding balance, unless an override (`force_discharge`, e.g. LAMA/medico-legal)
  is used. Settle the bill, then discharge frees the bed and closes the episode.

---

# PART D — What runs automatically (no user action)

- **Daily IPD charges** — every day **01:00**: posts recurring bed/inpatient charges
  for active admissions.
- **Inventory alerts** — every day **01:30**: scans batches for **low stock / upcoming
  expiry** and raises notifications.
- (Scheduler: `node-cron`, timezone Asia/Kolkata.)

---

# PART E — Who can do what (permissions)

Admin = full. The server enforces these per module (read **R** / write **W**):

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
| Audit log / Settings | – | – | – | – | – | – | – | Admin only |

The menu each person sees is filtered to match — so users aren't shown screens they
can't use.

---

# PART F — Correctness & gaps review

Traced against the real code. What's solid, what's by design, what to watch.

### Working correctly (verified)
- **Billing is fully integrated and automatic** — consultation, lab, radiology,
  pharmacy, OT consumables and packages all auto-post to the patient's open episode;
  one bill collects everything.
- **OPD/IPD episode lifecycles** open on check-in/admission and close on completion/discharge.
- **IPD discharge enforces outstanding balance** (override available) — correct hospital behaviour.
- **Pharmacy dispense engine** is transactional, earliest-expiry-first, reverses stock
  *and* billing on cancellation, and avoids IPD double-billing (administration is clinical-only).
- **Multi-tenancy & RBAC** — every request is confined to the caller's hospital;
  read/write is gated per module; changes are audited.

### Things that are *by design* (not bugs)
- OPD/IPD pharmacy sale `payment_mode` stays `Pending` — **collection is owned by the
  billing module**. Walk-in counter sales capture the payment mode at dispense.
- Nurse **medication administration** is a clinical log (no stock/bill movement).
- `medicines.available_quantity` is **derived** from batches — don't edit it directly.

### Still worth watching
| Severity | Finding | Action |
|---|---|---|
| Medium | Consultation/test fees depend on the **masters being set up**. No charge → ₹0 (UI warns). | Configure a `Consultation` charge per department and a `charge` on every lab/radiology test before go-live. |
| Low | IPD stock leaves at **ward issuance**, not at the bedside. | If precision matters, reconcile MAR vs. issued quantities. |
| Low (setup) | Frontend needs `VITE_API_BASE_URL` pointing at the backend. | Set it in `.env` for local and deployed builds. |

### Bottom line
The **core clinical-to-cash flow is coherent and largely correct**: register →
encounter → orders → pharmacy → one consolidated, auto-filled bill → payment →
discharge with a balance guard. Get the **Admin master data (Part A) right — especially
the Charge Master — and the rest runs smoothly.**
