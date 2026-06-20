# IPD + OT Flow — Frontend Walkthrough (click-by-click)

This guide is written **as per the actual frontend screens**. For every step you get:
the **URL**, how to reach it, the **fields the form actually shows** (with the data to type),
what the app fills in for you automatically, and how to verify it worked.

> **URLs:** during development the frontend runs at **`http://localhost:5173`**, so a path
> like `/ipd/admit` means `http://localhost:5173/ipd/admit`. (In the deployed build it's the
> same paths on your hospital's domain.)
>
> **Golden rule:** you only ever type the **visible fields**. The app automatically attaches
> `hospital_id`, `uhid`, the logged-in user, dates/times, tokens, status changes and the
> billing episode. Never type those yourself.
>
> **The flow is chained by IDs:** patient → admission → (OT) booking. Keep moving forward
> from the list screens; you rarely type an ID by hand.

---

## 0. Log in
- **URL:** `/login`
- **Data (seed admin):** Email `admin@nbh.in` · Password `password123`
- An **Admin** login can use every screen below. (Other roles are limited by their permissions.)

## Prerequisites — master data must already exist
The forms pick these from dropdowns, so make sure they exist first:

| Master | URL | Used for |
|---|---|---|
| Doctors | `/admin/doctors` | admitting doctor, surgeon, anesthetist |
| Departments | `/settings` | admission department |
| Wards | `/ipd/wards` | ward dropdown |
| Beds | `/beds/management` | bed dropdown (must be **Available**) |
| OT Rooms | `/ot/rooms` | OT booking |
| Inventory items | `/inventory` | OT consumables (need stock) |
| Nurses (employees) | `/employees` | nurse assignment, discharge nursing summary |

---

# STEP 1 — Register the patient
- **URL:** `/patients` → click **“Register New Patient”** (opens a popup form)
- **Fill these fields:**

| Field | Required | Sample value |
|---|---|---|
| First Name | ✅ | `Ramesh` |
| Last Name | ✅ | `Kumar` |
| Gender | ✅ | `Male` |
| Date of Birth | ✅ | `15-06-1980` |
| Blood Group | – | `B+` |
| Mobile | ✅ (10 digits, starts 6–9) | `9876543210` |
| Email | – | `ramesh@example.com` |
| City | ✅ | `Pune` |
| State | ✅ | `Maharashtra` |
| Pincode | – (6 digits) | `411001` |
| Insurance Status | – | `Yes` |
| Insurance Provider / Policy Number | – | `Star Health` / `SH-558899` |
| Emergency Contact Name / Number | – | `Sita Kumar` / `9876500000` |

- **Auto:** **Age** is computed from DOB; **UHID** is generated automatically (e.g. `UHID-2026-000001`).
- **Verify:** the new patient appears in the list at `/patients`. Note the **UHID** — you'll search by it next.
- ⚠️ Mobile number must be **unique** — you cannot register two patients with the same mobile.

---

# STEP 2 — Admit the patient to IPD
- **URL:** `/ipd/admit`  (or go to `/ipd` and click **“Admit Patient”**)
- **Fill these fields:**

| Field | Required | Sample value |
|---|---|---|
| Patient | ✅ | search `Ramesh` / UHID and select |
| UHID | (auto-fills when you pick the patient) | — |
| Admitting Doctor | ✅ | `Dr. Sanjay Mehta - Orthopedics` |
| Department | – | `General Medicine` |
| Ward | ✅ | `General Ward A` |
| Bed | ✅ (only **Available** beds show, after you pick the ward) | `Room 201 - Bed G5` |
| Admission Date | – | today/now |
| Admission Type | – | `Planned` (or `Emergency`) |
| Reason for Admission | ✅ | `Acute appendicitis, for surgery` |
| Provisional Diagnosis | – | `Acute appendicitis` |
| Advance Amount | ✅ | `10000` |

- **Auto:** the **bed is locked to Occupied**, an **IPD billing episode is opened**, and `hospital_id`/`admitted_by` are attached.
- **Verify:** the patient shows in the `/ipd` list with status **Admitted**; the bed shows **Occupied** in `/beds/management`.
- ⚠️ If a bed is already taken you'll get **“Bed is Occupied”** — pick another.

---

# The IPD hub — `/ipd` (IPD Admissions list)
Every following step starts from a patient's **row** here. Each admitted patient has these buttons:

| Button | Goes to | For |
|---|---|---|
| **View** | `/ipd/care/:admissionId` | Daily Care (Progress Notes, Medications, Orders, Discharge) |
| **Vitals** | `/ipd/vitals/:admissionId` | record vital signs |
| **Transfer** | (popup) | move to another ward/bed |
| **Patient Details** | `/ipd/patient/:admissionId` | full record |
| **Discharge** | `/ipd/discharge/:admissionId` | discharge the patient |

---

# STEP 3 — Daily care while admitted

## 3a — Record Vitals
- **URL:** `/ipd/vitals/:admissionId`  → reached by the **“Vitals”** button on the patient row
- **Fill (all optional, enter what's measured):**

| Field | Sample |
|---|---|
| Systolic BP | `122` |
| Diastolic BP | `80` |
| Pulse Rate | `78` |
| Temperature (°F) | `98.6` |
| Respiratory Rate | `16` |
| SpO2 (%) | `98` |
| Blood Sugar | `105` |
| Consciousness | `Alert` |
| Pain Scale (0–10) | `3` |
| Intake (ml) / Output (ml) | `500` / `450` |
| Notes | `Stable` |

- Click **Record Vitals**.
- **Auto:** patient, recorded-by user, date & time, hospital — all attached for you.
- **Verify:** the entry appears in the **Vitals History** table below the form.
- ⚠️ Vitals only save while the admission status is **Admitted** (i.e. before discharge).

## 3b — Progress Notes  *(this is a tab, not a separate page)*
- **URL:** `/ipd/care/:admissionId` → **“View”** button on the row → **“Progress Notes”** tab
- **Fill in the “Add Note” box:**

| Field | Required | Sample |
|---|---|---|
| Note Type | ✅ | `Doctor` (also: Nurse / Physiotherapist / Dietitian) |
| Clinical Notes | ✅ | `Appendicitis confirmed, plan appendectomy` |
| Nursing Notes | – | `Patient comfortable, afebrile` |
| Vitals | – (free text) | `BP 122/80, Pulse 78, Temp 98.6` |
| Intake/Output | – (free text) | `Intake 500ml, Output 450ml` |

- Click **Add Progress Note** — it appears in the table below.
- **Auto:** admission, patient, date/time, recorded-by, hospital are all filled for you (you only choose Type + type the notes).

## 3c — Medications  *(tab on the same Daily Care page)*
- **URL:** `/ipd/care/:admissionId` → **“Medications”** tab → **“Order Medications”**
- Add one or more medicine rows:

| Field | Required | Sample |
|---|---|---|
| Medicine | ✅ | `Ceftriaxone` (from dropdown) |
| Dosage | ✅ | `1g` |
| Frequency | ✅ | `BD` (OD/BD/TID/QID/PRN/STAT) |
| Route | – | `IV` (Oral/IV/IM/SC/Topical) |
| Days | ✅ | `5` |
| Start Date | ✅ | today |
| Instructions | – | `After meals` |

- Click **Order All Medications**. Each shows as **Active**; you can later **Complete** or **Stop** it (Stop asks for a reason).

## 3d — Orders (labs / radiology / pharmacy / procedure)  *(tab on the same page)*
- **URL:** `/ipd/care/:admissionId` → **“Orders”** tab → **“Place Order”**

| Field | Required | Sample |
|---|---|---|
| Order Type | ✅ | `Lab` (Lab/Radiology/Pharmacy/Procedure) |
| Order Details | ✅ | `CBC, LFT` |

- Click **Place Order** — it lists in the Orders table with status **Pending**.

## 3e — (Optional) Nurse assignment & nursing checklist
- Nurse assignment: `/ipd/nurse-assignments` · Nursing checklist: `/ipd/nursing-checklist` — same idea, picked per admission.

---

# STEP 4 — Book the Operation Theatre (OT)
- **URL:** `/ot` → click **“Book OT”** (popup form)
- **Fill:**

| Field | Required | Sample |
|---|---|---|
| Patient | ✅ | select `Ramesh Kumar` |
| UHID | (auto when patient picked) | — |
| Admission ID | – | select this patient's IPD admission |
| Surgery Name | ✅ | `Appendectomy` |
| Surgeon | ✅ | `Dr. Sanjay Mehta` |
| Assistant Surgeon | – | another doctor |
| Anesthetist | – | another doctor |
| Estimated Duration (minutes) | – | `90` |
| Surgery Date | ✅ | pick a date |
| Surgery Time | ✅ | `14:00` |
| OT Room | ✅ | `OT-1 (Major)` |
| Surgery Type | – | `Elective` (or `Emergency`) |

- **Auto:** booked-by user, hospital, and status `Scheduled`.
- **Verify:** the booking appears in the OT list with status **Scheduled**.
- ⚠️ The app **blocks double-booking** — if the same room or surgeon overlaps an existing slot you'll get a conflict message. Pick another time/room.

> From the OT list row you'll see **Pre-Op** and **Start** buttons. **Start** moves the booking to *In Progress*.

---

# STEP 5 — OT Pre-Operative checklist
- **URL:** `/ot/preop`
- **Pick:** Patient ✅ and OT Booking ✅ at the top, then complete the checklist:

| Field | Sample |
|---|---|
| Patient identity verified (checkbox) | ✔ |
| Consent Signed By | `Ramesh Kumar (self)` |
| Surgical site marked (checkbox) | ✔ |
| NPO Status | `NPO 6+ hours` |
| Allergies documented (checkbox) | ✔ |
| Pre-anesthetic checkup (checkbox) | ✔ |
| Lab reports available (checkbox) | ✔ |
| Blood Arrangement | `Arranged` |
| Pre-Operative Medications | `Inj. Pantoprazole 40mg IV` |
| Pre-Operative Vitals (free text) | `BP 130/85, Pulse 88, SpO2 97` |

- Click **Complete Checklist** → it then takes you to the Intra-Op screen.

---

# STEP 6 — OT Intra-Operative record
- **URL:** `/ot/intraop`
- **Pick** Patient + OT Booking, then fill the operative details:

| Field | Sample |
|---|---|
| Surgeon | `Dr. Sanjay Mehta` |
| Anesthesia Start / End time | `14:00` / `15:30` |
| Surgery Start / End time | `14:10` / `15:25` |
| Procedure Performed | `Open appendectomy` |
| Anesthesia Type | `General` |
| Anesthesia Notes | `Uneventful` |
| Findings | `Inflamed, non-perforated appendix` |
| Procedure Notes | `Standard appendectomy` |
| Complications | `None` |
| Blood Loss (ml) | `80` |
| Fluids Given | `1000ml RL` |
| Urine Output (ml) | `200` |
| Position | `Supine` |
| Drains/Tubes | `None` |
| Closure Method | `Layered, Vicryl 2-0` |
| Dressing Applied | `Sterile gauze` |
| Specimens Sent | `Appendix to histopathology` |
| Implants Used | `None` |

- Save → it then takes you to the Consumables screen.

---

# STEP 7 — OT Consumables used
- **URL:** `/ot/consumables`
- For each item: pick **Item** (from inventory) + **Quantity Used** + optional **Batch Number**, click **Add**, repeat, then **Submit**.

| Field | Sample |
|---|---|
| Item | `Disposable Gloves (Box/100)` |
| Quantity Used | `1` |
| Batch Number | `GLV-2026-03` |

- **Auto:** recorded-by user, hospital.
- ⚠️ The app **deducts the stock** and **adds a charge to the bill**. If stock is short you'll get an *insufficient stock* message.

---

# STEP 8 — OT Post-Operative record
- **URL:** `/ot/postop`
- **Pick** Patient + OT Booking, then:

| Field | Sample |
|---|---|
| Recovery Notes | `Recovered well from anesthesia, stable` |
| Post-Operative Vitals *(type valid JSON)* | `{"bp":"124/82","pulse":80,"spo2":99}` |
| Post-Operative Complications | `None` |
| Wound Status | `Clean` (Clean/Healing/Infected/Dehiscence) |
| Pain Management | `Inj. Tramadol 50mg IV SOS` |
| Drains Inserted | `None` |
| Post-Operative Orders | `IV antibiotics 48h, monitor wound` |
| Transfer to Ward Date/Time | today/now |

- Click **Save Post-Op Notes**. **Transfer to Ward** marks the patient's return to the ward.
- Back on `/ot`, mark the booking **Completed** (the **Start → Complete** action), then continue Step 3 daily care until discharge.

> Note: Post-Op Vitals expects **JSON** (placeholder shows the format). Pre-Op Vitals is plain free text.

---

# STEP 9 — Discharge (closes the loop)
- **URL:** `/ipd/discharge/:admissionId`  → **“Discharge”** button on the `/ipd` row
- **Fill the Discharge Summary:**

| Field | Required | Sample |
|---|---|---|
| Discharge Date & Time | – | today/now |
| Discharge Type | ✅ | `Normal` (Normal/AMA/Referred/Absconded/Death) |
| Discharged By (Doctor) | ✅ | `Dr. Sanjay Mehta` |
| Final Diagnosis | ✅ | `Acute appendicitis – post appendectomy, recovered` |
| Procedures/Surgeries Done | – | `Appendectomy on <date>` |
| Clinical Course | – | `Stable post-op, tolerated diet` |
| Discharge Medications | ✅ | `Tab Augmentin 625mg BD x 5 days` |
| Follow-up Instructions | ✅ | `Review in OPD after 1 week; keep wound dry` |
| Follow-up Date | – | +7 days |
| Diet Advice / Activity Restrictions | – | `Normal diet` / `Avoid heavy lifting 2 weeks` |

- **(Optional) Nursing Discharge Summary** at the bottom — **fill both nurses together** (Primary Nurse **and** Last Shift Nurse), Patient Condition, Vitals at Discharge (BP/Pulse/Temp), Wound/Catheter/IV Line status, Nursing Remarks.
  - ℹ️ The nursing summary is optional; it's only saved when **both** nurses are chosen, and it never blocks the discharge.
- Click **Complete Discharge**.
- ⚠️ **Outstanding balance guard:** if the admission still has an unpaid balance, the discharge is **blocked** and the screen shows an **“Outstanding balance — Discharge anyway?”** prompt. Choose **Discharge anyway** to override (e.g. LAMA / medico-legal / death), or collect payment first and retry.
- **Auto / side-effects:** the **bed is freed (Available)**, the **IPD billing episode is closed**, and the admission status becomes **Discharged**.
- **Verify:** bed shows **Available** in `/beds/management`; the admission shows **Discharged** in `/ipd`; you'll see a **Print Discharge Summary** button and (if there's a balance) a link to clear the bill.

---

# How to watch it work (optional, for debugging)
1. Start backend (`npm run start`) and frontend (`npm run dev` inside `/frontend`), then log in.
2. Open the browser **DevTools → Network** tab.
3. As you submit each form, watch the `POST`/`PUT` to `/api/...` — a healthy response shows `success: true` and the new record's id.
4. You generally move **forward via the list/row buttons**; the app carries the ids (patient → admission → booking) for you.

---

## Quick reference — every screen & its URL

| # | Step | URL |
|---|---|---|
| 0 | Login | `/login` |
| 1 | Register patient | `/patients` |
| 2 | Admit to IPD | `/ipd/admit` |
| – | IPD admissions list (hub) | `/ipd` |
| 3a | Record vitals | `/ipd/vitals/:admissionId` |
| 3b–d | Daily care (notes, meds, orders) | `/ipd/care/:admissionId` |
| 4 | Book OT | `/ot` |
| 5 | OT pre-op | `/ot/preop` |
| 6 | OT intra-op | `/ot/intraop` |
| 7 | OT consumables | `/ot/consumables` |
| 8 | OT post-op | `/ot/postop` |
| 9 | Discharge | `/ipd/discharge/:admissionId` |
| – | Wards / Beds | `/ipd/wards` · `/beds/management` |
| – | Billing | `/billing` |
