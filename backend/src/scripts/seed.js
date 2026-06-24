/**
 * HMS Comprehensive Seed — 15 Patients, Full Multi-Scenario Data
 * Covers every module: Hospital, Depts, 6 Doctors, 11 Staff, 15 Patients,
 * 3 Wards/30 Beds, 16 Medicines, Inventory, Charge Master,
 * 8 Lab Tests, 6 Rad Tests, 5 Equipment, HR, 20 OPD Appts,
 * 9 OPD Visits+Vitals+Consults+Rx+Sales, 7 IPD Admissions (5 active+2 discharged),
 * IPD vitals/meds/progress/checklists/discharge, 5 Lab Orders,
 * 6 Rad Orders, 3 OT Rooms/Bookings, 5 Bills/Payments, Packages, Audit Logs
 *
 *   node src/scripts/seed.js
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../models');
const {
  sequelize,
  Hospital, Department, Doctor, DoctorQualification, DoctorSchedules, DoctorLeave,
  Employee, User, SalaryStructure, Payroll,
  Patient, PatientMedicalHistory, PatientClinicalHistory, PatientMedicationHistory, PatientDocument,
  Ward, Bed,
  MedicineCategory, Medicine, MedicineBatch,
  InventoryCategory, InventoryItem, Vendor,
  PurchaseOrder, PurchaseOrderDetail, GoodsReceiptNote, GrnDetail,
  StockIssue, StockReturn,
  ChargeMaster,
  OpdAppointment, OpdVisit, OpdVital, OpdConsultation, OpdPrescription,
  IpdAdmission, IpdNurseAssignment, IpdVital, IpdMedication, IpdMedicationAdministration,
  IpdProgressNote, NursingChecklist, IpdDischargeSummary, IpdDischargeNursingSummary,
  LabTest, LabOrder, LabOrderDetail, LabSample, LabResult, LabReport,
  RadiologyTests, RadiologyOrders, RadiologyImaging, RadiologyReports,
  PharmacySale, PharmacySaleDetail,
  Equipment, PreventiveMaintenance, MaintenanceRequest, MaintenanceHistory, CalibrationLog,
  BillingEpisode, Bill, BillCharge, Payment, PaymentAdvance, Refund, InsuranceClaim,
  Shift, EmployeeRoster, EmployeeAttendance, LeaveRequest, LeaveBalance, ExpenseEntry,
  OtRoom, OtBooking, OtPreOperative, OtIntraOperative, OtPostOperative, OtConsumablesUsed,
  Package, AuditLog
} = db;

const PASSWORD = 'password123';
// IST-safe date helper: "today" must be the calendar day in Asia/Kolkata, not UTC.
// Returns "YYYY-MM-DD" for the IST date offset by `n` days from now.
const d = (n=0) => {
  const x = new Date(Date.now() + n*86400000);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(x).reduce((a,p) => { a[p.type] = p.value; return a; }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const dt = (n=0,h=0) => { const x=new Date(); x.setDate(x.getDate()+n); x.setHours(Math.floor(h),Math.round((h%1)*60),0,0); return x; };
const now=new Date(), today=d(0), yesterday=d(-1), twoDaysAgo=d(-2), fiveDaysAgo=d(-5);
const tenDaysAgo=d(-10), thirtyDaysAgo=d(-30), tomorrow=d(1), inWeek=d(7), inTen=d(10);

async function hashPw(p) { return bcrypt.hash(p,10); }

async function main() {
  const t = await sequelize.transaction();
  try {
    console.log('\n🏥  Seeding New Begin Hospital...\n');

    // ── 1. HOSPITAL ──────────────────────────────────────────────────
    const hospital = await Hospital.create({
      hospitalName: 'New Begin Hospital',
      licenseNumber: 'LIC-2025-NBH-0001',
      address: '14 Healthcare Road, Kanyakumari, Tamil Nadu 629001',
      phone: '+91-4652-234567',
      hospitalEmail: 'info@newbegin.hospital',
      hospitalType: 'general',
      gst_number: '33NEWBE1234H1Z5',
      pan_number: 'NEWBE1234H',
      registration_number: 'REG-TN-2025-0042',
      website: 'https://newbegin.hospital',
      numbering_prefixes: { uhid:'NBH', bill:'BILL', grn:'GRN', po:'PO' },
      // In-House pharmacy: medicines/OT consumables are billed to the hospital bill.
      pharmacy_mode: 'in_house',
      settings: {}, isActive: true
    }, { transaction: t });
    const H = hospital.id;
    console.log(`  ✔ Hospital #${H}`);

    // ── 2. DEPARTMENTS ───────────────────────────────────────────────
    const depts = await Department.bulkCreate([
      { department_code:'GEN',   department_name:'General Medicine', department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'CAR',   department_name:'Cardiology',       department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'PED',   department_name:'Pediatrics',       department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'ORT',   department_name:'Orthopedics',      department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'GYN',   department_name:'Gynecology',       department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'NEURO', department_name:'Neurology',        department_type:'Clinical', hospital_id:H, is_active:true },
      { department_code:'LAB',   department_name:'Laboratory',       department_type:'Support',  hospital_id:H, is_active:true },
      { department_code:'RAD',   department_name:'Radiology',        department_type:'Support',  hospital_id:H, is_active:true },
      { department_code:'PHM',   department_name:'Pharmacy',         department_type:'Support',  hospital_id:H, is_active:true },
    ], { transaction: t });
    const dG = c => depts.find(x => x.department_code === c);
    const [dGen,dCar,dPed,dOrt,dGyn,dNeu,dLab,dRad,dPhm] = ['GEN','CAR','PED','ORT','GYN','NEURO','LAB','RAD','PHM'].map(dG);
    console.log(`  ✔ Departments (${depts.length})`);

    // ── 3. DOCTORS ───────────────────────────────────────────────────
    const doctors = await Doctor.bulkCreate([
      { name:'Dr. Anita Sharma',  specialization:'General Medicine', registration_number:'REG-001', email:'anita@nbh.in',   phone:'9000000001', experience:12, department_id:dGen.id, hospital_id:H, is_active:true },
      { name:'Dr. Rajesh Kumar',  specialization:'Cardiology',       registration_number:'REG-002', email:'rajesh@nbh.in',  phone:'9000000002', experience:18, department_id:dCar.id, hospital_id:H, is_active:true },
      { name:'Dr. Priya Nair',    specialization:'Pediatrics',       registration_number:'REG-003', email:'priya@nbh.in',   phone:'9000000003', experience:9,  department_id:dPed.id, hospital_id:H, is_active:true },
      { name:'Dr. Sanjay Mehta',  specialization:'Orthopedics',      registration_number:'REG-004', email:'sanjay@nbh.in',  phone:'9000000004', experience:15, department_id:dOrt.id, hospital_id:H, is_active:true },
      { name:'Dr. Kavitha Menon', specialization:'Gynecology',       registration_number:'REG-005', email:'kavitha@nbh.in', phone:'9000000005', experience:11, department_id:dGyn.id, hospital_id:H, is_active:true },
      { name:'Dr. Arjun Pillai',  specialization:'Neurology',        registration_number:'REG-006', email:'arjunp@nbh.in',  phone:'9000000006', experience:14, department_id:dNeu.id, hospital_id:H, is_active:true },
    ], { transaction: t });
    const [dAnita,dRajesh,dPriya,dSanjay,dKavitha,dArjun] = doctors;

    const qualRows = [];
    for (const doc of doctors) {
      qualRows.push({ doctor_id:doc.id, hospital_id:H, degree:'MBBS', institution:'AIIMS Delhi',  year_obtained:2008, registration_number:`MCI-${doc.id}-MBBS`, registration_council:'MCI', valid_till:'2030-12-31', is_active:true });
      qualRows.push({ doctor_id:doc.id, hospital_id:H, degree:'MD',   institution:'CMC Vellore',  year_obtained:2012, registration_number:`MCI-${doc.id}-MD`,   registration_council:'MCI', valid_till:'2030-12-31', is_active:true });
    }
    await DoctorQualification.bulkCreate(qualRows, { transaction: t });

    const schedRows = [];
    for (const doc of doctors)
      for (const day of ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])
        schedRows.push({ doctor_id:doc.id, day_of_week:day, start_time:'09:00:00', end_time:'14:00:00', slot_duration_minutes:15, max_appointments:20, hospital_id:H, is_active:true });
    await DoctorSchedules.bulkCreate(schedRows, { transaction: t });

    await DoctorLeave.bulkCreate([
      { doctor_id:dPriya.id,  hospital_id:H, from_date:inWeek,  to_date:inTen,   leave_type:'Conference', reason:'IAP Annual Conference', status:'Approved', is_active:true },
      { doctor_id:dSanjay.id, hospital_id:H, from_date:tomorrow,to_date:tomorrow, leave_type:'Personal',   reason:'Family function',       status:'Pending',  is_active:true },
    ], { transaction: t });
    console.log(`  ✔ Doctors (${doctors.length}) + Qualifications + Schedules + Leaves`);

    // ── 4. EMPLOYEES + USERS + SALARY + PAYROLL ──────────────────────
    const empDefs = [
      { code:'E-ADM', name:'Admin User',         role:'Admin',        email:'admin@nbh.in',        basic:70000,  deptId:dGen.id, dId:null },
      { code:'E-DOC', name:'Dr. Anita Sharma',   role:'Doctor',       email:'dr.anita@nbh.in',     basic:120000, deptId:dGen.id, dId:dAnita.id },
      { code:'E-NR1', name:'Meera Nurse',        role:'Nurse',        email:'nurse1@nbh.in',       basic:28000,  deptId:dGen.id, dId:null },
      { code:'E-NR2', name:'Sunita Nurse',       role:'Nurse',        email:'nurse2@nbh.in',       basic:26000,  deptId:dGen.id, dId:null },
      { code:'E-PHM', name:'Kiran Pharmacist',   role:'Pharmacist',   email:'pharmacist@nbh.in',   basic:32000,  deptId:dPhm.id, dId:null },
      { code:'E-LAB', name:'Ravi LabTech',       role:'LabTech',      email:'labtech@nbh.in',      basic:30000,  deptId:dLab.id, dId:null },
      { code:'E-RAD', name:'Amit Radiologist',   role:'Radiologist',  email:'radiologist@nbh.in',  basic:90000,  deptId:dRad.id, dId:null },
      { code:'E-REC', name:'Sneha Receptionist', role:'Receptionist', email:'receptionist@nbh.in', basic:22000,  deptId:dGen.id, dId:null },
      { code:'E-ACC', name:'Vikram Accountant',  role:'Accountant',   email:'accountant@nbh.in',   basic:40000,  deptId:dGen.id, dId:null },
      { code:'E-HR',  name:'Divya HR',           role:'HR',           email:'hr@nbh.in',           basic:45000,  deptId:dGen.id, dId:null },
      { code:'E-EMP', name:'Rohit Employee',     role:'Employee',     email:'employee@nbh.in',     basic:20000,  deptId:dGen.id, dId:null },
    ];
    const empMap = {}; // role -> first employee of that role
    const allEmps = [];
    for (let i=0; i<empDefs.length; i++) {
      const def = empDefs[i];
      const emp = await Employee.create({
        emp_code:def.code, full_name:def.name, gender:'M', date_of_birth:'1990-06-15',
        mobile:`+9191110${String(i).padStart(5,'0')}`, email:def.email,
        address:'Kanyakumari, Tamil Nadu', role:def.role, qualification:'Graduate',
        joining_date:thirtyDaysAgo, department_id:def.deptId, hospital_id:H, is_active:true
      }, { transaction: t });
      allEmps.push({ ...emp.dataValues, basic:def.basic, doctorId:def.dId });
      if (!empMap[def.role]) empMap[def.role] = { ...emp.dataValues, basic:def.basic, doctorId:def.dId };
    }

    const pwHash = await hashPw(PASSWORD);
    const userMap = {};
    // One user per unique role
    for (const def of empDefs) {
      if (userMap[def.role]) continue;
      const emp = empMap[def.role];
      const user = await User.create({
        name:def.name, email:def.email, password:pwHash, role:def.role,
        employee_id:emp.employee_id, doctor_id:def.dId||null,
        hospital_id:H, isActive:true
      }, { transaction: t, hooks:false });
      userMap[def.role] = user;
    }
    console.log(`  ✔ Employees (${allEmps.length}) + Users`);

    // Salary structures — now include bonus, gratuity (employer provision), ESI & LWF.
    const salRows = empDefs.filter(d=>d.code!=='E-NR2').map(def => {
      const b=def.basic;
      return {
        employee_id:empMap[def.role].employee_id, basic_salary:b, hra:Math.round(b*0.4),
        medical_allowance:1250, transport_allowance:1600, other_allowances:Math.round(b*0.1),
        bonus:Math.round(b*0.0833),                 // ~1 month bonus / 12
        gratuity:Math.round(b*0.0481),              // 4.81% of basic (employer provision)
        pf_percentage:12, pt_amount:200,
        esi_percentage: b <= 21000 ? 0.75 : 0,      // ESI applies to wages <= 21k
        lwf_amount:20,
        tds_percentage:b>50000?10:0, other_deductions:0,
        effective_from:thirtyDaysAgo, hospital_id:H, is_active:true
      };
    });
    await SalaryStructure.bulkCreate(salRows, { transaction: t });

    // Annual leave balances for every employee (current year), a couple with usage.
    const curYear = new Date().getFullYear();
    const lbRows = allEmps.map((e, i) => ({
      employee_id: e.employee_id, hospital_id: H, year: curYear,
      casual_allocated: 12, casual_used: i % 3 === 0 ? 3 : 0,
      medical_allocated: 12, medical_used: i % 4 === 0 ? 2 : 0,
      earned_allocated: 15, earned_used: i % 2 === 0 ? 5 : 1,
      is_active: true
    }));
    await LeaveBalance.bulkCreate(lbRows, { transaction: t });

    // Expense ledger — payroll posts here automatically; seed a few operating expenses.
    let expSeq = 1;
    const expNo = () => `EXP-${curYear}-${String(expSeq++).padStart(6,'0')}`;
    await ExpenseEntry.bulkCreate([
      { hospital_id:H, expense_number:expNo(), expense_date:d(-5),  category:'Utilities',   description:'Electricity bill', amount:48500, payment_mode:'Bank Transfer', status:'Paid', created_by:userMap.Accountant.id, is_active:true },
      { hospital_id:H, expense_number:expNo(), expense_date:d(-3),  category:'Maintenance', description:'AC servicing (OT)', amount:12000, payment_mode:'Cash', status:'Paid', created_by:userMap.Accountant.id, is_active:true },
      { hospital_id:H, expense_number:expNo(), expense_date:d(-10), category:'Rent',        description:'Pharmacy annexe rent', amount:60000, payment_mode:'Bank Transfer', status:'Paid', created_by:userMap.Accountant.id, is_active:true },
    ], { transaction: t });
    console.log(`  ✔ Leave Balances (${lbRows.length}) + Expense ledger (3)`);

    // 2 months payroll
    const payrollRows = [];
    for (let mo=1; mo<=2; mo++) {
      const pd=new Date(); pd.setMonth(pd.getMonth()-mo);
      for (const def of empDefs.filter(d=>d.code!=='E-NR2')) {
        const b=def.basic, al=Math.round(b*0.5)+1250+1600, ded=Math.round(b*0.12)+200;
        payrollRows.push({ employee_id:empMap[def.role].employee_id, month:pd.getMonth()+1, year:pd.getFullYear(), days_worked:26, days_absent:0, overtime_hours:0, basic_salary:b, total_allowances:al, total_deductions:ded, gross_salary:b+al, net_salary:b+al-ded, status:'Paid', payment_date:d(-(mo*28)), payment_mode:'Bank Transfer', transaction_reference:`TXN-${pd.getFullYear()}${pd.getMonth()+1}-${empMap[def.role].employee_id}`, hospital_id:H, generated_by:userMap.HR.id, approved_by:userMap.HR.id, processed_by:userMap.Accountant.id });
      }
    }
    await Payroll.bulkCreate(payrollRows, { transaction: t });
    console.log(`  ✔ Salary Structures + Payroll (${payrollRows.length} records)`);

    // ── 5. PATIENTS (15) ─────────────────────────────────────────────
    const patDefs = [
      { fn:'Arjun',    ln:'Verma',    g:'M', age:34, dob:'1991-03-12', mob:'9812340001', bg:'B+',  aadhaar:'123412341234', city:'Bangalore',  ins:true,  insProv:'Star Health',   pol:'STAR-001' },
      { fn:'Meera',    ln:'Iyer',     g:'F', age:29, dob:'1996-07-22', mob:'9812340002', bg:'A+',  aadhaar:'223412341234', city:'Chennai',    ins:true,  insProv:'HDFC Ergo',     pol:'HDFC-002' },
      { fn:'Rohan',    ln:'Kapoor',   g:'M', age:45, dob:'1980-01-05', mob:'9812340003', bg:'O+',  aadhaar:'323412341234', city:'Mumbai',     ins:false, insProv:null,            pol:null },
      { fn:'Sita',     ln:'Reddy',    g:'F', age:61, dob:'1964-09-15', mob:'9812340004', bg:'AB+', aadhaar:'423412341234', city:'Hyderabad',  ins:true,  insProv:'New India',     pol:'NIA-003'  },
      { fn:'Kiran',    ln:'Pillai',   g:'M', age:7,  dob:'2018-04-01', mob:'9812340005', bg:'B-',  aadhaar:null,           city:'Kochi',      ins:false, insProv:null,            pol:null },
      { fn:'Lakshmi',  ln:'Rao',      g:'F', age:52, dob:'1973-11-30', mob:'9812340006', bg:'O+',  aadhaar:'623412341234', city:'Vijayawada', ins:true,  insProv:'Bajaj Allianz', pol:'BAJAJ-004'},
      { fn:'Vikram',   ln:'Singh',    g:'M', age:38, dob:'1987-06-18', mob:'9812340007', bg:'A-',  aadhaar:'723412341234', city:'Delhi',      ins:false, insProv:null,            pol:null },
      { fn:'Preethi',  ln:'Suresh',   g:'F', age:26, dob:'1999-02-14', mob:'9812340008', bg:'O-',  aadhaar:'823412341234', city:'Coimbatore', ins:false, insProv:null,            pol:null },
      { fn:'Mohammed', ln:'Farooq',   g:'M', age:55, dob:'1970-08-20', mob:'9812340009', bg:'B+',  aadhaar:'923412341234', city:'Chennai',    ins:true,  insProv:'LIC Health',    pol:'LIC-005'  },
      { fn:'Ananya',   ln:'Krishnan', g:'F', age:32, dob:'1993-12-05', mob:'9812340010', bg:'A+',  aadhaar:'103412341234', city:'Trivandrum', ins:false, insProv:null,            pol:null },
      { fn:'Suresh',   ln:'Babu',     g:'M', age:67, dob:'1958-05-10', mob:'9812340011', bg:'AB-', aadhaar:'113412341234', city:'Madurai',    ins:true,  insProv:'United India',  pol:'UI-006'   },
      { fn:'Geetha',   ln:'Nair',     g:'F', age:44, dob:'1981-10-28', mob:'9812340012', bg:'B+',  aadhaar:'123312341234', city:'Kottayam',   ins:false, insProv:null,            pol:null },
      { fn:'Ravi',     ln:'Shankar',  g:'M', age:22, dob:'2003-03-25', mob:'9812340013', bg:'O+',  aadhaar:null,           city:'Tanjore',    ins:false, insProv:null,            pol:null },
      { fn:'Deepa',    ln:'Mohan',    g:'F', age:35, dob:'1990-07-07', mob:'9812340014', bg:'A+',  aadhaar:'143412341234', city:'Nagercoil',  ins:false, insProv:null,            pol:null },
      { fn:'Ganesh',   ln:'Kumar',    g:'M', age:48, dob:'1977-01-19', mob:'9812340015', bg:'B+',  aadhaar:'153412341234', city:'Salem',      ins:true,  insProv:'Max Bupa',      pol:'MAX-007'  },
    ];
    const patients = [];
    for (let i=0; i<patDefs.length; i++) {
      const p=patDefs[i];
      const pat = await Patient.create({
        uhid:`NBH-${String(1001+i).padStart(6,'0')}`, first_name:p.fn, last_name:p.ln,
        gender:p.g, age:p.age, date_of_birth:p.dob, mobile_number:p.mob,
        email:`${p.fn.toLowerCase()}.${p.ln.toLowerCase()}@mail.com`,
        city:p.city, state:'Tamil Nadu', pincode:'629001', blood_group:p.bg,
        aadhaar_number:p.aadhaar, insurance_status:p.ins,
        insurance_provider:p.insProv, policy_number:p.pol,
        hospital_id:H, isActive:true
      }, { transaction: t });
      patients.push(pat);
    }
    const [pArjun,pMeera,pRohan,pSita,pKiran,pLakshmi,pVikram,pPreethi,pMohammed,pAnanya,pSuresh,pGeetha,pRavi,pDeepa,pGanesh] = patients;
    console.log(`  ✔ Patients (${patients.length})`);

    // Medical histories
    await PatientMedicalHistory.bulkCreate([
      { patient_id:pArjun.patient_id,    hospital_id:H, allergies:'Penicillin',  chronic_diseases:'None',                         past_surgeries:'None',               family_history:'Father - DM2',      social_history:'Non-smoker',         updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pMeera.patient_id,    hospital_id:H, allergies:'None',         chronic_diseases:'Hypertension',                 past_surgeries:'None',               family_history:'Mother - HTN',      social_history:'Non-smoker',         updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pRohan.patient_id,    hospital_id:H, allergies:'Sulfa drugs',  chronic_diseases:'Type 2 Diabetes',              past_surgeries:'Appendectomy 2019',  family_history:'Father - DM2, HTN', social_history:'Occasional alcohol', updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pSita.patient_id,     hospital_id:H, allergies:'None',         chronic_diseases:'Type 2 Diabetes, Hypertension',past_surgeries:'Cholecystectomy 2018',family_history:'Sister - DM2',      social_history:'Non-smoker',         updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pKiran.patient_id,    hospital_id:H, allergies:'None',         chronic_diseases:'Asthma (mild)',               past_surgeries:'None',               family_history:'Non-contributory',  social_history:'N/A',                updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pLakshmi.patient_id,  hospital_id:H, allergies:'NSAIDs',       chronic_diseases:'Hypothyroidism',              past_surgeries:'Cataract 2022',      family_history:'Mother - thyroid',  social_history:'Non-smoker',         updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pVikram.patient_id,   hospital_id:H, allergies:'None',         chronic_diseases:'None',                        past_surgeries:'None',               family_history:'Father - IHD',      social_history:'Smoker 10pk-yr',     updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pMohammed.patient_id, hospital_id:H, allergies:'None',         chronic_diseases:'CAD, HTN, DM2',              past_surgeries:'PTCA 2022',          family_history:'Brother - CAD',     social_history:'Ex-smoker',          updated_by:userMap.Doctor.id, isActive:true },
      { patient_id:pSuresh.patient_id,   hospital_id:H, allergies:'Aspirin',      chronic_diseases:'COPD, CKD stage 3',          past_surgeries:'None',               family_history:'Nil significant',   social_history:'Ex-smoker 40pk-yr',  updated_by:userMap.Doctor.id, isActive:true },
    ], { transaction: t });

    const docRows=[];
    for (const pat of patients) {
      docRows.push({ patient_id:pat.patient_id, document_type:'ID Proof',   filename:`${pat.uhid}-id.pdf`,  original_filename:'aadhaar.pdf', file_path:`/uploads/${pat.uhid}/id.pdf`,  file_size:102400, mime_type:'application/pdf', uploaded_by:userMap.Receptionist.id, hospital_id:H, description:'Aadhaar', is_active:true });
      docRows.push({ patient_id:pat.patient_id, document_type:'Lab Report', filename:`${pat.uhid}-lab.pdf`, original_filename:'cbc.pdf',    file_path:`/uploads/${pat.uhid}/lab.pdf`, file_size:88200,  mime_type:'application/pdf', uploaded_by:userMap.LabTech.id,      hospital_id:H, description:'CBC',    is_active:true });
    }
    await PatientDocument.bulkCreate(docRows, { transaction: t });
    console.log(`  ✔ Patient Medical Histories + Documents`);

    // ── 6. WARDS + BEDS ──────────────────────────────────────────────
    const wards = await Ward.bulkCreate([
      { ward_name:'General Ward A', ward_type:'General', total_beds:12, available_beds:9, floor_number:1, department_id:dGen.id, hospital_id:H, is_active:true },
      { ward_name:'Private Suite',  ward_type:'Private', total_beds:8,  available_beds:5, floor_number:2, department_id:dGen.id, hospital_id:H, is_active:true },
      { ward_name:'ICU',            ward_type:'ICU',     total_beds:10, available_beds:7, floor_number:3, department_id:dGen.id, hospital_id:H, is_active:true },
    ], { transaction: t });
    const [wGen,wPvt,wICU] = wards;
    const bedRows=[];
    for (let i=1;i<=12;i++) bedRows.push({ ward_id:wGen.ward_id, room_number:`G-${Math.ceil(i/2)}`, bed_number:`G${i}`,   bed_type:'General',    status:'Available', charge_per_day:1200, hospital_id:H, is_active:true });
    for (let i=1;i<=8;i++)  bedRows.push({ ward_id:wPvt.ward_id, room_number:`P-${i}`,             bed_number:`P${i}`,   bed_type:'General',    status:'Available', charge_per_day:3000, hospital_id:H, is_active:true });
    for (let i=1;i<=10;i++) bedRows.push({ ward_id:wICU.ward_id, room_number:`ICU-${i}`,           bed_number:`ICU${i}`, bed_type:i<=4?'Ventilator':'Oxygen', status:'Available', charge_per_day:5000, hospital_id:H, is_active:true });
    await Bed.bulkCreate(bedRows, { transaction: t });
    const allBeds = await Bed.findAll({ where:{ hospital_id:H }, transaction: t });
    const nextBed = (wid) => allBeds.find(b => b.ward_id===wid && b.status==='Available');
    const markOccupied = async (bedId) => { const b=allBeds.find(x=>x.bed_id===bedId); if(b) b.status='Occupied'; await Bed.update({ status:'Occupied' },{ where:{ bed_id:bedId }, transaction:t }); };
    console.log(`  ✔ Wards (${wards.length}) + Beds (${bedRows.length})`);

    // ── 7. PHARMACY ──────────────────────────────────────────────────
    const medCats = await MedicineCategory.bulkCreate([
      { category_name:'Analgesics',    hospital_id:H, is_active:true },
      { category_name:'Antibiotics',   hospital_id:H, is_active:true },
      { category_name:'Antacids',      hospital_id:H, is_active:true },
      { category_name:'Cardiac',       hospital_id:H, is_active:true },
      { category_name:'Antidiabetics', hospital_id:H, is_active:true },
      { category_name:'Antihistamines',hospital_id:H, is_active:true },
    ], { transaction: t });
    const [cAnal,cAnti,cAntac,cCard,cDiab,cAntiH] = medCats;

    // India: each medicine carries a brand (trade) name + generic (molecule/salt) name + strength.
    const medDefs = [
      { code:'M001',name:'Paracetamol 500mg',     brand:'Calpol 500',  gen:'Paracetamol',          str:'500mg', cat:cAnal,  form:'Tablet',   mfr:'GSK',    mrp:20,  pur:12,sell:18 },
      { code:'M002',name:'Ibuprofen 400mg',       brand:'Brufen 400',  gen:'Ibuprofen',            str:'400mg', cat:cAnal,  form:'Tablet',   mfr:'Cipla',  mrp:35,  pur:20,sell:30 },
      { code:'M003',name:'Amoxicillin 500mg',     brand:'Mox 500',     gen:'Amoxicillin',          str:'500mg', cat:cAnti,  form:'Capsule',  mfr:'Cipla',  mrp:120, pur:80,sell:110},
      { code:'M004',name:'Azithromycin 500mg',    brand:'Azithral 500',gen:'Azithromycin',         str:'500mg', cat:cAnti,  form:'Tablet',   mfr:'Sun',    mrp:90,  pur:60,sell:85 },
      { code:'M005',name:'Cefixime 200mg',        brand:'Taxim-O 200', gen:'Cefixime',             str:'200mg', cat:cAnti,  form:'Tablet',   mfr:'Lupin',  mrp:110, pur:75,sell:100},
      { code:'M006',name:'Pantoprazole 40mg',     brand:'Pan 40',      gen:'Pantoprazole',         str:'40mg',  cat:cAntac, form:'Tablet',   mfr:'Sun',    mrp:80,  pur:55,sell:75 },
      { code:'M007',name:'Ranitidine 150mg',      brand:'Aciloc 150',  gen:'Ranitidine',           str:'150mg', cat:cAntac, form:'Tablet',   mfr:'GSK',    mrp:30,  pur:18,sell:28 },
      { code:'M008',name:'Telmisartan 40mg',      brand:'Telma 40',    gen:'Telmisartan',          str:'40mg',  cat:cCard,  form:'Tablet',   mfr:'Lupin',  mrp:90,  pur:60,sell:85 },
      { code:'M009',name:'Amlodipine 5mg',        brand:'Amlong 5',    gen:'Amlodipine',           str:'5mg',   cat:cCard,  form:'Tablet',   mfr:'Pfizer', mrp:40,  pur:25,sell:38 },
      { code:'M010',name:'Atorvastatin 10mg',     brand:'Atorva 10',   gen:'Atorvastatin',         str:'10mg',  cat:cCard,  form:'Tablet',   mfr:'Ranbaxy',mrp:60,  pur:40,sell:55 },
      { code:'M011',name:'Metformin 500mg',       brand:'Glycomet 500',gen:'Metformin',            str:'500mg', cat:cDiab,  form:'Tablet',   mfr:'USV',    mrp:25,  pur:15,sell:22 },
      { code:'M012',name:'Glimepiride 2mg',       brand:'Amaryl 2',    gen:'Glimepiride',          str:'2mg',   cat:cDiab,  form:'Tablet',   mfr:'Sanofi', mrp:70,  pur:48,sell:65 },
      { code:'M013',name:'Cetirizine 10mg',       brand:'Cetzine 10',  gen:'Cetirizine',           str:'10mg',  cat:cAntiH, form:'Tablet',   mfr:'GSK',    mrp:15,  pur:8, sell:13 },
      { code:'M014',name:'Montelukast 10mg',      brand:'Montair 10',  gen:'Montelukast',          str:'10mg',  cat:cAntiH, form:'Tablet',   mfr:'MSD',    mrp:90,  pur:62,sell:85 },
      { code:'M015',name:'Inj Normal Saline 500ml',brand:'NS 500',     gen:'Sodium Chloride 0.9%', str:'500ml', cat:cAnal, form:'Injection',mfr:'Baxter', mrp:80,  pur:55,sell:75 },
      { code:'M016',name:'Inj Tramadol 50mg',     brand:'Tramazac 50', gen:'Tramadol',             str:'50mg',  cat:cAnal,  form:'Injection',mfr:'Pfizer', mrp:45,  pur:30,sell:42 },
    ];
    const medicines = await Medicine.bulkCreate(medDefs.map(m=>({ medicine_code:m.code, medicine_name:m.name, brand_name:m.brand, generic_name:m.gen, strength:m.str, category_id:m.cat.category_id, dosage_form:m.form, manufacturer:m.mfr, hospital_id:H, isActive:true })), { transaction:t });
    const getMed = code => medicines.find(m=>m.medicine_code===code);

    const expL=new Date(); expL.setFullYear(expL.getFullYear()+2);
    const expS=new Date(); expS.setMonth(expS.getMonth()+2);
    const batchDefs = medDefs.map((m,i)=>({ medicine_id:getMed(m.code).medicine_id, hospital_id:H, batch_number:`BATCH-${String(i+1).padStart(4,'0')}`, expiry_date:expL.toISOString().slice(0,10), mrp:m.mrp, purchase_rate:m.pur, selling_rate:m.sell, received_quantity:500, available_quantity:480, received_date:thirtyDaysAgo, is_active:true }));
    batchDefs.push({ medicine_id:getMed('M003').medicine_id, hospital_id:H, batch_number:'BATCH-EXPR-01', expiry_date:expS.toISOString().slice(0,10), mrp:120, purchase_rate:80, selling_rate:110, received_quantity:50, available_quantity:48, received_date:d(-60), is_active:true });
    const batches = await MedicineBatch.bulkCreate(batchDefs, { transaction:t });
    const getBatch = code => batches.find(b=>b.medicine_id===getMed(code).medicine_id&&!b.batch_number.includes('EXPR'));
    console.log(`  ✔ Med Categories (${medCats.length}) + Medicines (${medicines.length}) + Batches (${batches.length})`);

    // ── 8. INVENTORY ─────────────────────────────────────────────────
    const invCats = await InventoryCategory.bulkCreate([
      { category_name:'Consumables',       category_type:'Consumable', hospital_id:H, is_active:true },
      { category_name:'Surgical Supplies', category_type:'Consumable', hospital_id:H, is_active:true },
      { category_name:'PPE',               category_type:'Consumable', hospital_id:H, is_active:true },
      { category_name:'Stationery',        category_type:'Stationery', hospital_id:H, is_active:true },
    ], { transaction:t });
    const [iCons,iSurg,iPPE,iStat] = invCats;
    const invItems = await InventoryItem.bulkCreate([
      { item_code:'INV-001', item_name:'Disposable Gloves (Box/100)', category_id:iCons.category_id, unit_of_measure:'box',  current_stock:80,  reorder_level:20, rate_per_unit:250,  hospital_id:H, is_active:true },
      { item_code:'INV-002', item_name:'Syringes 5ml (Pack/100)',     category_id:iCons.category_id, unit_of_measure:'pack', current_stock:50,  reorder_level:15, rate_per_unit:300,  hospital_id:H, is_active:true },
      { item_code:'INV-003', item_name:'Bandage Cotton 4"',           category_id:iSurg.category_id, unit_of_measure:'roll', current_stock:120, reorder_level:30, rate_per_unit:45,   hospital_id:H, is_active:true },
      { item_code:'INV-004', item_name:'Suture 2-0 Vicryl',          category_id:iSurg.category_id, unit_of_measure:'box',  current_stock:30,  reorder_level:10, rate_per_unit:1200, hospital_id:H, is_active:true },
      { item_code:'INV-005', item_name:'N95 Mask (Pack/20)',         category_id:iPPE.category_id,  unit_of_measure:'pack', current_stock:12,  reorder_level:20, rate_per_unit:480,  hospital_id:H, is_active:true },
      { item_code:'INV-006', item_name:'A4 Paper',                   category_id:iStat.category_id, unit_of_measure:'ream', current_stock:25,  reorder_level:5,  rate_per_unit:220,  hospital_id:H, is_active:true },
    ], { transaction:t });
    const [iGloves,iSyr,iBandage,iSuture,iMask] = invItems;
    const vendors = await Vendor.bulkCreate([
      { vendor_code:'V-001', vendor_name:'MediSupply Co.',   contact_person:'Anil Kumar',   mobile:'9900000001', email:'sales@medisupply.in',  address:'Chennai',   gst_number:'33MEDI1234F1Z5', hospital_id:H, is_active:true },
      { vendor_code:'V-002', vendor_name:'PharmaCorp India', contact_person:'Suresh Rao',   mobile:'9900000002', email:'orders@pharmacorp.in', address:'Mumbai',    gst_number:'27PHAR5678G2Y9', hospital_id:H, is_active:true },
      { vendor_code:'V-003', vendor_name:'SurgiMed Ltd.',    contact_person:'Priya Thomas', mobile:'9900000003', email:'info@surgimed.in',     address:'Bangalore', gst_number:'29SURG9012H3X2', hospital_id:H, is_active:true },
    ], { transaction:t });
    const po1=await PurchaseOrder.create({ po_number:'PO-2025-001', vendor_id:vendors[0].vendor_id, po_date:tenDaysAgo, expected_delivery_date:fiveDaysAgo, total_amount:50*250+30*300, gst_amount:Math.round((50*250+30*300)*0.18), net_amount:Math.round((50*250+30*300)*1.18), status:'Received', created_by:userMap.Admin.id, approved_by:userMap.Admin.id, hospital_id:H, is_active:true },{ transaction:t });
    await PurchaseOrderDetail.bulkCreate([{ po_id:po1.po_id, item_id:iGloves.item_id, quantity:50, rate:250, amount:50*250, hospital_id:H, is_active:true },{ po_id:po1.po_id, item_id:iSyr.item_id, quantity:30, rate:300, amount:30*300, hospital_id:H, is_active:true }],{ transaction:t });
    const grn1=await GoodsReceiptNote.create({ grn_number:'GRN-2025-001', po_id:po1.po_id, vendor_id:vendors[0].vendor_id, received_date:fiveDaysAgo, invoice_number:'INV-MS-9901', invoice_date:fiveDaysAgo, received_by:userMap.Admin.id, hospital_id:H, is_active:true },{ transaction:t });
    await GrnDetail.bulkCreate([{ grn_id:grn1.grn_id, item_id:iGloves.item_id, ordered_quantity:50, received_quantity:50, batch_number:'GLV-A', expiry_date:d(720), hospital_id:H, is_active:true },{ grn_id:grn1.grn_id, item_id:iSyr.item_id, ordered_quantity:30, received_quantity:28, batch_number:'SYR-A', expiry_date:d(720), hospital_id:H, is_active:true }],{ transaction:t });
    const po2=await PurchaseOrder.create({ po_number:'PO-2025-002', vendor_id:vendors[2].vendor_id, po_date:yesterday, expected_delivery_date:inWeek, total_amount:20*1200+10*480, gst_amount:Math.round((20*1200+10*480)*0.18), net_amount:Math.round((20*1200+10*480)*1.18), status:'Approved', created_by:userMap.Admin.id, approved_by:userMap.Admin.id, hospital_id:H, is_active:true },{ transaction:t });
    await PurchaseOrderDetail.bulkCreate([{ po_id:po2.po_id, item_id:iSuture.item_id, quantity:20, rate:1200, amount:20*1200, hospital_id:H, is_active:true },{ po_id:po2.po_id, item_id:iMask.item_id, quantity:10, rate:480, amount:10*480, hospital_id:H, is_active:true }],{ transaction:t });
    await StockIssue.bulkCreate([
      { issue_date:yesterday, department_id:dGen.id, item_id:iGloves.item_id, quantity:5,  purpose:'Ward consumption',      issued_by:userMap.Admin.id, hospital_id:H, is_active:true },
      { issue_date:today,     department_id:dCar.id, item_id:iSyr.item_id,    quantity:4,  purpose:'ICU procedures',         issued_by:userMap.Admin.id, hospital_id:H, is_active:true },
      { issue_date:today,     department_id:dOrt.id, item_id:iBandage.item_id,quantity:10, purpose:'Post-surgical dressing', issued_by:userMap.Admin.id, hospital_id:H, is_active:true },
    ],{ transaction:t });
    await StockReturn.create({ return_date:today, department_id:dCar.id, item_id:iSyr.item_id, quantity:1, reason:'Damaged packaging', returned_by:userMap.Nurse.id, hospital_id:H, is_active:true },{ transaction:t });
    console.log(`  ✔ Inventory + Vendors + POs + GRN + Stock Issues/Return`);

    // ── 9. CHARGES + LAB TESTS + RAD TESTS ──────────────────────────
    const charges = await ChargeMaster.bulkCreate([
      { service_code:'C-CONS-GEN', service_name:'General OPD Consultation', service_type:'Consultation', department_id:dGen.id, charge_amount:500,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-CONS-CAR', service_name:'Cardiology Consultation',  service_type:'Consultation', department_id:dCar.id, charge_amount:800,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-CONS-PED', service_name:'Pediatric Consultation',   service_type:'Consultation', department_id:dPed.id, charge_amount:600,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-CONS-ORT', service_name:'Orthopedic Consultation',  service_type:'Consultation', department_id:dOrt.id, charge_amount:700,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-CONS-GYN', service_name:'Gynecology Consultation',  service_type:'Consultation', department_id:dGyn.id, charge_amount:700,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-CONS-NEU', service_name:'Neurology Consultation',   service_type:'Consultation', department_id:dNeu.id, charge_amount:900,   gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-ROOM-GEN', service_name:'General Ward per Day',     service_type:'Room',         department_id:dGen.id, charge_amount:1200,  gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-ROOM-PVT', service_name:'Private Room per Day',     service_type:'Room',         department_id:dGen.id, charge_amount:3000,  gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-ROOM-ICU', service_name:'ICU Bed per Day',          service_type:'Room',         department_id:dGen.id, charge_amount:5000,  gst_percentage:0,  hospital_id:H, is_active:true },
      { service_code:'C-PROC-ECG', service_name:'ECG',                       service_type:'Procedure',    department_id:dCar.id, charge_amount:400,   gst_percentage:18, hospital_id:H, is_active:true },
      { service_code:'C-PROC-DRS', service_name:'Wound Dressing',            service_type:'Procedure',    department_id:dGen.id, charge_amount:250,   gst_percentage:18, hospital_id:H, is_active:true },
      { service_code:'C-OT-MAJOR', service_name:'Major OT Charges',          service_type:'Procedure',    department_id:dOrt.id, charge_amount:25000, gst_percentage:18, hospital_id:H, is_active:true },
    ],{ transaction:t });
    const getCharge = code => charges.find(c=>c.service_code===code);

    const labTests = await LabTest.bulkCreate([
      { test_code:'LAB-CBC',   test_name:'Complete Blood Count',        test_category:'Hematology',    department:'Lab', sample_type:'Blood', sample_volume:'3ml',  container_type:'EDTA',        normal_range:'Hb 12-16',         turn_around_time_hours:4, charge:350,  hospital_id:H, is_active:true },
      { test_code:'LAB-LIPID', test_name:'Lipid Profile',               test_category:'Biochemistry',  department:'Lab', sample_type:'Blood', sample_volume:'5ml',  container_type:'SST',         normal_range:'Total <200 mg/dL', turn_around_time_hours:6, charge:800,  hospital_id:H, is_active:true },
      { test_code:'LAB-TSH',   test_name:'TSH',                          test_category:'Endocrinology', department:'Lab', sample_type:'Blood', sample_volume:'3ml',  container_type:'SST',         normal_range:'0.4-4.0 mIU/L',   turn_around_time_hours:8, charge:450,  hospital_id:H, is_active:true },
      { test_code:'LAB-LFT',   test_name:'Liver Function Test',          test_category:'Biochemistry',  department:'Lab', sample_type:'Blood', sample_volume:'5ml',  container_type:'SST',         normal_range:'AST/ALT <40',      turn_around_time_hours:6, charge:600,  hospital_id:H, is_active:true },
      { test_code:'LAB-KFT',   test_name:'Kidney Function Test',         test_category:'Biochemistry',  department:'Lab', sample_type:'Blood', sample_volume:'5ml',  container_type:'SST',         normal_range:'Creatinine 0.6-1.2',turn_around_time_hours:6, charge:550, hospital_id:H, is_active:true },
      { test_code:'LAB-URINE', test_name:'Urine Routine & Microscopy',   test_category:'Microbiology',  department:'Lab', sample_type:'Urine', sample_volume:'10ml', container_type:'Sterile cup', normal_range:'Clear',            turn_around_time_hours:3, charge:200,  hospital_id:H, is_active:true },
      { test_code:'LAB-HBA1C', test_name:'HbA1c',                        test_category:'Endocrinology', department:'Lab', sample_type:'Blood', sample_volume:'3ml',  container_type:'EDTA',        normal_range:'<7%',              turn_around_time_hours:6, charge:650,  hospital_id:H, is_active:true },
      { test_code:'LAB-ECHO',  test_name:'Echocardiogram (2D Echo)',      test_category:'Cardiology',    department:'Lab', sample_type:'N/A',   sample_volume:'N/A',  container_type:'N/A',         normal_range:'EF >55%',          turn_around_time_hours:2, charge:1800, hospital_id:H, is_active:true },
    ],{ transaction:t });
    const getLab = code => labTests.find(l=>l.test_code===code);

    const radTests = await RadiologyTests.bulkCreate([
      { test_code:'RAD-XR-CH',  test_name:'X-Ray Chest PA',          modality:'X-Ray', body_part:'Chest',  contrast_required:false, preparation_instructions:'None',                duration_minutes:10, charge:400,  hospital_id:H, is_active:true },
      { test_code:'RAD-XR-KN',  test_name:'X-Ray Knee AP+Lat',       modality:'X-Ray', body_part:'Knee',   contrast_required:false, preparation_instructions:'None',                duration_minutes:10, charge:500,  hospital_id:H, is_active:true },
      { test_code:'RAD-USG-AB', test_name:'USG Abdomen & Pelvis',     modality:'USG',   body_part:'Abdomen',contrast_required:false, preparation_instructions:'Empty stomach 6 hrs', duration_minutes:20, charge:900,  hospital_id:H, is_active:true },
      { test_code:'RAD-CT-CH',  test_name:'CT Chest',                 modality:'CT',    body_part:'Chest',  contrast_required:false, preparation_instructions:'None',                duration_minutes:15, charge:4500, hospital_id:H, is_active:true },
      { test_code:'RAD-CT-HD',  test_name:'CT Head Plain',            modality:'CT',    body_part:'Head',   contrast_required:false, preparation_instructions:'None',                duration_minutes:15, charge:3500, hospital_id:H, is_active:true },
      { test_code:'RAD-MRI-BR', test_name:'MRI Brain with contrast',  modality:'MRI',   body_part:'Brain',  contrast_required:true,  preparation_instructions:'Remove metal items',  duration_minutes:45, charge:8500, hospital_id:H, is_active:true },
    ],{ transaction:t });
    const getRad = code => radTests.find(r=>r.test_code===code);
    console.log(`  ✔ Charges + Lab Tests (${labTests.length}) + Rad Tests (${radTests.length})`);

    // ── 10. EQUIPMENT ────────────────────────────────────────────────
    const equipment = await Equipment.bulkCreate([
      { equipment_code:'EQ-001', serial_number:'SN-XR-1001',  equipment_name:'X-Ray Machine',        equipment_type:'Imaging',    manufacturer:'Siemens',model_number:'XR-100',  department_id:dRad.id, purchase_date:'2023-01-15', purchase_cost:1500000, warranty_start:'2023-01-15', warranty_end:'2026-01-14', amc_start:'2026-01-15', amc_end:'2027-01-14', amc_vendor:'Siemens India', status:'Active',            hospital_id:H, is_active:true },
      { equipment_code:'EQ-002', serial_number:'SN-USG-2001', equipment_name:'USG Scanner',          equipment_type:'Imaging',    manufacturer:'GE',     model_number:'LOGIQ-E9',department_id:dRad.id, purchase_date:'2024-03-10', purchase_cost:800000,  warranty_start:'2024-03-10', warranty_end:'2027-03-09', amc_start:null, amc_end:null, amc_vendor:null,           status:'Active',            hospital_id:H, is_active:true },
      { equipment_code:'EQ-003', serial_number:'SN-VEN-3001', equipment_name:'ICU Ventilator',       equipment_type:'ICU',        manufacturer:'Drager', model_number:'V500',    department_id:dGen.id, purchase_date:'2024-06-01', purchase_cost:1200000, warranty_start:'2024-06-01', warranty_end:'2027-05-31', amc_start:null, amc_end:null, amc_vendor:null,           status:'Active',            hospital_id:H, is_active:true },
      { equipment_code:'EQ-004', serial_number:'SN-ECG-4001', equipment_name:'ECG Machine',          equipment_type:'Diagnostic', manufacturer:'BPL',    model_number:'Cardiart', department_id:dCar.id, purchase_date:'2025-01-20', purchase_cost:60000,   warranty_start:'2025-01-20', warranty_end:'2027-01-19', amc_start:null, amc_end:null, amc_vendor:null,           status:'Active',            hospital_id:H, is_active:true },
      { equipment_code:'EQ-005', serial_number:'SN-ANA-5001', equipment_name:'Haematology Analyser', equipment_type:'Diagnostic', manufacturer:'Sysmex', model_number:'XN-550',  department_id:dLab.id, purchase_date:'2023-09-01', purchase_cost:350000,  warranty_start:'2023-09-01', warranty_end:'2026-08-31', amc_start:null, amc_end:null, amc_vendor:null,           status:'Under Maintenance', hospital_id:H, is_active:true },
    ],{ transaction:t });
    await PreventiveMaintenance.bulkCreate(equipment.map(e=>({ equipment_id:e.equipment_id, pm_schedule:'Quarterly', last_pm_date:d(-90), next_pm_date:d(3), pm_checklist:'Visual inspection, cleaning, calibration, functional test', hospital_id:H, is_active:true })),{ transaction:t });
    const mr1=await MaintenanceRequest.create({ equipment_id:equipment[4].equipment_id, hospital_id:H, request_date:now, reported_by:userMap.LabTech.id, issue_description:'Error E04 - sample probe blocked', priority:'High', status:'In Progress', is_active:true },{ transaction:t });
    await MaintenanceHistory.create({ request_id:mr1.request_id, equipment_id:equipment[4].equipment_id, hospital_id:H, maintenance_date:today, maintenance_type:'Breakdown', work_done:'Probe cleaned and re-seated', parts_replaced:'Probe seal', cost:8500, serviced_by:'Sysmex Engineer', next_service_date:d(180), is_active:true },{ transaction:t });
    const mr2=await MaintenanceRequest.create({ equipment_id:equipment[0].equipment_id, hospital_id:H, request_date:dt(-3), reported_by:userMap.Radiologist.id, issue_description:'Image quality degradation', priority:'Medium', status:'Resolved', is_active:true },{ transaction:t });
    await MaintenanceHistory.create({ request_id:mr2.request_id, equipment_id:equipment[0].equipment_id, hospital_id:H, maintenance_date:yesterday, maintenance_type:'Breakdown', work_done:'Replaced collimator, recalibrated kV/mAs', parts_replaced:'Collimator blades', cost:32000, serviced_by:'Siemens Service', next_service_date:d(180), is_active:true },{ transaction:t });
    await CalibrationLog.bulkCreate(equipment.map(e=>({ equipment_id:e.equipment_id, hospital_id:H, calibration_date:d(-7), next_due_date:d(358), calibrated_by:'Biomedical Dept', agency:'NABL Lab', certificate_number:`CAL-NBH-${e.equipment_id}-2025`, result:'Pass', notes:'All parameters within tolerance', is_active:true })),{ transaction:t });
    console.log(`  ✔ Equipment (${equipment.length}) + PM + Maintenance + Calibration`);

    // ── 11. SHIFTS + ROSTER + ATTENDANCE + LEAVE ─────────────────────
    const shifts = await Shift.bulkCreate([
      { shift_name:'Morning', start_time:'08:00:00', end_time:'14:00:00', hospital_id:H, is_active:true },
      { shift_name:'Evening', start_time:'14:00:00', end_time:'20:00:00', hospital_id:H, is_active:true },
      { shift_name:'Night',   start_time:'20:00:00', end_time:'08:00:00', hospital_id:H, is_active:true },
    ],{ transaction:t });
    const uniqEmps = Object.values(empMap);
    const rosterRows=[];
    for (const dayOff of [0,1,2])
      uniqEmps.forEach((emp,i) => rosterRows.push({ employee_id:emp.employee_id, shift_id:shifts[i%3].shift_id, roster_date:d(dayOff), status:'Confirmed', remarks:'Auto', hospital_id:H, created_by:userMap.HR.id }));
    await EmployeeRoster.bulkCreate(rosterRows,{ transaction:t });
    const attRows=[];
    for (const emp of uniqEmps)
      for (const [date,cout] of [[today,null],[yesterday,'14:05:00'],[twoDaysAgo,'14:10:00']])
        attRows.push({ employee_id:emp.employee_id, attendance_date:date, check_in_time:'08:30:00', check_out_time:cout, status:'Present', hospital_id:H, is_active:true });
    await EmployeeAttendance.bulkCreate(attRows,{ transaction:t });
    await LeaveRequest.bulkCreate([
      { employee_id:empMap.Nurse.employee_id,        leave_type:'casual', from_date:inWeek,  to_date:inWeek,   no_of_days:1, reason:'Personal work',   status:'pending',  hospital_id:H, is_active:true },
      { employee_id:empMap.Pharmacist.employee_id,   leave_type:'earned', from_date:inWeek,  to_date:inTen,    no_of_days:4, reason:'Vacation',        status:'approved', approver_id:empMap.HR.employee_id, approval_date:now, hospital_id:H, is_active:true },
      { employee_id:empMap.LabTech.employee_id,      leave_type:'medical', from_date:yesterday,to_date:today,   no_of_days:2, reason:'Fever',           status:'approved', approver_id:empMap.HR.employee_id, approval_date:dt(-2), hospital_id:H, is_active:true },
      { employee_id:empMap.Receptionist.employee_id, leave_type:'casual', from_date:tomorrow,to_date:tomorrow, no_of_days:1, reason:'Family function', status:'rejected', approver_id:empMap.HR.employee_id, approval_date:now, hospital_id:H, is_active:true },
    ],{ transaction:t });
    console.log(`  ✔ Shifts + Roster (${rosterRows.length}) + Attendance (${attRows.length}) + Leaves (4)`);

    // ── 12. OPD FLOW ─────────────────────────────────────────────────
    const mkAppt = (pat,doc,dept,time,vType,status,date=today) =>
      OpdAppointment.create({ patient_id:pat.patient_id, doctor_id:doc.id, department_id:dept.id, appointment_date:date, appointment_time:time, visit_type:vType, status, hospital_id:H, is_active:true },{ transaction:t });

    // Today appointments (all statuses)
    const a1=await mkAppt(pArjun,   dAnita,  dGen, '09:00:00','New',       'Completed');
    const a2=await mkAppt(pMeera,   dAnita,  dGen, '09:15:00','Follow-up', 'Completed');
    const a3=await mkAppt(pRohan,   dRajesh, dCar, '10:00:00','New',       'Completed');
    const a4=await mkAppt(pSita,    dRajesh, dCar, '10:15:00','Follow-up', 'Consulted');
    const a5=await mkAppt(pVikram,  dAnita,  dGen, '10:30:00','New',       'Checked-in');
    const a6=await mkAppt(pPreethi, dPriya,  dPed, '11:00:00','New',       'Checked-in');
    await mkAppt(pMohammed,dRajesh, dCar, '11:15:00','Follow-up', 'Booked');
    await mkAppt(pAnanya,  dKavitha,dGyn, '11:30:00','New',       'Booked');
    await mkAppt(pSuresh,  dArjun,  dNeu, '12:00:00','New',       'Booked');
    await mkAppt(pGanesh,  dSanjay, dOrt, '12:30:00','Follow-up', 'Booked');
    // Yesterday
    const ah1=await mkAppt(pArjun,  dAnita,  dGen, '09:00:00','Follow-up', 'Completed',yesterday);
    const ah2=await mkAppt(pLakshmi,dAnita,  dGen, '09:30:00','New',       'Completed',yesterday);
    const ah3=await mkAppt(pGeetha, dKavitha,dGyn, '10:00:00','New',       'Completed',yesterday);
    await mkAppt(pRavi,    dPriya,  dPed, '10:30:00','New',       'No-show',  yesterday);
    // Future
    await mkAppt(pDeepa,  dKavitha,dGyn, '09:00:00','New',       'Booked',   tomorrow);
    await mkAppt(pKiran,  dPriya,  dPed, '09:30:00','New',       'Booked',   tomorrow);
    await mkAppt(pMeera,  dRajesh, dCar, '10:00:00','Follow-up', 'Booked',   inWeek);
    await mkAppt(pSuresh, dArjun,  dNeu, '11:00:00','Follow-up', 'Booked',   inWeek);
    await mkAppt(pGanesh, dSanjay, dOrt, '11:30:00','Follow-up', 'Booked',   inWeek);
    await mkAppt(pAnanya, dAnita,  dGen, '12:00:00','New',       'Booked',   inWeek);
    console.log(`  ✔ OPD Appointments (20)`);

    // OPD Visits helper
    const mkVisit = async (pat,doc,dept,appt,token,status,vType,date=today) => {
      const visit = await OpdVisit.create({ appointment_id:appt?appt.appointment_id:null, patient_id:pat.patient_id, uhid:pat.uhid, doctor_id:doc.id, department_id:dept.id, visit_date:date, token_number:token, visit_type:vType, status, checked_in_at:now, hospital_id:H, is_active:true },{ transaction:t });
      const ep = await BillingEpisode.create({ patient_id:pat.patient_id, hospital_id:H, uhid:pat.uhid, episode_type:'OPD', opd_visit_id:visit.visit_id, start_date:new Date(date), status:status==='Completed'?'Closed':'Open', is_active:true },{ transaction:t });
      return { visit, ep };
    };

    // Today visits (all statuses)
    const v1=await mkVisit(pArjun,   dAnita,  dGen, a1, 1,'Completed',       'New');
    const v2=await mkVisit(pMeera,   dAnita,  dGen, a2, 2,'Completed',       'Follow-up');
    const v3=await mkVisit(pRohan,   dRajesh, dCar, a3, 3,'Completed',       'New');
    const v4=await mkVisit(pSita,    dRajesh, dCar, a4, 4,'In-consultation', 'Follow-up');
    const v5=await mkVisit(pVikram,  dAnita,  dGen, a5, 5,'Checked-in',      'New');
    const v6=await mkVisit(pPreethi, dPriya,  dPed, a6, 6,'Checked-in',      'New');
    // Yesterday visits
    const v7=await mkVisit(pArjun,   dAnita,  dGen, ah1,1,'Completed','Follow-up',yesterday);
    const v8=await mkVisit(pLakshmi, dAnita,  dGen, ah2,2,'Checked-in','New',       yesterday);
    const v9=await mkVisit(pGeetha,  dKavitha,dGyn, ah3,3,'Completed','New',       yesterday);
    console.log(`  ✔ OPD Visits (9) + Billing Episodes`);

    // Vitals
    const vData=[
      { v:v1, s:122,di:80, p:76, temp:98.6,rr:16,o2:98,wt:72,ht:172 },
      { v:v2, s:118,di:76, p:72, temp:98.4,rr:15,o2:99,wt:58,ht:160 },
      { v:v3, s:140,di:90, p:88, temp:99.1,rr:18,o2:96,wt:85,ht:175 },
      { v:v4, s:145,di:92, p:90, temp:98.8,rr:17,o2:95,wt:68,ht:158 },
      { v:v5, s:130,di:84, p:82, temp:98.5,rr:16,o2:97,wt:78,ht:168 },
      { v:v6, s:96, di:62, p:100,temp:100.2,rr:22,o2:97,wt:22,ht:112 },
      { v:v7, s:120,di:78, p:74, temp:98.2,rr:16,o2:99,wt:72,ht:172 },
      { v:v8, s:128,di:82, p:78, temp:98.6,rr:16,o2:98,wt:64,ht:161 },
      { v:v9, s:112,di:70, p:68, temp:98.2,rr:14,o2:99,wt:56,ht:155 },
    ];
    for (const vi of vData)
      await OpdVital.create({ visit_id:vi.v.visit.visit_id, bp_systolic:vi.s, bp_diastolic:vi.di, pulse_rate:vi.p, temperature:vi.temp, respiratory_rate:vi.rr, spo2:vi.o2, weight:vi.wt, height:vi.ht, bmi:parseFloat((vi.wt/Math.pow(vi.ht/100,2)).toFixed(1)), hospital_id:H, recorded_at:now, is_active:true },{ transaction:t });
    console.log(`  ✔ OPD Vitals (${vData.length})`);

    // Consultations
    const cDefs=[
      { v:v1, pat:pArjun,   doc:dAnita,  complaints:'Fever, body ache, sore throat x 3 days',       dx:'Acute Viral URTI',                 code:'J06.9', plan:'Paracetamol SOS, Cetirizine OD, rest' },
      { v:v2, pat:pMeera,   doc:dAnita,  complaints:'Follow-up hypertension — BP check',             dx:'Essential Hypertension controlled', code:'I10',   plan:'Continue Telmisartan 40mg OD, review 1 month' },
      { v:v3, pat:pRohan,   doc:dRajesh, complaints:'Chest pain on exertion, SOB on stairs',         dx:'Stable Angina (CAD?)',              code:'I20.8', plan:'Stress test, ECG done, Aspirin + Atorvastatin' },
      { v:v7, pat:pArjun,   doc:dAnita,  complaints:'Follow-up viral fever — improved',              dx:'Viral URTI — recovering',           code:'J06.9', plan:'Discontinue Paracetamol, monitor' },
      { v:v8, pat:pLakshmi, doc:dAnita,  complaints:'Fatigue, weight gain, cold intolerance x 2 mo',dx:'Hypothyroidism',                    code:'E03.9', plan:'TSH done — started Levothyroxine 50mcg OD' },
      { v:v9, pat:pGeetha,  doc:dKavitha,complaints:'Menstrual irregularity, pelvic pain',           dx:'Uterine Fibroid (suspected)',       code:'D25.9', plan:'USG done, CA125 ordered, gynaec review' },
    ];
    const consults=[];
    for (const c of cDefs) {
      const consult=await OpdConsultation.create({ visit_id:c.v.visit.visit_id, patient_id:c.pat.patient_id, doctor_id:c.doc.id, chief_complaints:c.complaints, clinical_notes:'Patient stable. No acute distress.', examination_findings:'General exam: unremarkable.', diagnosis_code:c.code, diagnosis_description:c.dx, treatment_plan:c.plan, follow_up_date:inWeek, follow_up_instructions:'Return if symptoms worsen', consultation_date:now, hospital_id:H, is_active:true },{ transaction:t });
      consults.push({ consult, ...c });
      await PatientClinicalHistory.create({ patient_id:c.pat.patient_id, hospital_id:H, visit_type:'OPD', visit_id:c.v.visit.visit_id, visit_date:today, chief_complaints:c.complaints, diagnosis:c.dx, clinical_notes:c.plan, doctor_id:c.doc.id, department_id:c.doc.department_id, recorded_at:now, isActive:true },{ transaction:t });
    }
    console.log(`  ✔ OPD Consultations (${consults.length})`);

    // Prescriptions
    const pDefs=[
      { con:consults[0], pat:pArjun,   med:'M001', dose:'1 tab', freq:'TDS',dur:'5 days', qty:15, instr:'After meals' },
      { con:consults[0], pat:pArjun,   med:'M013', dose:'1 tab', freq:'OD', dur:'5 days', qty:5,  instr:'At night' },
      { con:consults[1], pat:pMeera,   med:'M008', dose:'1 tab', freq:'OD', dur:'30 days',qty:30, instr:'Morning before food' },
      { con:consults[2], pat:pRohan,   med:'M010', dose:'1 tab', freq:'OD', dur:'30 days',qty:30, instr:'At night' },
      { con:consults[2], pat:pRohan,   med:'M009', dose:'1 tab', freq:'OD', dur:'30 days',qty:30, instr:'Morning' },
      { con:consults[3], pat:pArjun,   med:'M006', dose:'1 tab', freq:'OD', dur:'5 days', qty:5,  instr:'Before food' },
      { con:consults[4], pat:pLakshmi, med:'M006', dose:'1 tab', freq:'BD', dur:'30 days',qty:60, instr:'Before meals' },
      { con:consults[5], pat:pGeetha,  med:'M002', dose:'1 tab', freq:'BD', dur:'5 days', qty:10, instr:'After food' },
    ];
    const prescriptions=[];
    for (const p of pDefs) {
      const m=getMed(p.med);
      const presc=await OpdPrescription.create({ consultation_id:p.con.consult.consultation_id, visit_id:p.con.v.visit.visit_id, patient_id:p.pat.patient_id, medicine_id:m.medicine_id, medicine_name:m.medicine_name, dosage:p.dose, frequency:p.freq, route:'Oral', duration:p.dur, quantity:p.qty, instructions:p.instr, prescribed_by:p.con.doc.id, prescribed_at:now, hospital_id:H, is_active:true },{ transaction:t });
      prescriptions.push(presc);
      await PatientMedicationHistory.create({ patient_id:p.pat.patient_id, hospital_id:H, visit_type:'OPD', visit_id:p.con.v.visit.visit_id, medicine_id:m.medicine_id, medicine_name:m.medicine_name, dosage:p.dose, frequency:p.freq, route:'Oral', duration:p.dur, start_date:today, status:'Active', prescribed_by:p.con.doc.id, prescribed_at:now, isActive:true },{ transaction:t });
    }
    console.log(`  ✔ Prescriptions (${prescriptions.length}) + Medication Histories`);

    // OPD Pharmacy Sales (5 dispensed prescriptions)
    const opdSales = [];
    for (const [idx,medCode,pat] of [[0,'M001',pArjun],[1,'M013',pArjun],[2,'M008',pMeera],[3,'M010',pRohan],[6,'M006',pLakshmi]]) {
      const m=getMed(medCode), bat=getBatch(medCode), presc=prescriptions[idx];
      const net=presc.quantity*m.selling_rate;
      const sale=await PharmacySale.create({ patient_id:pat.patient_id, uhid:pat.uhid, visit_type:'OPD', visit_id:presc.visit_id, prescription_id:presc.prescription_id, sale_date:now, total_amount:net, discount_amount:0, tax_amount:0, net_amount:net, payment_mode:'Cash', dispensed_by:userMap.Pharmacist.id, hospital_id:H, is_active:true },{ transaction:t });
      await PharmacySaleDetail.create({ sale_id:sale.sale_id, medicine_id:m.medicine_id, batch_id:bat?.batch_id, medicine_name:m.medicine_name, quantity:presc.quantity, rate:m.selling_rate, amount:net, gst_percentage:0, hospital_id:H, is_active:true },{ transaction:t });
      // Mark the prescription as Dispensed so it won't reappear on the dispense screen.
      await presc.update({ dispense_status:'Dispensed' }, { transaction:t });
      opdSales.push(sale);
    }
    console.log(`  ✔ OPD Pharmacy Sales (5)`);

    // ── 13. IPD — 7 admissions (5 active + 2 discharged) ─────────────
    const mkAdmission = async (pat,doc,dept,ward,reason,dx,type,daysAgo,advance,status='Admitted') => {
      const bed=nextBed(ward.ward_id);
      if (!bed) throw new Error(`No available bed in ward ${ward.ward_name}`);
      const admDate=dt(-daysAgo,10);
      const adm=await IpdAdmission.create({ patient_id:pat.patient_id, uhid:pat.uhid, admitting_doctor_id:doc.id, department_id:dept.id, ward_id:ward.ward_id, bed_id:bed.bed_id, room_number:bed.room_number, bed_number:bed.bed_number, admission_date:admDate, admission_reason:reason, provisional_diagnosis:dx, admission_type:type, advance_paid:advance, status, admitted_by:userMap.Admin.id, hospital_id:H, is_active:true },{ transaction:t });
      await markOccupied(bed.bed_id);
      const ep=await BillingEpisode.create({ patient_id:pat.patient_id, hospital_id:H, uhid:pat.uhid, episode_type:'IPD', admission_id:adm.admission_id, start_date:admDate, status:status==='Admitted'?'Open':'Closed', is_active:true },{ transaction:t });
      return { adm, ep, bed };
    };

    const ipd1=await mkAdmission(pMohammed, dRajesh, dCar, wICU,    'Chest pain, diaphoresis, ST elevation',         'Acute STEMI',            'Emergency', 2, 5000);
    const ipd2=await mkAdmission(pSita,     dAnita,  dGen, wPvt,    'Uncontrolled DM, BS 420 mg/dL',                'Diabetic Ketoacidosis',   'Emergency', 2, 10000);
    const ipd3=await mkAdmission(pSuresh,   dArjun,  dNeu, wGen,    'Increasing breathlessness, wheezing x 2 days', 'COPD Exacerbation',       'Emergency', 3, 5000);
    const ipd4=await mkAdmission(pGanesh,   dSanjay, dOrt, wGen,    'Elective Total Knee Replacement',               'Severe OA Right Knee',    'Planned',   1, 15000);
    const ipd5=await mkAdmission(pAnanya,   dKavitha,dGyn, wPvt,    'Labour pain G2P1 38 weeks',                    'Pregnancy at term',       'Emergency', 1, 10000);
    const ipd6=await mkAdmission(pRohan,    dRajesh, dCar, wGen,    'Stable angina — for coronary angiogram',        'CAD stable angina',       'Planned',   7, 10000, 'Discharged');
    const ipd7=await mkAdmission(pVikram,   dAnita,  dGen, wGen,    'Right iliac fossa pain, guarding',              'Acute Appendicitis',      'Emergency', 9, 5000,  'Discharged');
    console.log(`  ✔ IPD Admissions (7 — 5 active, 2 discharged)`);

    // Nurse Assignments for active admissions
    for (const ipdInfo of [ipd1,ipd2,ipd3,ipd4,ipd5])
      await IpdNurseAssignment.create({ admission_id:ipdInfo.adm.admission_id, patient_id:ipdInfo.adm.patient_id, nurse_id:empMap.Nurse.employee_id, ward_id:ipdInfo.adm.ward_id, shift:'Morning', assigned_from:now, is_primary_nurse:true, status:'Active', hospital_id:H, is_active:true },{ transaction:t });

    // IPD Vitals (3 readings per active patient)
    const ipdVD=[
      { adm:ipd1.adm, vs:[{ s:130,di:85,p:92,temp:98.8,rr:18,o2:95,bs:145,note:'Post-thrombolysis, improving' },{ s:124,di:80,p:88,temp:98.6,rr:16,o2:97,bs:132,note:'Stable on anticoagulants' },{ s:120,di:78,p:82,temp:98.4,rr:15,o2:98,bs:118,note:'Markedly improved' }] },
      { adm:ipd2.adm, vs:[{ s:138,di:90,p:95,temp:99.0,rr:20,o2:94,bs:380,note:'DKA — IV insulin started' },{ s:130,di:84,p:88,temp:98.8,rr:18,o2:96,bs:220,note:'BS declining, ketones clearing' },{ s:122,di:80,p:80,temp:98.5,rr:16,o2:98,bs:160,note:'Ketones cleared' }] },
      { adm:ipd3.adm, vs:[{ s:128,di:82,p:98,temp:98.6,rr:24,o2:88,bs:null,note:'Bronchospasm — nebulised' },{ s:124,di:80,p:90,temp:98.4,rr:20,o2:93,bs:null,note:'Improving with nebulisation' },{ s:120,di:78,p:84,temp:98.2,rr:18,o2:95,bs:null,note:'SpO2 stable' }] },
      { adm:ipd4.adm, vs:[{ s:122,di:80,p:78,temp:98.4,rr:16,o2:98,bs:98, note:'Pre-op stable' },{ s:118,di:76,p:76,temp:98.2,rr:15,o2:99,bs:95, note:'POD1 — comfortable' },{ s:120,di:78,p:74,temp:98.0,rr:14,o2:99,bs:100,note:'POD2 — mobilised with walker' }] },
      { adm:ipd5.adm, vs:[{ s:110,di:70,p:88,temp:98.6,rr:18,o2:99,bs:null,note:'Active labour, CTG normal' },{ s:112,di:72,p:90,temp:98.8,rr:20,o2:98,bs:null,note:'Delivered LSCS, baby healthy' },{ s:114,di:74,p:80,temp:98.2,rr:16,o2:99,bs:null,note:'Post-LSCS, breastfeeding initiated' }] },
    ];
    for (const iv of ipdVD)
      for (let ri=0; ri<iv.vs.length; ri++) {
        const v=iv.vs[ri];
        await IpdVital.create({ admission_id:iv.adm.admission_id, patient_id:iv.adm.patient_id, recorded_by:userMap.Nurse.id, recorded_date:d(-ri), recorded_time:['08:00:00','12:00:00','20:00:00'][ri], systolic_bp:v.s, diastolic_bp:v.di, pulse_rate:v.p, temperature:v.temp, respiratory_rate:v.rr, spo2:v.o2, blood_sugar:v.bs, consciousness_level:'Alert', pain_scale:2, intake_ml:400+ri*100, output_ml:300+ri*80, notes:v.note },{ transaction:t });
      }

    // IPD Medications
    const ipdMedDefs=[
      { adm:ipd1.adm, med:'M009', dose:'5mg',  freq:'OD', dur:7  },
      { adm:ipd1.adm, med:'M010', dose:'20mg', freq:'OD', dur:30 },
      { adm:ipd2.adm, med:'M011', dose:'500mg',freq:'BD', dur:7  },
      { adm:ipd2.adm, med:'M012', dose:'2mg',  freq:'OD', dur:7  },
      { adm:ipd3.adm, med:'M014', dose:'10mg', freq:'OD', dur:10 },
      { adm:ipd4.adm, med:'M001', dose:'500mg',freq:'TDS',dur:5  },
      { adm:ipd5.adm, med:'M006', dose:'40mg', freq:'OD', dur:5  },
    ];
    for (const md of ipdMedDefs) {
      const m=getMed(md.med);
      const ipdMed=await IpdMedication.create({ admission_id:md.adm.admission_id, prescribed_by:userMap.Doctor.id, medicine_id:m.medicine_id, medicine_name:m.medicine_name, dosage:md.dose, frequency:md.freq, route:'Oral', duration_days:md.dur, start_date:now, instructions:'As directed', status:'Active' },{ transaction:t });
      await IpdMedicationAdministration.create({ medication_id:ipdMed.medication_id, admission_id:md.adm.admission_id, administered_by:userMap.Nurse.id, scheduled_time:now, administered_time:now, dosage_given:md.dose, status:'Administered', notes:'No adverse reaction' },{ transaction:t });
    }

    // IPD Pharmacy dispense (ward-wise for 3 active admissions)
    const ipdSales = {};
    for (const ipdInfo of [ipd1,ipd2,ipd3]) {
      const m=getMed('M001'), bat=getBatch('M001'), net=15*m.selling_rate;
      const sale=await PharmacySale.create({ patient_id:ipdInfo.adm.patient_id, uhid:ipdInfo.adm.uhid, visit_type:'IPD', visit_id:ipdInfo.adm.admission_id, sale_date:now, total_amount:net, net_amount:net, payment_mode:'Ward Issue', dispensed_by:userMap.Pharmacist.id, hospital_id:H, is_active:true },{ transaction:t });
      await PharmacySaleDetail.create({ sale_id:sale.sale_id, medicine_id:m.medicine_id, batch_id:bat?.batch_id, medicine_name:m.medicine_name, quantity:15, rate:m.selling_rate, amount:net, gst_percentage:0, hospital_id:H, is_active:true },{ transaction:t });
      ipdSales[ipdInfo.adm.admission_id] = sale;
    }

    // Progress Notes + Nursing Checklists for active admissions
    for (const ipdInfo of [ipd1,ipd2,ipd3,ipd4,ipd5]) {
      await IpdProgressNote.bulkCreate([
        { admission_id:ipdInfo.adm.admission_id, patient_id:ipdInfo.adm.patient_id, progress_date:today, progress_time:'08:30:00', note_type:'Doctor', doctor_notes:'Patient hemodynamically stable. Continue current management. Review labs.', recorded_by:userMap.Doctor.id, recorded_at:now, hospital_id:H, is_active:true },
        { admission_id:ipdInfo.adm.admission_id, patient_id:ipdInfo.adm.patient_id, progress_date:today, progress_time:'14:00:00', note_type:'Nurse',  nursing_notes:'Patient comfortable, accepting oral fluids. IV site intact.', recorded_by:userMap.Nurse.id, recorded_at:dt(0,14), hospital_id:H, is_active:true },
      ],{ transaction:t });
      await NursingChecklist.create({ admission_id:ipdInfo.adm.admission_id, hospital_id:H, nurse_id:userMap.Nurse.id, shift:'Morning', check_date:today, items:{ bedside_safety:true, iv_line_check:true, catheter_care:true, wound_dressing:true, pain_assessment:true, nutrition_intake:true, medication_given:true, vital_signs_recorded:true }, notes:'All routine checks completed.', is_active:true },{ transaction:t });
    }
    console.log(`  ✔ IPD Nurse Assignments + Vitals + Medications + Progress Notes + Checklists`);

    // Discharge summaries for discharged patients
    await IpdDischargeSummary.create({ admission_id:ipd6.adm.admission_id, patient_id:pRohan.patient_id, discharge_date:now, discharge_type:'Normal', final_diagnosis:'CAD single vessel (RCA 70%) — Post PTCA + DES', procedures_performed:'Coronary Angiogram + PTCA + Drug Eluting Stent (RCA)', clinical_summary:'Elective PTCA uneventful. Post-procedure stable.', discharge_medications:'Aspirin 75mg OD; Clopidogrel 75mg OD; Atorvastatin 40mg OD; Ramipril 5mg OD', follow_up_instructions:'Cardiology OPD in 2 weeks', follow_up_date:inWeek, diet_advice:'Low fat, low salt', activity_restrictions:'Light walking only for 1 week', discharged_by:dRajesh.id, discharge_summary_by:userMap.Doctor.id, hospital_id:H, is_active:true },{ transaction:t });
    await IpdDischargeNursingSummary.create({ admission_id:ipd6.adm.admission_id, primary_nurse_id:empMap.Nurse.employee_id, last_shift_nurse_id:empMap.Nurse.employee_id, patient_condition_at_discharge:'Stable', vitals_at_discharge:{ bp:'118/76',hr:72,spo2:99 }, wound_status:'Femoral site clean', catheter_status:'N/A', iv_line_status:'Removed', discharge_education_given:true, nurse_remarks:'Patient briefed on medications.', hospital_id:H, is_active:true },{ transaction:t });
    await IpdDischargeSummary.create({ admission_id:ipd7.adm.admission_id, patient_id:pVikram.patient_id, discharge_date:dt(-2,11), discharge_type:'Normal', final_diagnosis:'Acute Suppurative Appendicitis — Post laparoscopic appendicectomy', procedures_performed:'Laparoscopic Appendicectomy (3-port)', clinical_summary:'Emergency surgery done. Inflamed appendix, no perforation. Uneventful recovery.', discharge_medications:'Amoxicillin+Clavulanate 625mg BD x 5d; Metronidazole 400mg TDS x 5d; PCM 500mg SOS', follow_up_instructions:'Surgical OPD in 1 week for wound check', follow_up_date:inWeek, diet_advice:'Soft diet for 3 days', activity_restrictions:'No heavy lifting for 4 weeks', discharged_by:dAnita.id, discharge_summary_by:userMap.Doctor.id, hospital_id:H, is_active:true },{ transaction:t });
    await IpdDischargeNursingSummary.create({ admission_id:ipd7.adm.admission_id, primary_nurse_id:empMap.Nurse.employee_id, last_shift_nurse_id:empMap.Nurse.employee_id, patient_condition_at_discharge:'Stable and comfortable', vitals_at_discharge:{ bp:'122/78',hr:84,spo2:99 }, wound_status:'3 port sites clean', catheter_status:'Removed', iv_line_status:'Removed', discharge_education_given:true, nurse_remarks:'Patient and family educated on wound care.', hospital_id:H, is_active:true },{ transaction:t });
    console.log(`  ✔ Discharge Summaries (2)`);

    // ── 14. LAB ORDERS (5 at different stages) ───────────────────────
    // Order 1 — Completed with results + report (Meera)
    const lo1=await LabOrder.create({ patient_id:pMeera.patient_id, uhid:pMeera.uhid, visit_type:'OPD', visit_id:v2.visit.visit_id, ordered_by:dAnita.id, order_date:now, status:'Completed', hospital_id:H, is_active:true },{ transaction:t });
    const lo1d=await LabOrderDetail.bulkCreate([{ order_id:lo1.order_id, test_id:getLab('LAB-CBC').test_id,   test_code:'LAB-CBC',   test_name:'CBC',          sample_type:'Blood', status:'Completed', charge:350,  hospital_id:H, is_active:true },{ order_id:lo1.order_id, test_id:getLab('LAB-LIPID').test_id, test_code:'LAB-LIPID', test_name:'Lipid Profile',sample_type:'Blood', status:'Completed', charge:800,  hospital_id:H, is_active:true }],{ transaction:t });
    await LabSample.create({ order_id:lo1.order_id, barcode:`BC-${lo1.order_id}-01`, sample_type:'Blood', collected_by:userMap.LabTech.id, collection_date:now, received_in_lab_at:now, condition_on_receipt:'Acceptable', hospital_id:H, is_active:true },{ transaction:t });
    await LabResult.bulkCreate([
      { order_id:lo1.order_id, detail_id:lo1d[0].detail_id, test_id:getLab('LAB-CBC').test_id,   result_data:{ Haemoglobin:'14.2 g/dL', WBC:'7800/cmm', Platelets:'2.6 lakh' }, interpretation:'Within normal limits',                         critical_value:false, entered_by:userMap.LabTech.id, entered_at:now, verified_by:userMap.Radiologist.id, verified_at:now, status:'Reported', hospital_id:H, is_active:true },
      { order_id:lo1.order_id, detail_id:lo1d[1].detail_id, test_id:getLab('LAB-LIPID').test_id, result_data:{ Total_Cholesterol:'218 mg/dL', LDL:'145 mg/dL', HDL:'48 mg/dL', TG:'195 mg/dL' }, interpretation:'Borderline high LDL', critical_value:false, entered_by:userMap.LabTech.id, entered_at:now, verified_by:userMap.Radiologist.id, verified_at:now, status:'Reported', hospital_id:H, is_active:true },
    ],{ transaction:t });
    await LabReport.create({ order_id:lo1.order_id, report_url:`/reports/lab/${lo1.order_id}.pdf`, generated_at:now, approved_by:userMap.Radiologist.id, hospital_id:H, is_active:true },{ transaction:t });

    // Order 2 — Completed (TSH for Lakshmi)
    const lo2=await LabOrder.create({ patient_id:pLakshmi.patient_id, uhid:pLakshmi.uhid, visit_type:'OPD', visit_id:v8.visit.visit_id, ordered_by:dAnita.id, order_date:now, status:'Completed', hospital_id:H, is_active:true },{ transaction:t });
    const lo2d=await LabOrderDetail.create({ order_id:lo2.order_id, test_id:getLab('LAB-TSH').test_id, test_code:'LAB-TSH', test_name:'TSH', sample_type:'Blood', status:'Completed', charge:450, hospital_id:H, is_active:true },{ transaction:t });
    await LabSample.create({ order_id:lo2.order_id, barcode:`BC-${lo2.order_id}-01`, sample_type:'Blood', collected_by:userMap.LabTech.id, collection_date:now, received_in_lab_at:now, condition_on_receipt:'Acceptable', hospital_id:H, is_active:true },{ transaction:t });
    await LabResult.create({ order_id:lo2.order_id, detail_id:lo2d.detail_id, test_id:getLab('LAB-TSH').test_id, result_data:{ TSH:'8.4 mIU/L (High)', FT4:'0.7 ng/dL (Low)' }, interpretation:'Overt Hypothyroidism — treatment initiated', critical_value:false, entered_by:userMap.LabTech.id, entered_at:now, verified_by:userMap.Radiologist.id, verified_at:now, status:'Reported', hospital_id:H, is_active:true },{ transaction:t });
    await LabReport.create({ order_id:lo2.order_id, report_url:`/reports/lab/${lo2.order_id}.pdf`, generated_at:now, approved_by:userMap.Radiologist.id, hospital_id:H, is_active:true },{ transaction:t });

    // Order 3 — Sample Collected (Mohammed IPD — LFT+KFT)
    const lo3=await LabOrder.create({ patient_id:pMohammed.patient_id, uhid:pMohammed.uhid, visit_type:'IPD', visit_id:ipd1.adm.admission_id, ordered_by:dRajesh.id, order_date:now, status:'Sample Collected', hospital_id:H, is_active:true },{ transaction:t });
    const lo3d1 = await LabOrderDetail.create({ order_id:lo3.order_id, test_id:getLab('LAB-LFT').test_id, test_code:'LAB-LFT', test_name:'LFT', sample_type:'Blood', status:'Pending', charge:600, hospital_id:H, is_active:true },{ transaction:t });
    const lo3d2 = await LabOrderDetail.create({ order_id:lo3.order_id, test_id:getLab('LAB-KFT').test_id, test_code:'LAB-KFT', test_name:'KFT', sample_type:'Blood', status:'Pending', charge:550, hospital_id:H, is_active:true },{ transaction:t });
    await LabSample.create({ order_id:lo3.order_id, barcode:`BC-${lo3.order_id}-01`, sample_type:'Blood', collected_by:userMap.LabTech.id, collection_date:now, received_in_lab_at:now, condition_on_receipt:'Acceptable', hospital_id:H, is_active:true },{ transaction:t });

    // Order 4 — Ordered (Sita IPD — HbA1c)
    const lo4=await LabOrder.create({ patient_id:pSita.patient_id, uhid:pSita.uhid, visit_type:'IPD', visit_id:ipd2.adm.admission_id, ordered_by:dAnita.id, order_date:now, status:'Ordered', hospital_id:H, is_active:true },{ transaction:t });
    await LabOrderDetail.create({ order_id:lo4.order_id, test_id:getLab('LAB-HBA1C').test_id, test_code:'LAB-HBA1C', test_name:'HbA1c', sample_type:'Blood', status:'Pending', charge:650, hospital_id:H, is_active:true },{ transaction:t });

    // Order 5 — Ordered (Rohan OPD — Echo)
    const lo5=await LabOrder.create({ patient_id:pRohan.patient_id, uhid:pRohan.uhid, visit_type:'OPD', visit_id:v3.visit.visit_id, ordered_by:dRajesh.id, order_date:now, status:'Ordered', hospital_id:H, is_active:true },{ transaction:t });
    await LabOrderDetail.create({ order_id:lo5.order_id, test_id:getLab('LAB-ECHO').test_id, test_code:'LAB-ECHO', test_name:'2D Echo', sample_type:'N/A', status:'Pending', charge:1800, hospital_id:H, is_active:true },{ transaction:t });
    console.log(`  ✔ Lab Orders (5) + Samples + Results + Reports`);

    // ── 15. RADIOLOGY ORDERS (6) ──────────────────────────────────────
    const ro1=await RadiologyOrders.create({ patient_id:pRohan.patient_id, uhid:pRohan.uhid, visit_type:'OPD', visit_id:v3.visit.visit_id, rad_test_id:getRad('RAD-XR-CH').rad_test_id, test_name:'X-Ray Chest PA', modality:'X-Ray', clinical_info:'r/o cardiomegaly', ordered_by:dRajesh.id, order_date:now, scheduled_date:today, scheduled_time:'14:00:00', status:'Reported', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyImaging.create({ rad_order_id:ro1.rad_order_id, imaging_date:now, technologist_id:empMap.Radiologist.employee_id, technical_notes:'PA view acquired.', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyReports.create({ rad_order_id:ro1.rad_order_id, findings:'CTR 0.52 (borderline). Lung fields clear.', impression:'Borderline cardiomegaly. No acute cardiopulmonary pathology.', reported_by:dRajesh.id, reported_at:now, status:'Approved', hospital_id:H, is_active:true },{ transaction:t });

    const ro2=await RadiologyOrders.create({ patient_id:pGeetha.patient_id, uhid:pGeetha.uhid, visit_type:'OPD', visit_id:v9.visit.visit_id, rad_test_id:getRad('RAD-USG-AB').rad_test_id, test_name:'USG Abdomen', modality:'USG', clinical_info:'Pelvic pain, menstrual irregularity', ordered_by:dKavitha.id, order_date:now, scheduled_date:yesterday, scheduled_time:'11:00:00', status:'Reported', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyImaging.create({ rad_order_id:ro2.rad_order_id, imaging_date:dt(-1,11), technologist_id:empMap.Radiologist.employee_id, technical_notes:'Pelvic USG with full bladder.', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyReports.create({ rad_order_id:ro2.rad_order_id, findings:'Uterus bulky with intramural fibroid 3.2x2.8cm. Ovaries normal.', impression:'Uterine Fibroid 3.2cm. Recommend GYN review.', reported_by:dRajesh.id, reported_at:dt(-1,13), status:'Approved', hospital_id:H, is_active:true },{ transaction:t });

    const ro_ipd1 = await RadiologyOrders.create({ patient_id:pMohammed.patient_id, uhid:pMohammed.uhid, visit_type:'IPD', visit_id:ipd1.adm.admission_id, rad_test_id:getRad('RAD-CT-CH').rad_test_id, test_name:'CT Chest', modality:'CT', clinical_info:'Post-STEMI, r/o pulmonary oedema', ordered_by:dRajesh.id, order_date:now, scheduled_date:tomorrow, scheduled_time:'09:00:00', status:'Scheduled', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyOrders.create({ patient_id:pSuresh.patient_id,  uhid:pSuresh.uhid,  visit_type:'IPD', visit_id:ipd3.adm.admission_id, rad_test_id:getRad('RAD-CT-HD').rad_test_id, test_name:'CT Head Plain', modality:'CT', clinical_info:'Headache, r/o stroke', ordered_by:dArjun.id, order_date:now, status:'Ordered', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyOrders.create({ patient_id:pGanesh.patient_id,  uhid:pGanesh.uhid,  visit_type:'IPD', visit_id:ipd4.adm.admission_id, rad_test_id:getRad('RAD-XR-KN').rad_test_id, test_name:'X-Ray Knee', modality:'X-Ray', clinical_info:'Pre-op TKR', ordered_by:dSanjay.id, order_date:now, scheduled_date:today, status:'Scheduled', hospital_id:H, is_active:true },{ transaction:t });
    await RadiologyOrders.create({ patient_id:pAnanya.patient_id,  uhid:pAnanya.uhid,  visit_type:'OPD', visit_id:v1.visit.visit_id, rad_test_id:getRad('RAD-MRI-BR').rad_test_id, test_name:'MRI Brain', modality:'MRI', clinical_info:'Headache, visual disturbance', ordered_by:dArjun.id, order_date:dt(-3), status:'Ordered', hospital_id:H, is_active:true },{ transaction:t });
    const ro_v8 = await RadiologyOrders.create({ patient_id:pLakshmi.patient_id,  uhid:pLakshmi.uhid,  visit_type:'OPD', visit_id:v8.visit.visit_id, rad_test_id:getRad('RAD-USG-AB').rad_test_id, test_name:'USG Neck', modality:'USG', clinical_info:'Thyroid Evaluation', ordered_by:dAnita.id, order_date:now, scheduled_date:today, status:'Scheduled', hospital_id:H, is_active:true },{ transaction:t });
    console.log(`  ✔ Radiology Orders (6) + Imaging (2) + Reports (2)`);

    // ── 16. OT MANAGEMENT ────────────────────────────────────────────
    const otRooms=await OtRoom.bulkCreate([
      { hospital_id:H, room_name:'OT-1 (Major)',     room_type:'Major',     status:'Available', isActive:true },
      { hospital_id:H, room_name:'OT-2 (Minor)',     room_type:'Minor',     status:'Available', isActive:true },
      { hospital_id:H, room_name:'OT-3 (Emergency)', room_type:'Emergency', status:'Available', isActive:true },
    ],{ transaction:t });
    const [ot1,ot2,ot3]=otRooms;

    // OT Booking 1: Completed — Rohan PTCA
    const otb1=await OtBooking.create({ patient_id:pRohan.patient_id, uhid:pRohan.uhid, admission_id:ipd6.adm.admission_id, surgery_date:dt(-7,9), surgery_time:'09:00:00', surgery_name:'PTCA + Drug Eluting Stent (RCA)', surgery_type:'Elective', surgeon_id:dRajesh.id, anesthetist_id:dArjun.id, ot_room_id:ot2.room_id, estimated_duration_minutes:90, status:'Completed', booked_by:userMap.Admin.id, hospital_id:H, isActive:true },{ transaction:t });
    await OtPreOperative.create({ booking_id:otb1.booking_id, patient_id:pRohan.patient_id, consent_taken:true, consent_signed_by:'Patient', npo_status:'NPO since midnight', pre_anesthetic_checkup:true, pre_op_vitals:{ bp:'128/80',hr:74,spo2:98 }, allergies_checked:true, site_marking_done:false, pre_op_medications:'Inj Heparin 5000u IV', lab_reports_available:true, blood_arranged:'2 units PRBC on standby', pre_op_checklist_by:userMap.Nurse.id, completed_at:dt(-7,8), hospital_id:H, is_active:true },{ transaction:t });
    await OtIntraOperative.create({ booking_id:otb1.booking_id, patient_id:pRohan.patient_id, procedure_performed:'PTCA + DES to RCA (proximal, 70% stenosis)', surgery_start_time:'09:15:00', surgery_end_time:'10:30:00', anesthesia_start_time:'09:00:00', anesthesia_end_time:'10:40:00', anesthesia_type:'Local + sedation', anesthesia_notes:'Uneventful', intra_op_findings:'RCA 70% proximal, stent deployed well', procedure_notes:'TIMI 3 flow achieved', complications:'None', blood_loss_ml:30, fluids_given:'500ml NS', urine_output_ml:100, vital_signs:{ bp_avg:'122/78',hr_avg:72 }, implants_used:'DES 3.0x24mm', closure_method:'Pressure dressing', dressing_applied:'Femoral occlusion bandage', recorded_by:userMap.Doctor.id, surgeon_id:dRajesh.id, hospital_id:H, is_active:true },{ transaction:t });
    await OtPostOperative.create({ booking_id:otb1.booking_id, patient_id:pRohan.patient_id, recovery_notes:'Patient alert, femoral site stable', post_op_vitals:{ bp:'120/76',hr:70,spo2:99 }, post_op_orders:'Dual antiplatelet, bed rest 6hrs', pain_management:'Tab PCM 500mg SOS', wound_status:'Femoral site clean', transferred_to_ward:dt(-7,12), post_op_complications:'None', recorded_by:userMap.Nurse.id, hospital_id:H, is_active:true },{ transaction:t });

    // OT Booking 2: Completed — Vikram Laparoscopic Appendicectomy
    const otb2=await OtBooking.create({ patient_id:pVikram.patient_id, uhid:pVikram.uhid, admission_id:ipd7.adm.admission_id, surgery_date:dt(-9,22), surgery_time:'22:00:00', surgery_name:'Emergency Laparoscopic Appendicectomy', surgery_type:'Emergency', surgeon_id:dAnita.id, anesthetist_id:dArjun.id, ot_room_id:ot3.room_id, estimated_duration_minutes:60, status:'Completed', booked_by:userMap.Admin.id, hospital_id:H, isActive:true },{ transaction:t });
    await OtPreOperative.create({ booking_id:otb2.booking_id, patient_id:pVikram.patient_id, consent_taken:true, consent_signed_by:'Patient', npo_status:'NPO 2hrs (emergency)', pre_anesthetic_checkup:true, pre_op_vitals:{ bp:'132/86',hr:98,temp:100.2,spo2:97 }, allergies_checked:true, site_marking_done:true, pre_op_medications:'Inj Cefazolin 1g IV; Inj Metronidazole 500mg IV', lab_reports_available:true, blood_arranged:'Type and screen', pre_op_checklist_by:userMap.Nurse.id, completed_at:dt(-9,21.5), hospital_id:H, is_active:true },{ transaction:t });
    await OtIntraOperative.create({ booking_id:otb2.booking_id, patient_id:pVikram.patient_id, procedure_performed:'Laparoscopic Appendicectomy — 3-port', surgery_start_time:'22:15:00', surgery_end_time:'23:10:00', anesthesia_start_time:'22:00:00', anesthesia_end_time:'23:25:00', anesthesia_type:'GA — intubated', anesthesia_notes:'Uneventful', intra_op_findings:'Acutely inflamed appendix, no perforation', procedure_notes:'Appendix ligated, removed, port sites irrigated', complications:'None', blood_loss_ml:50, fluids_given:'1000ml RL', urine_output_ml:200, vital_signs:{ bp_avg:'126/80',hr_avg:88 }, specimens_sent:'Appendix for histopathology', closure_method:'Vicryl 2-0', dressing_applied:'Sterile x3', recorded_by:userMap.Doctor.id, surgeon_id:dAnita.id, hospital_id:H, is_active:true },{ transaction:t });
    await OtPostOperative.create({ booking_id:otb2.booking_id, patient_id:pVikram.patient_id, recovery_notes:'Extubated in OT, shifted to ward', post_op_vitals:{ bp:'122/78',hr:84,spo2:99 }, post_op_orders:'IV antibiotics 24hrs, oral sips after 4hrs', pain_management:'Inj Tramadol 50mg IV SOS', wound_status:'3 port sites clean', transferred_to_ward:dt(-9,1), post_op_complications:'None', recorded_by:userMap.Nurse.id, hospital_id:H, is_active:true },{ transaction:t });

    // OT Booking 3: Scheduled — Ganesh TKR (tomorrow)
    const otb3=await OtBooking.create({ patient_id:pGanesh.patient_id, uhid:pGanesh.uhid, admission_id:ipd4.adm.admission_id, surgery_date:dt(1,8), surgery_time:'08:00:00', surgery_name:'Total Knee Replacement (Right)', surgery_type:'Elective', surgeon_id:dSanjay.id, anesthetist_id:dArjun.id, ot_room_id:ot1.room_id, estimated_duration_minutes:150, status:'Scheduled', booked_by:userMap.Admin.id, hospital_id:H, isActive:true },{ transaction:t });
    await OtPreOperative.create({ booking_id:otb3.booking_id, patient_id:pGanesh.patient_id, consent_taken:true, consent_signed_by:'Patient', npo_status:'NPO from midnight', pre_anesthetic_checkup:true, pre_op_vitals:{ bp:'126/82',hr:76,spo2:98 }, allergies_checked:true, site_marking_done:true, pre_op_medications:'Inj Cefazolin 1g IV at induction', lab_reports_available:true, blood_arranged:'2 units PRBC crossmatched', pre_op_checklist_by:userMap.Nurse.id, completed_at:now, hospital_id:H, is_active:true },{ transaction:t });

    await OtConsumablesUsed.bulkCreate([
      { booking_id:otb1.booking_id, item_id:iGloves.item_id, item_name:iGloves.item_name, quantity_used:4, batch_number:'GLV-A', recorded_by:userMap.Nurse.id, hospital_id:H, is_active:true },
      { booking_id:otb2.booking_id, item_id:iGloves.item_id, item_name:iGloves.item_name, quantity_used:6, batch_number:'GLV-A', recorded_by:userMap.Nurse.id, hospital_id:H, is_active:true },
      { booking_id:otb2.booking_id, item_id:iSyr.item_id,    item_name:iSyr.item_name,    quantity_used:4, batch_number:'SYR-A', recorded_by:userMap.Nurse.id, hospital_id:H, is_active:true },
    ],{ transaction:t });
    console.log(`  ✔ OT (3 Rooms, 3 Bookings, Pre/Intra/Post-op, Consumables)`);

    // ── 17. BILLING ───────────────────────────────────────────────────
    const addCharge = (epId, svcCode, qty, overrideRate) => {
      const ch=getCharge(svcCode);
      const rate=overrideRate||ch.charge_amount, amt=rate*qty;
      const gst=Math.round(amt*ch.gst_percentage/100);
      return BillCharge.create({ episode_id:epId, hospital_id:H, charge_date:now, service_type:ch.service_type, service_id:ch.charge_id, description:ch.service_name, quantity:qty, rate, amount:amt, discount_percent:0, discount_amount:0, taxable_amount:amt, gst_percent:ch.gst_percentage, gst_amount:gst, net_amount:amt+gst, payment_status:'Unpaid', paid_amount:0, balance_amount:amt+gst, is_active:true },{ transaction:t });
    };

    // --- Golden OPD Patient (Lakshmi - v8) ---
    // 1. Consultation Charge
    await BillCharge.create({ episode_id:v8.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Consultation', service_id:consults[4].consult.consultation_id, description:'General OPD Consultation', quantity:1, rate:500, amount:500, discount_percent:0, discount_amount:0, taxable_amount:500, gst_percent:0, gst_amount:0, net_amount:500, payment_status:'Unpaid', paid_amount:0, balance_amount:500, is_active:true },{ transaction:t });
    // 2. Lab Charge (TSH)
    await BillCharge.create({ episode_id:v8.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Investigation', service_id:lo2d.detail_id, description:'TSH', quantity:1, rate:450, amount:450, discount_percent:0, discount_amount:0, taxable_amount:450, gst_percent:0, gst_amount:0, net_amount:450, payment_status:'Unpaid', paid_amount:0, balance_amount:450, is_active:true },{ transaction:t });
    // 3. Radiology Charge (USG Neck)
    await BillCharge.create({ episode_id:v8.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Investigation', service_id:ro_v8.rad_order_id, description:'USG Neck', quantity:1, rate:1200, amount:1200, discount_percent:0, discount_amount:0, taxable_amount:1200, gst_percent:0, gst_amount:0, net_amount:1200, payment_status:'Unpaid', paid_amount:0, balance_amount:1200, is_active:true },{ transaction:t });
    // 4. Pharmacy Sale
    await BillCharge.create({ episode_id:v8.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Pharmacy', service_id:opdSales[4].sale_id, description:'Pharmacy Medicines', quantity:1, rate:4500, amount:4500, discount_percent:0, discount_amount:0, taxable_amount:4500, gst_percent:0, gst_amount:0, net_amount:4500, payment_status:'Unpaid', paid_amount:0, balance_amount:4500, is_active:true },{ transaction:t });

    // --- Golden IPD Patient (Mohammed - ipd1) ---
    // 1. Room Charge
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Room', service_id:null, description:'ICU Bed Charges', quantity:3, rate:5000, amount:15000, discount_percent:0, discount_amount:0, taxable_amount:15000, gst_percent:0, gst_amount:0, net_amount:15000, payment_status:'Unpaid', paid_amount:0, balance_amount:15000, is_active:true },{ transaction:t });
    // 2. Consultation Charge (Doctor rounds)
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Consultation', service_id:null, description:'Cardiology IPD Rounds', quantity:2, rate:800, amount:1600, discount_percent:0, discount_amount:0, taxable_amount:1600, gst_percent:0, gst_amount:0, net_amount:1600, payment_status:'Unpaid', paid_amount:0, balance_amount:1600, is_active:true },{ transaction:t });
    // 3. Lab Charges (LFT & KFT)
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Investigation', service_id:lo3d1.detail_id, description:'LFT', quantity:1, rate:600, amount:600, discount_percent:0, discount_amount:0, taxable_amount:600, gst_percent:0, gst_amount:0, net_amount:600, payment_status:'Unpaid', paid_amount:0, balance_amount:600, is_active:true },{ transaction:t });
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Investigation', service_id:lo3d2.detail_id, description:'KFT', quantity:1, rate:550, amount:550, discount_percent:0, discount_amount:0, taxable_amount:550, gst_percent:0, gst_amount:0, net_amount:550, payment_status:'Unpaid', paid_amount:0, balance_amount:550, is_active:true },{ transaction:t });
    // 4. Radiology Charge (CT Chest)
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Investigation', service_id:ro_ipd1.rad_order_id, description:'CT Chest', quantity:1, rate:3500, amount:3500, discount_percent:0, discount_amount:0, taxable_amount:3500, gst_percent:0, gst_amount:0, net_amount:3500, payment_status:'Unpaid', paid_amount:0, balance_amount:3500, is_active:true },{ transaction:t });
    // 5. Pharmacy Sale (Ward Issue)
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Pharmacy', service_id:ipdSales[ipd1.adm.admission_id].sale_id, description:'Ward Issue Medicines', quantity:1, rate:ipdSales[ipd1.adm.admission_id].net_amount, amount:ipdSales[ipd1.adm.admission_id].net_amount, discount_percent:0, discount_amount:0, taxable_amount:ipdSales[ipd1.adm.admission_id].net_amount, gst_percent:0, gst_amount:0, net_amount:ipdSales[ipd1.adm.admission_id].net_amount, payment_status:'Unpaid', paid_amount:0, balance_amount:ipdSales[ipd1.adm.admission_id].net_amount, is_active:true },{ transaction:t });
    // 6. Procedure (Angiogram)
    await BillCharge.create({ episode_id:ipd1.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Procedure', service_id:null, description:'Coronary Angiogram', quantity:1, rate:12000, amount:12000, discount_percent:0, discount_amount:0, taxable_amount:12000, gst_percent:0, gst_amount:0, net_amount:12000, payment_status:'Unpaid', paid_amount:0, balance_amount:12000, is_active:true },{ transaction:t });


    // Bill 1 — Arjun OPD (Paid)
    await addCharge(v1.ep.episode_id, 'C-CONS-GEN', 1);
    const b1=await Bill.create({ bill_number:'BILL-000001', episode_id:v1.ep.episode_id, patient_id:pArjun.patient_id, hospital_id:H, uhid:pArjun.uhid, bill_type:'OPD', bill_date:now, gross_amount:500, discount_amount:0, taxable_amount:500, tax_amount:0, net_amount:500, advance_adjusted:0, paid_amount:500, balance_amount:0, payment_status:'Paid', generated_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b1.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'Cash', amount_paid:500, received_by:userMap.Receptionist.id, receipt_number:'RCP-000001', is_active:true },{ transaction:t });

    // Bill 2 — Meera OPD (Paid — consultation + lab)
    await addCharge(v2.ep.episode_id, 'C-CONS-GEN', 1);
    await BillCharge.create({ episode_id:v2.ep.episode_id, hospital_id:H, charge_date:now, service_type:'Lab', service_id:null, description:'CBC + Lipid Profile', quantity:1, rate:1150, amount:1150, discount_percent:0, discount_amount:0, taxable_amount:1150, gst_percent:0, gst_amount:0, net_amount:1150, payment_status:'Unpaid', paid_amount:0, balance_amount:1150, is_active:true },{ transaction:t });
    const b2=await Bill.create({ bill_number:'BILL-000002', episode_id:v2.ep.episode_id, patient_id:pMeera.patient_id, hospital_id:H, uhid:pMeera.uhid, bill_type:'OPD', bill_date:now, gross_amount:1650, discount_amount:0, taxable_amount:1650, tax_amount:0, net_amount:1650, advance_adjusted:0, paid_amount:1650, balance_amount:0, payment_status:'Paid', generated_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b2.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'UPI', amount_paid:1650, received_by:userMap.Receptionist.id, receipt_number:'RCP-000002', transaction_reference:'UPI-TXN-886612', is_active:true },{ transaction:t });

    // Bill 3 — Rohan OPD Cardiology (Partial — paid 500 of 1272)
    await addCharge(v3.ep.episode_id, 'C-CONS-CAR', 1);
    await addCharge(v3.ep.episode_id, 'C-PROC-ECG', 1);
    const b3net=800+400+72; // 400*18% GST = 72
    const b3=await Bill.create({ bill_number:'BILL-000003', episode_id:v3.ep.episode_id, patient_id:pRohan.patient_id, hospital_id:H, uhid:pRohan.uhid, bill_type:'OPD', bill_date:now, gross_amount:b3net, discount_amount:0, taxable_amount:b3net, tax_amount:72, net_amount:b3net, advance_adjusted:0, paid_amount:500, balance_amount:b3net-500, payment_status:'Partial', generated_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b3.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'Cash', amount_paid:500, received_by:userMap.Receptionist.id, receipt_number:'RCP-000003', is_active:true },{ transaction:t });

    // Advances for active IPD patients
    await PaymentAdvance.create({ patient_id:pMohammed.patient_id, admission_id:ipd1.adm.admission_id, hospital_id:H, advance_date:now, amount:5000, utilized_amount:0, balance_amount:5000, payment_mode:'Card', received_by:userMap.Receptionist.id, receipt_number:'ADV-000001', is_active:true },{ transaction:t });
    await PaymentAdvance.create({ patient_id:pSita.patient_id,     admission_id:ipd2.adm.admission_id, hospital_id:H, advance_date:now, amount:10000,utilized_amount:0, balance_amount:10000,payment_mode:'Card', received_by:userMap.Receptionist.id, receipt_number:'ADV-000002', is_active:true },{ transaction:t });
    await PaymentAdvance.create({ patient_id:pGanesh.patient_id,   admission_id:ipd4.adm.admission_id, hospital_id:H, advance_date:now, amount:15000,utilized_amount:0, balance_amount:15000,payment_mode:'Card', received_by:userMap.Receptionist.id, receipt_number:'ADV-000003', is_active:true },{ transaction:t });

    // Bill 4 — Rohan IPD (PTCA, Paid)
    await addCharge(ipd6.ep.episode_id, 'C-OT-MAJOR', 1);
    await addCharge(ipd6.ep.episode_id, 'C-ROOM-GEN', 7);
    await addCharge(ipd6.ep.episode_id, 'C-CONS-CAR', 3);
    const otGst=Math.round(25000*0.18);
    const b4net=25000+otGst+7*1200+3*800;
    const b4=await Bill.create({ bill_number:'BILL-000004', episode_id:ipd6.ep.episode_id, patient_id:pRohan.patient_id, hospital_id:H, uhid:pRohan.uhid, bill_type:'IPD', bill_date:now, gross_amount:b4net, discount_amount:0, taxable_amount:b4net, tax_amount:otGst, net_amount:b4net, advance_adjusted:10000, paid_amount:b4net-10000, balance_amount:0, payment_status:'Paid', generated_by:userMap.Accountant.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b4.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'Card', amount_paid:b4net-10000, received_by:userMap.Accountant.id, receipt_number:'RCP-000004', transaction_reference:'CARD-TXN-5512', is_active:true },{ transaction:t });

    // Bill 5 — Vikram IPD (Appendicectomy, Paid)
    await BillCharge.create({ episode_id:ipd7.ep.episode_id, hospital_id:H, charge_date:d(-9), service_type:'Procedure', service_id:null, description:'Laparoscopic Appendicectomy', quantity:1, rate:7000, amount:7000, discount_percent:0, discount_amount:0, taxable_amount:7000, gst_percent:0, gst_amount:0, net_amount:7000, payment_status:'Unpaid', paid_amount:0, balance_amount:7000, is_active:true },{ transaction:t });
    await addCharge(ipd7.ep.episode_id, 'C-ROOM-GEN', 9);
    await addCharge(ipd7.ep.episode_id, 'C-CONS-GEN', 1);
    const b5net=7000+9*1200+500;
    const b5=await Bill.create({ bill_number:'BILL-000005', episode_id:ipd7.ep.episode_id, patient_id:pVikram.patient_id, hospital_id:H, uhid:pVikram.uhid, bill_type:'IPD', bill_date:now, gross_amount:b5net, discount_amount:0, taxable_amount:b5net, tax_amount:0, net_amount:b5net, advance_adjusted:5000, paid_amount:b5net-5000, balance_amount:0, payment_status:'Paid', generated_by:userMap.Accountant.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b5.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'Cash', amount_paid:b5net-5000, received_by:userMap.Accountant.id, receipt_number:'RCP-000005', is_active:true },{ transaction:t });

    // Insurance claim (Vikram)
    await InsuranceClaim.create({ bill_id:b5.bill_id, patient_id:pVikram.patient_id, insurance_provider:'Star Health Insurance', policy_number:'STAR-VIK-001', member_id:'N/A', claim_amount:b5net, deductible:1000, copay:10, approved_amount:null, paid_amount:0, status:'submitted', claim_date:now, submission_date:now, submitted_by:userMap.Accountant.id, hospital_id:H },{ transaction:t });

    // Two OUTSTANDING bills so "pending / outstanding payments" figures are populated.
    // BILL-000006 — fully Unpaid OPD bill (Lakshmi, v8 episode).
    const b6net = 500 + 450 + 1200 + 4500; // consult + TSH + USG + pharmacy
    await Bill.create({ bill_number:'BILL-000006', episode_id:v8.ep.episode_id, patient_id:pLakshmi.patient_id, hospital_id:H, uhid:pLakshmi.uhid, bill_type:'OPD', bill_date:now, gross_amount:b6net, discount_amount:0, taxable_amount:b6net, tax_amount:0, net_amount:b6net, advance_adjusted:0, paid_amount:0, balance_amount:b6net, payment_status:'Unpaid', generated_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    // BILL-000007 — Partial IPD bill (Mohammed, ipd1 active admission), large balance.
    const b7net = 15000 + 1600 + 600 + 550 + 3500 + 12000; // ICU + rounds + LFT + KFT + CT + angiogram
    const b7 = await Bill.create({ bill_number:'BILL-000007', episode_id:ipd1.ep.episode_id, patient_id:pMohammed.patient_id, hospital_id:H, uhid:pMohammed.uhid, bill_type:'IPD', bill_date:now, gross_amount:b7net, discount_amount:0, taxable_amount:b7net, tax_amount:0, net_amount:b7net, advance_adjusted:5000, paid_amount:8000, balance_amount:b7net-5000-8000, payment_status:'Partial', generated_by:userMap.Accountant.id, is_active:true },{ transaction:t });
    await Payment.create({ bill_id:b7.bill_id, hospital_id:H, payment_date:now, payment_type:'Bill Payment', payment_mode:'Card', amount_paid:8000, received_by:userMap.Accountant.id, receipt_number:'RCP-000007', transaction_reference:'CARD-TXN-7790', is_active:true },{ transaction:t });

    // Refunds
    await Refund.create({ bill_id:b1.bill_id, patient_id:pArjun.patient_id, hospital_id:H, refund_date:now, refund_amount:50,  refund_reason:'Overpaid at counter',         refund_mode:'Cash', approved_by:userMap.Accountant.id, processed_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    await Refund.create({ bill_id:b2.bill_id, patient_id:pMeera.patient_id, hospital_id:H, refund_date:now, refund_amount:200, refund_reason:'Urine routine test cancelled', refund_mode:'UPI',  approved_by:userMap.Accountant.id, processed_by:userMap.Receptionist.id, is_active:true },{ transaction:t });
    console.log(`  ✔ Bills (7: 5 paid + 2 outstanding) + Payments (6) + Advances (3) + Refunds (2) + Insurance Claim (1)`);

    // ── 18. PACKAGES ─────────────────────────────────────────────────
    await Package.bulkCreate([
      { package_name:'Master Health Checkup',      package_type:'Health',     services_included:{ cbc:1, lipid:1, lft:1, kft:1, tsh:1, ecg:1, xray:1, consult:1 }, total_charge:3999,  validity_days:30, hospital_id:H, is_active:true },
      { package_name:'Cardiac Care Package',       package_type:'Cardiology', services_included:{ ecg:1, echo:1, lipid:1, consult:2 },                             total_charge:4500,  validity_days:30, hospital_id:H, is_active:true },
      { package_name:'Maternity Normal Delivery',  package_type:'Maternity',  services_included:{ room:3, delivery:1, consult:3, cbc:1 },                          total_charge:20000, validity_days:30, hospital_id:H, is_active:true },
      { package_name:'Diabetes Management',        package_type:'Health',     services_included:{ hba1c:1, kft:1, lipid:1, consult:2 },                           total_charge:2499,  validity_days:90, hospital_id:H, is_active:true },
    ],{ transaction:t });
    console.log(`  ✔ Packages (4)`);

    // ── 19. AUDIT LOGS ───────────────────────────────────────────────
    await AuditLog.bulkCreate([
      { user_id:userMap.Admin.id,        action_type:'LOGIN',  entity_type:'User',           entity_id:userMap.Admin.id,         request_method:'POST',  request_url:'/api/auth/login',         response_status:200, ip_address:'192.168.1.10', hospital_id:H, details:'Admin login' },
      { user_id:userMap.Receptionist.id, action_type:'CREATE', entity_type:'OpdAppointment', entity_id:a1.appointment_id,        request_method:'POST',  request_url:'/api/opd-appointments',   response_status:201, ip_address:'192.168.1.11', hospital_id:H, details:'Appointment booked for Arjun Verma' },
      { user_id:userMap.Doctor.id,       action_type:'CREATE', entity_type:'OpdConsultation',entity_id:consults[0].consult.consultation_id, request_method:'POST', request_url:'/api/opd-consultations', response_status:201, ip_address:'192.168.1.12', hospital_id:H, details:'Consultation recorded' },
      { user_id:userMap.Pharmacist.id,   action_type:'CREATE', entity_type:'PharmacySale',   entity_id:1,                        request_method:'POST',  request_url:'/api/pharmacy/sales',    response_status:201, ip_address:'192.168.1.13', hospital_id:H, details:'OPD pharmacy dispense' },
      { user_id:userMap.Admin.id,        action_type:'CREATE', entity_type:'IpdAdmission',   entity_id:ipd1.adm.admission_id,    request_method:'POST',  request_url:'/api/ipd-admissions',    response_status:201, ip_address:'192.168.1.10', hospital_id:H, details:'Emergency admission — Mohammed Farooq' },
      { user_id:userMap.Accountant.id,   action_type:'CREATE', entity_type:'Bill',           entity_id:b4.bill_id,               request_method:'POST',  request_url:'/api/bills/generate',    response_status:201, ip_address:'192.168.1.14', hospital_id:H, details:'IPD bill generated for Rohan Kapoor' },
      { user_id:userMap.LabTech.id,      action_type:'CREATE', entity_type:'LabResult',      entity_id:1,                        request_method:'POST',  request_url:'/api/lab-results',       response_status:201, ip_address:'192.168.1.15', hospital_id:H, details:'Lab results entered — CBC + Lipid' },
      { user_id:userMap.Admin.id,        action_type:'DELETE', entity_type:'OpdAppointment', entity_id:999,                      request_method:'DELETE',request_url:'/api/opd-appointments/999',response_status:404, ip_address:'192.168.1.10', hospital_id:H, details:'Attempted delete — not found' },
    ],{ transaction:t });
    console.log(`  ✔ Audit Logs (8)`);

    // ── 20. SECOND HOSPITAL — multi-tenant isolation demo ────────────
    // A separate, self-contained tenant. Its data must NEVER appear when
    // logged in as New Begin Hospital (and vice-versa). Use this to verify
    // cross-hospital data isolation across OPD, pharmacy, billing and IPD.
    console.log('\n🏥  Seeding City Care Hospital (tenant #2)...\n');

    const hosp2 = await Hospital.create({
      hospitalName: 'City Care Hospital',
      licenseNumber: 'LIC-2025-CCH-0002',
      address: '88 MG Road, Bengaluru, Karnataka 560001',
      phone: '+91-80-40506070',
      hospitalEmail: 'info@citycare.hospital',
      hospitalType: 'general',
      gst_number: '29CITYC5678K1Z3',
      pan_number: 'CITYC5678K',
      registration_number: 'REG-KA-2025-0099',
      website: 'https://citycare.hospital',
      numbering_prefixes: { uhid:'CCH', bill:'BILL', grn:'GRN', po:'PO' },
      // Self-Purchase pharmacy: patient buys & pays at the counter; medicines/OT
      // consumables are NOT added to the hospital bill (test the alternate flow here).
      pharmacy_mode: 'self_purchase',
      settings: {}, isActive: true
    }, { transaction: t });
    const H2 = hosp2.id;

    // NOTE: department_code is globally unique in the schema, so tenant #2 uses
    // its own prefixed codes to avoid colliding with tenant #1's GEN/CAR/etc.
    const depts2 = await Department.bulkCreate([
      { department_code:'CCH-GEN', department_name:'General Medicine', department_type:'Clinical', hospital_id:H2, is_active:true },
      { department_code:'CCH-CAR', department_name:'Cardiology',       department_type:'Clinical', hospital_id:H2, is_active:true },
      { department_code:'CCH-PHM', department_name:'Pharmacy',         department_type:'Support',  hospital_id:H2, is_active:true },
      { department_code:'CCH-LAB', department_name:'Laboratory',       department_type:'Support',  hospital_id:H2, is_active:true },
    ], { transaction: t });
    const [d2Gen, d2Car, d2Phm, d2Lab] = depts2;

    const docs2 = await Doctor.bulkCreate([
      { name:'Dr. Vivek Rao',    specialization:'General Medicine', registration_number:'CCH-REG-001', email:'vivek@cch.in', phone:'9100000001', experience:10, department_id:d2Gen.id, hospital_id:H2, is_active:true },
      { name:'Dr. Shalini Gupta',specialization:'Cardiology',       registration_number:'CCH-REG-002', email:'shalini@cch.in',phone:'9100000002', experience:16, department_id:d2Car.id, hospital_id:H2, is_active:true },
    ], { transaction: t });
    const [d2Vivek, d2Shalini] = docs2;

    const sched2 = [];
    for (const doc of docs2)
      for (const day of ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'])
        sched2.push({ doctor_id:doc.id, day_of_week:day, start_time:'09:00:00', end_time:'17:00:00', slot_duration_minutes:15, max_appointments:24, hospital_id:H2, is_active:true });
    await DoctorSchedules.bulkCreate(sched2, { transaction: t });

    // Staff + login users for tenant #2
    const emp2Defs = [
      { code:'CCH-ADM', name:'CityCare Admin',   role:'Admin',        email:'admin@cch.in',        deptId:d2Gen.id, dId:null },
      { code:'CCH-DOC', name:'Dr. Vivek Rao',    role:'Doctor',       email:'dr.vivek@cch.in',     deptId:d2Gen.id, dId:d2Vivek.id },
      { code:'CCH-PHM', name:'Nisha Pharmacist', role:'Pharmacist',   email:'pharmacist@cch.in',   deptId:d2Phm.id, dId:null },
      { code:'CCH-REC', name:'Reception CCH',    role:'Receptionist', email:'receptionist@cch.in', deptId:d2Gen.id, dId:null },
      { code:'CCH-NUR', name:'Latha Nurse',      role:'Nurse',        email:'nurse@cch.in',        deptId:d2Gen.id, dId:null },
    ];
    const u2 = {};
    const e2 = {};
    for (let i=0; i<emp2Defs.length; i++) {
      const def = emp2Defs[i];
      const emp = await Employee.create({
        emp_code:def.code, full_name:def.name, gender:'F', date_of_birth:'1988-04-10',
        mobile:`+9192220${String(i).padStart(5,'0')}`, email:def.email,
        address:'Bengaluru, Karnataka', role:def.role, qualification:'Graduate',
        joining_date:thirtyDaysAgo, department_id:def.deptId, hospital_id:H2, is_active:true
      }, { transaction: t });
      e2[def.role] = emp;
      const user = await User.create({
        name:def.name, email:def.email, password:pwHash, role:def.role,
        employee_id:emp.employee_id, doctor_id:def.dId||null, hospital_id:H2, isActive:true
      }, { transaction: t, hooks:false });
      u2[def.role] = user;
    }

    // Patients for tenant #2 (note: distinct UHIDs, separate hospital)
    const pat2Defs = [
      { fn:'Aravind', ln:'Shetty', g:'M', age:40, dob:'1985-02-10', mob:'9876500001', bg:'O+' },
      { fn:'Divya',   ln:'Menon',  g:'F', age:33, dob:'1992-08-19', mob:'9876500002', bg:'A+' },
      { fn:'Faisal',  ln:'Khan',   g:'M', age:58, dob:'1967-12-01', mob:'9876500003', bg:'B+' },
      { fn:'Nandini', ln:'Hegde',  g:'F', age:27, dob:'1998-05-23', mob:'9876500004', bg:'AB+' },
      { fn:'Karthik', ln:'Iyer',   g:'M', age:45, dob:'1980-03-15', mob:'9876500005', bg:'O+' },
      { fn:'Sunita',  ln:'Pillai', g:'F', age:52, dob:'1973-06-09', mob:'9876500006', bg:'B+' },
    ];
    const pats2 = [];
    for (let i=0; i<pat2Defs.length; i++) {
      const p = pat2Defs[i];
      pats2.push(await Patient.create({
        uhid:`CCH-${String(2001+i).padStart(6,'0')}`, first_name:p.fn, last_name:p.ln,
        gender:p.g, age:p.age, date_of_birth:p.dob, mobile_number:p.mob,
        email:`${p.fn.toLowerCase()}.${p.ln.toLowerCase()}@mail.com`,
        city:'Bengaluru', state:'Karnataka', pincode:'560001', blood_group:p.bg,
        insurance_status:false, hospital_id:H2, isActive:true
      }, { transaction: t }));
    }
    const [p2Aravind, p2Divya, p2Faisal, p2Nandini, p2Karthik, p2Sunita] = pats2;

    // Medicines + batches for tenant #2
    const medCat2 = await MedicineCategory.bulkCreate([
      { category_name:'Analgesics',  hospital_id:H2, is_active:true },
      { category_name:'Antibiotics', hospital_id:H2, is_active:true },
      { category_name:'Cardiac',     hospital_id:H2, is_active:true },
    ], { transaction: t });
    const med2Defs = [
      { code:'CM01', name:'Paracetamol 650mg', cat:medCat2[0], form:'Tablet', mfr:'Cipla', mrp:25, pur:14, sell:22 },
      { code:'CM02', name:'Amoxicillin 500mg', cat:medCat2[1], form:'Capsule',mfr:'Sun',   mrp:130,pur:85, sell:120 },
      { code:'CM03', name:'Atenolol 50mg',     cat:medCat2[2], form:'Tablet', mfr:'USV',   mrp:45, pur:28, sell:40 },
    ];
    const meds2 = await Medicine.bulkCreate(med2Defs.map(m=>({ medicine_code:m.code, medicine_name:m.name, category_id:m.cat.category_id, dosage_form:m.form, manufacturer:m.mfr, hospital_id:H2, isActive:true })), { transaction:t });
    const getMed2 = code => meds2.find(m=>m.medicine_code===code);
    const exp2 = new Date(); exp2.setFullYear(exp2.getFullYear()+2);
    const batches2 = await MedicineBatch.bulkCreate(med2Defs.map((m,i)=>({ medicine_id:getMed2(m.code).medicine_id, hospital_id:H2, batch_number:`CCH-BATCH-${String(i+1).padStart(3,'0')}`, expiry_date:exp2.toISOString().slice(0,10), mrp:m.mrp, purchase_rate:m.pur, selling_rate:m.sell, received_quantity:300, available_quantity:300, received_date:thirtyDaysAgo, is_active:true })), { transaction:t });
    const getBatch2 = code => batches2.find(b=>b.medicine_id===getMed2(code).medicine_id);

    // OPD chain (appointment → visit → episode → vital → consultation → prescriptions)
    const appt2 = await OpdAppointment.create({ patient_id:p2Aravind.patient_id, doctor_id:d2Vivek.id, department_id:d2Gen.id, appointment_date:today, appointment_time:'09:30:00', visit_type:'New', status:'Completed', hospital_id:H2, is_active:true }, { transaction:t });
    const visit2 = await OpdVisit.create({ appointment_id:appt2.appointment_id, patient_id:p2Aravind.patient_id, uhid:p2Aravind.uhid, doctor_id:d2Vivek.id, department_id:d2Gen.id, visit_date:today, token_number:1, visit_type:'New', status:'Completed', checked_in_at:now, hospital_id:H2, is_active:true }, { transaction:t });
    const ep2 = await BillingEpisode.create({ patient_id:p2Aravind.patient_id, hospital_id:H2, uhid:p2Aravind.uhid, episode_type:'OPD', opd_visit_id:visit2.visit_id, start_date:new Date(today), status:'Open', is_active:true }, { transaction:t });
    await OpdVital.create({ visit_id:visit2.visit_id, bp_systolic:126, bp_diastolic:82, pulse_rate:78, temperature:98.6, respiratory_rate:16, spo2:98, weight:74, height:170, bmi:25.6, hospital_id:H2, recorded_at:now, is_active:true }, { transaction:t });
    const cons2 = await OpdConsultation.create({ visit_id:visit2.visit_id, patient_id:p2Aravind.patient_id, doctor_id:d2Vivek.id, chief_complaints:'Fever and cough x 2 days', clinical_notes:'Mild pharyngeal congestion.', examination_findings:'Chest clear.', diagnosis_code:'J06.9', diagnosis_description:'Acute URTI', treatment_plan:'Antipyretics + antibiotics', follow_up_date:inWeek, follow_up_instructions:'Review if fever persists', consultation_date:now, hospital_id:H2, is_active:true }, { transaction:t });
    // One dispensed + one pending prescription
    const rx2a = await OpdPrescription.create({ consultation_id:cons2.consultation_id, visit_id:visit2.visit_id, patient_id:p2Aravind.patient_id, medicine_id:getMed2('CM01').medicine_id, medicine_name:'Paracetamol 650mg', dosage:'1 tab', frequency:'TDS', route:'Oral', duration:'3 days', quantity:9, instructions:'After meals', prescribed_by:d2Vivek.id, prescribed_at:now, hospital_id:H2, dispense_status:'Dispensed', is_active:true }, { transaction:t });
    await OpdPrescription.create({ consultation_id:cons2.consultation_id, visit_id:visit2.visit_id, patient_id:p2Aravind.patient_id, medicine_id:getMed2('CM02').medicine_id, medicine_name:'Amoxicillin 500mg', dosage:'1 cap', frequency:'BD', route:'Oral', duration:'5 days', quantity:10, instructions:'After food', prescribed_by:d2Vivek.id, prescribed_at:now, hospital_id:H2, dispense_status:'Pending', is_active:true }, { transaction:t });
    // Dispense the first prescription (stock out + sale)
    const ccBatch = getBatch2('CM01'), net2 = 9*getMed2('CM01').selling_rate;
    const sale2 = await PharmacySale.create({ patient_id:p2Aravind.patient_id, uhid:p2Aravind.uhid, visit_type:'OPD', visit_id:visit2.visit_id, prescription_id:rx2a.prescription_id, sale_date:now, total_amount:net2, discount_amount:0, tax_amount:0, net_amount:net2, payment_mode:'Cash', dispensed_by:u2.Pharmacist.id, hospital_id:H2, is_active:true }, { transaction:t });
    await PharmacySaleDetail.create({ sale_id:sale2.sale_id, medicine_id:getMed2('CM01').medicine_id, batch_id:ccBatch?.batch_id, medicine_name:'Paracetamol 650mg', quantity:9, rate:getMed2('CM01').selling_rate, amount:net2, gst_percentage:0, hospital_id:H2, is_active:true }, { transaction:t });
    // (Batch stock is left as-seeded, mirroring tenant #1 — decrementing here would
    // fire the MedicineBatch afterUpdate hook on a separate connection and deadlock
    // against this seed transaction.)

    // OPD bill + payment for tenant #2
    await BillCharge.create({ episode_id:ep2.episode_id, hospital_id:H2, charge_date:now, service_type:'Consultation', service_id:null, description:'General OPD Consultation', quantity:1, rate:400, amount:400, discount_percent:0, discount_amount:0, taxable_amount:400, gst_percent:0, gst_amount:0, net_amount:400, payment_status:'Unpaid', paid_amount:0, balance_amount:400, is_active:true }, { transaction:t });
    const bill2 = await Bill.create({ bill_number:'CCH-BILL-000001', episode_id:ep2.episode_id, patient_id:p2Aravind.patient_id, hospital_id:H2, uhid:p2Aravind.uhid, bill_type:'OPD', bill_date:now, gross_amount:400, discount_amount:0, taxable_amount:400, tax_amount:0, net_amount:400, advance_adjusted:0, paid_amount:400, balance_amount:0, payment_status:'Paid', generated_by:u2.Receptionist.id, is_active:true }, { transaction:t });
    await Payment.create({ bill_id:bill2.bill_id, hospital_id:H2, payment_date:now, payment_type:'Bill Payment', payment_mode:'Cash', amount_paid:400, received_by:u2.Receptionist.id, receipt_number:'CCH-RCP-000001', is_active:true }, { transaction:t });

    // One IPD admission for tenant #2 (ward + bed)
    const ward2 = await Ward.create({ ward_name:'General Ward', ward_type:'General', total_beds:6, available_beds:5, floor_number:1, department_id:d2Gen.id, hospital_id:H2, is_active:true }, { transaction:t });
    const beds2 = await Bed.bulkCreate(Array.from({length:6}, (_,i)=>({ ward_id:ward2.ward_id, room_number:`C-${Math.ceil((i+1)/2)}`, bed_number:`C${i+1}`, bed_type:'General', status:'Available', charge_per_day:1500, hospital_id:H2, is_active:true })), { transaction:t });
    const admBed2 = beds2[0];
    const adm2 = await IpdAdmission.create({ patient_id:p2Faisal.patient_id, uhid:p2Faisal.uhid, admitting_doctor_id:d2Shalini.id, department_id:d2Car.id, ward_id:ward2.ward_id, bed_id:admBed2.bed_id, room_number:admBed2.room_number, bed_number:admBed2.bed_number, admission_date:dt(-1,10), admission_reason:'Unstable angina, observation', provisional_diagnosis:'Unstable Angina', admission_type:'Emergency', advance_paid:5000, status:'Admitted', admitted_by:u2.Admin.id, hospital_id:H2, is_active:true }, { transaction:t });
    await admBed2.update({ status:'Occupied' }, { transaction:t });
    await BillingEpisode.create({ patient_id:p2Faisal.patient_id, hospital_id:H2, uhid:p2Faisal.uhid, episode_type:'IPD', admission_id:adm2.admission_id, start_date:dt(-1,10), status:'Open', is_active:true }, { transaction:t });

    // ── Tenant #2 — FULL multi-stage workflow data (OPD + IPD) ───────────
    // OPD stage 1 — BOOKED (scheduled, patient not arrived yet)
    await OpdAppointment.create({ patient_id:p2Divya.patient_id, doctor_id:d2Vivek.id, department_id:d2Gen.id, appointment_date:today, appointment_time:'10:30:00', visit_type:'New', status:'Booked', hospital_id:H2, is_active:true }, { transaction:t });

    // OPD stage 2 — CHECKED-IN (arrived, vitals taken, waiting for the doctor)
    const apptN = await OpdAppointment.create({ patient_id:p2Nandini.patient_id, doctor_id:d2Vivek.id, department_id:d2Gen.id, appointment_date:today, appointment_time:'09:45:00', visit_type:'New', status:'Checked-in', hospital_id:H2, is_active:true }, { transaction:t });
    const visitN = await OpdVisit.create({ appointment_id:apptN.appointment_id, patient_id:p2Nandini.patient_id, uhid:p2Nandini.uhid, doctor_id:d2Vivek.id, department_id:d2Gen.id, visit_date:today, token_number:2, visit_type:'New', status:'Checked-in', checked_in_at:dt(0,9.5), hospital_id:H2, is_active:true }, { transaction:t });
    await BillingEpisode.create({ patient_id:p2Nandini.patient_id, hospital_id:H2, uhid:p2Nandini.uhid, episode_type:'OPD', opd_visit_id:visitN.visit_id, start_date:new Date(today), status:'Open', is_active:true }, { transaction:t });
    await OpdVital.create({ visit_id:visitN.visit_id, bp_systolic:118, bp_diastolic:76, pulse_rate:72, temperature:98.4, respiratory_rate:15, spo2:99, weight:60, height:162, bmi:22.9, hospital_id:H2, recorded_at:now, is_active:true }, { transaction:t });

    // OPD stage 3 — IN-CONSULTATION (doctor seeing the patient now)
    const apptK = await OpdAppointment.create({ patient_id:p2Karthik.patient_id, doctor_id:d2Shalini.id, department_id:d2Car.id, appointment_date:today, appointment_time:'10:00:00', visit_type:'New', status:'Checked-in', hospital_id:H2, is_active:true }, { transaction:t });
    const visitK = await OpdVisit.create({ appointment_id:apptK.appointment_id, patient_id:p2Karthik.patient_id, uhid:p2Karthik.uhid, doctor_id:d2Shalini.id, department_id:d2Car.id, visit_date:today, token_number:3, visit_type:'New', status:'In-consultation', checked_in_at:dt(0,9.75), consultation_start:now, hospital_id:H2, is_active:true }, { transaction:t });
    await BillingEpisode.create({ patient_id:p2Karthik.patient_id, hospital_id:H2, uhid:p2Karthik.uhid, episode_type:'OPD', opd_visit_id:visitK.visit_id, start_date:new Date(today), status:'Open', is_active:true }, { transaction:t });
    await OpdVital.create({ visit_id:visitK.visit_id, bp_systolic:148, bp_diastolic:94, pulse_rate:88, temperature:98.7, respiratory_rate:18, spo2:97, weight:82, height:172, bmi:27.7, hospital_id:H2, recorded_at:now, is_active:true }, { transaction:t });
    await OpdConsultation.create({ visit_id:visitK.visit_id, patient_id:p2Karthik.patient_id, doctor_id:d2Shalini.id, chief_complaints:'Chest tightness on exertion x 1 week', clinical_notes:'Evaluating for stable angina.', examination_findings:'S1S2 normal, no murmurs.', diagnosis_code:'I20.9', diagnosis_description:'Angina pectoris, unspecified', treatment_plan:'ECG + Echo; start anti-anginals', follow_up_date:inWeek, follow_up_instructions:'Return with reports', consultation_date:now, hospital_id:H2, is_active:true }, { transaction:t });

    // IPD — enrich the ACTIVE admission (Faisal): nurse assignment, vitals, meds (+MAR), notes, checklist
    await IpdNurseAssignment.create({ admission_id:adm2.admission_id, patient_id:p2Faisal.patient_id, nurse_id:e2.Nurse.employee_id, ward_id:ward2.ward_id, shift:'Morning', assigned_from:now, is_primary_nurse:true, status:'Active', hospital_id:H2, is_active:true }, { transaction:t });
    for (let ri=0; ri<2; ri++) {
      await IpdVital.create({ admission_id:adm2.admission_id, patient_id:p2Faisal.patient_id, recorded_by:u2.Nurse.id, recorded_date:d(-ri), recorded_time:['08:00:00','20:00:00'][ri], systolic_bp:138-ri*4, diastolic_bp:88-ri*2, pulse_rate:84, temperature:98.6, respiratory_rate:18, spo2:97, blood_sugar:128, consciousness_level:'Alert', pain_scale:3, intake_ml:500, output_ml:400, notes:'Stable, on cardiac monitor' }, { transaction:t });
    }
    const ipdMed2 = await IpdMedication.create({ admission_id:adm2.admission_id, prescribed_by:u2.Doctor.id, medicine_id:getMed2('CM03').medicine_id, medicine_name:'Atenolol 50mg', dosage:'1 tab', frequency:'OD', route:'Oral', duration_days:5, start_date:now, instructions:'Monitor HR/BP', status:'Active' }, { transaction:t });
    await IpdMedicationAdministration.create({ medication_id:ipdMed2.medication_id, admission_id:adm2.admission_id, administered_by:u2.Nurse.id, scheduled_time:now, administered_time:now, dosage_given:'1 tab', status:'Administered', notes:'No adverse reaction' }, { transaction:t });
    await IpdProgressNote.bulkCreate([
      { admission_id:adm2.admission_id, patient_id:p2Faisal.patient_id, progress_date:today, progress_time:'09:00:00', note_type:'Doctor', doctor_notes:'Chest pain free overnight. Continue anti-anginals. Plan stress test.', recorded_by:u2.Doctor.id, recorded_at:now, hospital_id:H2, is_active:true },
      { admission_id:adm2.admission_id, patient_id:p2Faisal.patient_id, progress_date:today, progress_time:'14:00:00', note_type:'Nurse', nursing_notes:'Comfortable, ambulating in room. IV intact.', recorded_by:u2.Nurse.id, recorded_at:dt(0,14), hospital_id:H2, is_active:true },
    ], { transaction:t });
    await NursingChecklist.create({ admission_id:adm2.admission_id, hospital_id:H2, nurse_id:u2.Nurse.id, shift:'Morning', check_date:today, items:{ bedside_safety:true, iv_line_check:true, catheter_care:false, wound_dressing:false, pain_assessment:true, nutrition_intake:true, medication_given:true, vital_signs_recorded:true }, notes:'Cardiac monitoring ongoing.', is_active:true }, { transaction:t });
    // IPD self-purchase dispense (patient pays at the counter — NO hospital bill charge)
    const ipdNet2 = 5*getMed2('CM03').selling_rate;
    const ipdSale2 = await PharmacySale.create({ patient_id:p2Faisal.patient_id, uhid:p2Faisal.uhid, visit_type:'IPD', visit_id:adm2.admission_id, sale_date:now, total_amount:ipdNet2, net_amount:ipdNet2, payment_mode:'Cash', dispensed_by:u2.Pharmacist.id, hospital_id:H2, is_active:true }, { transaction:t });
    await PharmacySaleDetail.create({ sale_id:ipdSale2.sale_id, medicine_id:getMed2('CM03').medicine_id, batch_id:getBatch2('CM03')?.batch_id, medicine_name:'Atenolol 50mg', quantity:5, rate:getMed2('CM03').selling_rate, amount:ipdNet2, gst_percentage:0, hospital_id:H2, is_active:true }, { transaction:t });

    // IPD stage — DISCHARGED (admission closed, summary written, episode closed, bill paid)
    const dischBed2 = beds2[1];
    const adm2b = await IpdAdmission.create({ patient_id:p2Sunita.patient_id, uhid:p2Sunita.uhid, admitting_doctor_id:d2Vivek.id, department_id:d2Gen.id, ward_id:ward2.ward_id, bed_id:dischBed2.bed_id, room_number:dischBed2.room_number, bed_number:dischBed2.bed_number, admission_date:dt(-3,9), discharge_date:dt(-1,11), admission_reason:'Acute gastroenteritis with dehydration', provisional_diagnosis:'Acute Gastroenteritis', admission_type:'Emergency', advance_paid:3000, status:'Discharged', admitted_by:u2.Admin.id, hospital_id:H2, is_active:true }, { transaction:t });
    const ep2b = await BillingEpisode.create({ patient_id:p2Sunita.patient_id, hospital_id:H2, uhid:p2Sunita.uhid, episode_type:'IPD', admission_id:adm2b.admission_id, start_date:dt(-3,9), status:'Closed', is_active:true }, { transaction:t });
    await IpdProgressNote.create({ admission_id:adm2b.admission_id, patient_id:p2Sunita.patient_id, progress_date:d(-2), progress_time:'10:00:00', note_type:'Doctor', doctor_notes:'Rehydrated, tolerating orals. Fit for discharge tomorrow.', recorded_by:u2.Doctor.id, recorded_at:dt(-2,10), hospital_id:H2, is_active:true }, { transaction:t });
    await IpdDischargeSummary.create({ admission_id:adm2b.admission_id, patient_id:p2Sunita.patient_id, discharge_date:dt(-1,11), discharge_type:'Normal', final_diagnosis:'Acute Gastroenteritis with mild dehydration', procedures_performed:'IV fluid resuscitation', clinical_summary:'Admitted with vomiting and loose stools. Rehydrated with IV fluids; symptoms resolved.', discharge_medications:'ORS sachets; Ofloxacin+Ornidazole BD x 3d; Probiotics OD x 5d', follow_up_instructions:'GP review if symptoms recur', follow_up_date:inWeek, diet_advice:'Bland diet, plenty of fluids', activity_restrictions:'Rest for 2 days', discharged_by:d2Vivek.id, discharge_summary_by:u2.Doctor.id, hospital_id:H2, is_active:true }, { transaction:t });
    await BillCharge.create({ episode_id:ep2b.episode_id, hospital_id:H2, charge_date:dt(-1,11), service_type:'Room', service_id:null, description:'General Ward (2 days)', quantity:2, rate:1500, amount:3000, discount_percent:0, discount_amount:0, taxable_amount:3000, gst_percent:0, gst_amount:0, net_amount:3000, payment_status:'Paid', paid_amount:3000, balance_amount:0, is_active:true }, { transaction:t });
    const bill2b = await Bill.create({ bill_number:'CCH-BILL-000002', episode_id:ep2b.episode_id, patient_id:p2Sunita.patient_id, hospital_id:H2, uhid:p2Sunita.uhid, bill_type:'IPD', bill_date:dt(-1,11), gross_amount:3000, discount_amount:0, taxable_amount:3000, tax_amount:0, net_amount:3000, advance_adjusted:3000, paid_amount:3000, balance_amount:0, payment_status:'Paid', generated_by:u2.Receptionist.id, is_active:true }, { transaction:t });
    await Payment.create({ bill_id:bill2b.bill_id, hospital_id:H2, payment_date:dt(-1,11), payment_type:'Bill Payment', payment_mode:'Cash', amount_paid:3000, received_by:u2.Receptionist.id, receipt_number:'CCH-RCP-000002', is_active:true }, { transaction:t });

    console.log(`  ✔ City Care Hospital #${H2} — full OPD stages (booked · checked-in · in-consult · completed) + IPD (active w/ vitals·meds·notes·checklist + discharged) + self-purchase dispense`);

    await t.commit();

    console.log('\n✅  Seed complete.\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS — password for ALL: password123');
    console.log('───────────────────────────────────────────────────────');
    console.log('  New Begin Hospital (tenant #1):');
    for (const [role,email] of [
      ['Admin',        'admin@nbh.in'],
      ['Doctor',       'dr.anita@nbh.in'],
      ['Nurse',        'nurse1@nbh.in'],
      ['Pharmacist',   'pharmacist@nbh.in'],
      ['LabTech',      'labtech@nbh.in'],
      ['Radiologist',  'radiologist@nbh.in'],
      ['Receptionist', 'receptionist@nbh.in'],
      ['Accountant',   'accountant@nbh.in'],
      ['HR',           'hr@nbh.in'],
      ['Employee',     'employee@nbh.in'],
    ]) console.log(`  ${role.padEnd(14)} → ${email}`);
    console.log('───────────────────────────────────────────────────────');
    console.log('  City Care Hospital (tenant #2 — for isolation testing):');
    for (const [role,email] of [
      ['Admin',        'admin@cch.in'],
      ['Doctor',       'dr.vivek@cch.in'],
      ['Pharmacist',   'pharmacist@cch.in'],
      ['Receptionist', 'receptionist@cch.in'],
      ['Nurse',        'nurse@cch.in'],
    ]) console.log(`  ${role.padEnd(14)} → ${email}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    await t.rollback();
    console.error('\n✗ Seed FAILED:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    await sequelize.close();
  }
}

main().catch(() => process.exit(1));
