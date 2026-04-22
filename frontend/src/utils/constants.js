// User Roles
export const ROLES = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  PHARMACIST: 'Pharmacist',
  LAB_TECH: 'LabTech',
  RADIOLOGIST: 'Radiologist',
  RECEPTIONIST: 'Receptionist',
  ACCOUNTANT: 'Accountant',
  HR: 'HR',
  EMPLOYEE: 'Employee'
};

export const ALL_ROLES = Object.values(ROLES);

// Appointment Status
export const APPOINTMENT_STATUS = {
  BOOKED: 'Booked',
  CHECKED_IN: 'Checked-in',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No-show'
};

// Admission Status
export const ADMISSION_STATUS = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
  TRANSFERRED: 'Transferred',
  CANCELLED: 'Cancelled'
};

// Payment Status
export const PAYMENT_STATUS = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid'
};

// Payment Modes
export const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Insurance', 'Cheque'];

// Gender Options
export const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
  { label: 'Other', value: 'O' }
];

// Blood Groups
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Marital Status Options
export const MARITAL_STATUS_OPTIONS = [
  { label: 'Single', value: 'Single' },
  { label: 'Married', value: 'Married' },
  { label: 'Divorced', value: 'Divorced' },
  { label: 'Widowed', value: 'Widowed' },
  { label: 'Separated', value: 'Separated' }
];

// Visit Types
export const VISIT_TYPES = ['New', 'Follow-up'];

// Table Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'DD MMM YYYY';
export const DISPLAY_DATETIME_FORMAT = 'DD MMM YYYY hh:mm A';

// Dosage Forms
export const DOSAGE_FORMS = [
  { label: 'Tablet', value: 'Tablet' },
  { label: 'Capsule', value: 'Capsule' },
  { label: 'Syrup', value: 'Syrup' },
  { label: 'Injection', value: 'Injection' },
  { label: 'Drops', value: 'Drops' },
  { label: 'Ointment', value: 'Ointment' },
  { label: 'Cream', value: 'Cream' }
];
 
// Drug Schedules
export const DRUG_SCHEDULES = [
  { label: 'H - Habit Forming', value: 'H' },
  { label: 'H1 - Habit Forming (Stricter)', value: 'H1' },
  { label: 'X - Narcotic', value: 'X' },
  { label: 'G - General', value: 'G' }
];
 export const PACKAGE_TYPES = [
  { label: 'Health Checkup', value: 'Health Checkup' },
  { label: 'Diagnostic Package', value: 'Diagnostic Package' },
  { label: 'Treatment Package', value: 'Treatment Package' },
  { label: 'Surgery Package', value: 'Surgery Package' },
  { label: 'Wellness Package', value: 'Wellness Package' },
  { label: 'Emergency Package', value: 'Emergency Package' }
];
 
// Available Services for Packages
export const AVAILABLE_SERVICES = [
  { label: 'CBC (Complete Blood Count)', value: 'CBC', price: 300 },
  { label: 'Lipid Profile', value: 'Lipid Profile', price: 800 },
  { label: 'ECG', value: 'ECG', price: 500 },
  { label: 'Doctor Consultation', value: 'Consultation', price: 500 },
  { label: 'HbA1c Test', value: 'HbA1c', price: 600 },
  { label: 'Fasting Blood Sugar', value: 'FBS', price: 200 },
  { label: 'Post Meal Blood Sugar', value: 'PPBS', price: 200 },
  { label: 'Chest X-Ray', value: 'Chest X-Ray', price: 800 },
  { label: 'USG Abdomen', value: 'USG Abdomen', price: 1200 },
  { label: 'Thyroid Function Test', value: 'TFT', price: 700 },
  { label: 'Liver Function Test', value: 'LFT', price: 600 },
  { label: 'Kidney Function Test', value: 'KFT', price: 500 },
  { label: 'Urine Analysis', value: 'Urine Analysis', price: 150 },
  { label: 'Blood Pressure Check', value: 'BP Check', price: 100 },
  { label: 'BMI Assessment', value: 'BMI Assessment', price: 100 }
];