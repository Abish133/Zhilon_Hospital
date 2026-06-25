// Centralized RBAC matrix for Indian hospital workflow.
// Admin always has full access (handled by authorize() in rbac.js).
// Roles are matched case-insensitively via normalizeRole().

const { authorize } = require('./rbac');

// Common role groups
const CLINICAL = ['Doctor', 'Nurse'];
const FRONT_DESK = ['Receptionist'];
const FINANCE = ['Accountant'];
const HR = ['HR'];
const PHARMACY = ['Pharmacist'];
const LAB = ['LabTech'];
const RADIOLOGY = ['Radiologist'];

// Read access — broad: most clinical/desk staff need to view records.
const READ_ALL_STAFF = [
  'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Radiologist',
  'Receptionist', 'Accountant', 'HR', 'Employee'
];

const READ_CLINICAL = [
  'Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'LabTech', 'Radiologist'
];

const READ_FINANCIAL = ['Accountant', 'Receptionist', 'Doctor', 'HR'];

// Module gates — each exports { read, write } middleware
const gates = {
  // Patient registration & demographics
  patients:        { read: authorize(READ_ALL_STAFF), write: authorize([...FRONT_DESK, ...CLINICAL, 'Accountant']) },
  patientDocs:     { read: authorize(READ_CLINICAL), write: authorize([...FRONT_DESK, ...CLINICAL]) },
  patientHistory:  { read: authorize(READ_CLINICAL), write: authorize(CLINICAL) },

  // OPD
  opdAppointment:  { read: authorize(READ_CLINICAL), write: authorize([...FRONT_DESK, ...CLINICAL]) },
  opdVisit:        { read: authorize(READ_CLINICAL), write: authorize([...FRONT_DESK, ...CLINICAL]) },
  opdConsultation: { read: authorize(READ_CLINICAL), write: authorize(['Doctor']) },
  opdPrescription: { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize(['Doctor']) },
  opdVital:        { read: authorize(READ_CLINICAL), write: authorize(['Doctor', 'Nurse']) },

  // IPD
  ipdAdmission:    { read: authorize(READ_CLINICAL), write: authorize([...FRONT_DESK, ...CLINICAL]) },
  ipdProgress:     { read: authorize(READ_CLINICAL), write: authorize(CLINICAL) },
  ipdDischarge:    { read: authorize(READ_CLINICAL), write: authorize(['Doctor']) },
  ipdNurseAssign:  { read: authorize(READ_CLINICAL), write: authorize(['Nurse', 'HR']) },
  ipdVitals:       { read: authorize(READ_CLINICAL), write: authorize(CLINICAL) },
  ipdMedication:   { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize([...CLINICAL, ...PHARMACY]) },
  nursingChecklist:{ read: authorize(READ_CLINICAL), write: authorize(['Nurse']) },

  // Wards & beds
  ward:            { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Receptionist']) },
  bed:             { read: authorize(READ_ALL_STAFF), write: authorize(['Receptionist', 'Nurse']) },

  // OT
  otBooking:       { read: authorize(READ_CLINICAL), write: authorize(['Doctor', 'Nurse', 'Receptionist']) },
  otRoom:          { read: authorize(READ_CLINICAL), write: authorize(['HR']) },
  otClinical:      { read: authorize(READ_CLINICAL), write: authorize(['Doctor', 'Nurse']) },
  otConsumables:   { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize(['Nurse', 'Pharmacist']) },

  // Pharmacy
  pharmacy:        { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize(PHARMACY) },
  medicine:        { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize([...PHARMACY, 'HR']) },
  medicineBatch:   { read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize(PHARMACY) },
  medicineCategory:{ read: authorize([...READ_CLINICAL, ...PHARMACY]), write: authorize([...PHARMACY, 'HR']) },

  // Inventory & procurement
  inventory:       { read: authorize([...PHARMACY, 'HR', 'Nurse']), write: authorize([...PHARMACY, 'HR']) },
  vendor:          { read: authorize([...PHARMACY, 'HR', 'Accountant']), write: authorize(['HR', 'Accountant']) },
  purchaseOrder:   { read: authorize([...PHARMACY, 'HR', 'Accountant']), write: authorize(['Pharmacist', 'HR', 'Accountant']) },
  grn:             { read: authorize([...PHARMACY, 'HR', 'Accountant']), write: authorize([...PHARMACY, 'HR']) },
  stock:           { read: authorize([...PHARMACY, 'HR', 'Nurse']), write: authorize([...PHARMACY, 'Nurse', 'HR']) },
  vendorReturn:    { read: authorize([...PHARMACY, 'HR', 'Accountant']), write: authorize([...PHARMACY, 'HR', 'Accountant']) },

  // Lab
  lab:             { read: authorize([...READ_CLINICAL, ...LAB]), write: authorize([...LAB, 'Doctor']) },
  labResult:       { read: authorize([...READ_CLINICAL, ...LAB]), write: authorize(LAB) },

  // Radiology
  radiology:       { read: authorize([...READ_CLINICAL, ...RADIOLOGY]), write: authorize([...RADIOLOGY, 'Doctor']) },
  radiologyReport: { read: authorize([...READ_CLINICAL, ...RADIOLOGY]), write: authorize(RADIOLOGY) },

  // Billing & finance
  billing:         { read: authorize(READ_FINANCIAL), write: authorize([...FINANCE, ...FRONT_DESK]) },
  payment:         { read: authorize(READ_FINANCIAL), write: authorize([...FINANCE, ...FRONT_DESK]) },
  refund:          { read: authorize(READ_FINANCIAL), write: authorize(FINANCE) },
  chargeMaster:    { read: authorize(READ_FINANCIAL), write: authorize(['HR', 'Accountant']) },
  packageMaster:   { read: authorize(READ_FINANCIAL), write: authorize(['HR', 'Accountant']) },
  insurance:       { read: authorize([...READ_FINANCIAL, 'Receptionist']), write: authorize([...FINANCE, ...FRONT_DESK]) },

  // Equipment / biomedical
  equipment:       { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  maintenance:     { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Nurse']) },
  calibration:     { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },

  // HR / staff master data
  employee:        { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  doctor:          { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  doctorSchedule:  { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Doctor']) },
  doctorLeave:     { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Doctor']) },
  doctorQualification: { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  department:      { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  shift:           { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  roster:          { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  attendance:      { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Employee']) },
  leaveRequest:    { read: authorize(READ_ALL_STAFF), write: authorize(['HR', 'Employee', 'Doctor', 'Nurse']) },

  // Sensitive financial / restricted
  payroll:         { read: authorize(['HR', 'Accountant']), write: authorize(['HR']) },
  salaryStructure: { read: authorize(['HR', 'Accountant']), write: authorize(['HR']) },
  leaveBalance:    { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) },
  expense:         { read: authorize(['HR', 'Accountant']), write: authorize(['HR', 'Accountant']) },

  // Reports
  reports:         { read: authorize(READ_FINANCIAL), write: authorize(['HR', 'Accountant']) },
  reportsAdvanced: { read: authorize(['HR', 'Accountant', 'Doctor']), write: authorize(['HR', 'Accountant']) },

  // Hospital master & admin-only
  hospital:        { read: authorize(READ_ALL_STAFF), write: authorize([]) }, // Admin-only writes
  auditLog:        { read: authorize([]), write: authorize([]) },              // Admin-only
  adminJobs:       { read: authorize([]), write: authorize([]) },              // Admin-only

  // Notifications & alerts — read by all, write by system/admin
  notification:    { read: authorize(READ_ALL_STAFF), write: authorize(READ_ALL_STAFF) },
  alert:           { read: authorize(READ_ALL_STAFF), write: authorize(['HR']) }
};

// Helper that branches by HTTP method:
//   read gate for GET, write gate for POST/PUT/PATCH/DELETE.
const gateFor = (moduleName) => {
  const g = gates[moduleName];
  if (!g) {
    throw new Error(`roleMatrix: unknown module '${moduleName}'`);
  }
  return (req, res, next) => {
    const mw = req.method === 'GET' ? g.read : g.write;
    return mw(req, res, next);
  };
};

module.exports = { gates, gateFor };
