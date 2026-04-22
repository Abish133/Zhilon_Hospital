// Centralized dummy data for HMS
export const dummyData = {
  // Users & Authentication
  users: [
    { user_id: 1, username: 'admin', email: 'admin@hospital.com', role: 'Admin', employee_id: 1, is_active: true },
    { user_id: 2, username: 'dr.sharma', email: 'sharma@hospital.com', role: 'Doctor', employee_id: 2, is_active: true },
    { user_id: 3, username: 'nurse.priya', email: 'priya@hospital.com', role: 'Nurse', employee_id: 3, is_active: true },
    { user_id: 4, username: 'pharmacist', email: 'pharma@hospital.com', role: 'Pharmacist', employee_id: 4, is_active: true },
    { user_id: 5, username: 'receptionist', email: 'reception@hospital.com', role: 'Receptionist', employee_id: 5, is_active: true }
  ],

  // Patients
  patients: [
    { patient_id: 1, uhid: 'UHID-2025-00001', first_name: 'Amit', last_name: 'Kumar', gender: 'M', date_of_birth: '1985-07-20', blood_group: 'O+', mobile_number: '9876543210', email: 'amit@email.com', address_line1: '45 Gandhi Nagar', city: 'Delhi', status: 'Active', created_at: '2025-01-15' },
    { patient_id: 2, uhid: 'UHID-2025-00002', first_name: 'Priya', last_name: 'Sharma', gender: 'F', date_of_birth: '1990-03-15', blood_group: 'A+', mobile_number: '9876543211', email: 'priya@email.com', address_line1: '12 MG Road', city: 'Mumbai', status: 'Active', created_at: '2025-01-16' },
    { patient_id: 3, uhid: 'UHID-2025-00003', first_name: 'Rajesh', last_name: 'Verma', gender: 'M', date_of_birth: '1978-11-22', blood_group: 'B+', mobile_number: '9876543212', email: 'rajesh@email.com', address_line1: '78 Park Street', city: 'Kolkata', status: 'Active', created_at: '2025-01-17' },
    { patient_id: 4, uhid: 'UHID-2025-00004', first_name: 'Sunita', last_name: 'Patel', gender: 'F', date_of_birth: '1995-05-10', blood_group: 'AB+', mobile_number: '9876543213', email: 'sunita@email.com', address_line1: '34 Ring Road', city: 'Ahmedabad', status: 'Active', created_at: '2025-01-18' },
    { patient_id: 5, uhid: 'UHID-2025-00005', first_name: 'Vikram', last_name: 'Singh', gender: 'M', date_of_birth: '1982-09-30', blood_group: 'O-', mobile_number: '9876543214', email: 'vikram@email.com', address_line1: '56 Mall Road', city: 'Bangalore', status: 'Active', created_at: '2025-01-19' }
  ],

  // Employees
  employees: [
    { employee_id: 1, emp_code: 'EMP001', full_name: 'Admin User', gender: 'M', mobile: '9999999999', email: 'admin@hospital.com', role: 'Admin', department_id: 1, status: 'Active', joining_date: '2020-01-01' },
    { employee_id: 2, emp_code: 'DOC001', full_name: 'Dr. Rajesh Sharma', gender: 'M', mobile: '9999999998', email: 'sharma@hospital.com', role: 'Doctor', department_id: 2, specialization: 'Cardiology', status: 'Active', joining_date: '2021-03-15' },
    { employee_id: 3, emp_code: 'NUR001', full_name: 'Priya Nurse', gender: 'F', mobile: '9999999997', email: 'priya@hospital.com', role: 'Nurse', department_id: 3, status: 'Active', joining_date: '2022-06-10' },
    { employee_id: 4, emp_code: 'PHA001', full_name: 'Suresh Pharmacist', gender: 'M', mobile: '9999999996', email: 'pharma@hospital.com', role: 'Pharmacist', department_id: 4, status: 'Active', joining_date: '2021-08-20' },
    { employee_id: 5, emp_code: 'REC001', full_name: 'Anjali Receptionist', gender: 'F', mobile: '9999999995', email: 'reception@hospital.com', role: 'Receptionist', department_id: 5, status: 'Active', joining_date: '2023-01-05' }
  ],

  // Doctors
  doctors: [
    { doctor_id: 2, full_name: 'Dr. Rajesh Sharma', specialization: 'Cardiology', registration_number: 'MCI12345', experience_years: 15 },
    { doctor_id: 6, full_name: 'Dr. Meera Reddy', specialization: 'Pediatrics', registration_number: 'MCI12346', experience_years: 10 },
    { doctor_id: 7, full_name: 'Dr. Anil Kumar', specialization: 'Orthopedics', registration_number: 'MCI12347', experience_years: 12 },
    { doctor_id: 8, full_name: 'Dr. Kavita Singh', specialization: 'Gynecology', registration_number: 'MCI12348', experience_years: 8 }
  ],

  // OPD Appointments
  opdAppointments: [
    { appointment_id: 1, patient_id: 1, uhid: 'UHID-2025-00001', patient_name: 'Amit Kumar', doctor_id: 2, doctor_name: 'Dr. Rajesh Sharma', appointment_date: '2025-01-20', appointment_time: '10:00', token_number: 1, status: 'Booked', visit_type: 'New' },
    { appointment_id: 2, patient_id: 2, uhid: 'UHID-2025-00002', patient_name: 'Priya Sharma', doctor_id: 2, doctor_name: 'Dr. Rajesh Sharma', appointment_date: '2025-01-20', appointment_time: '10:15', token_number: 2, status: 'Checked-in', visit_type: 'Follow-up' },
    { appointment_id: 3, patient_id: 3, uhid: 'UHID-2025-00003', patient_name: 'Rajesh Verma', doctor_id: 6, doctor_name: 'Dr. Meera Reddy', appointment_date: '2025-01-20', appointment_time: '11:00', token_number: 3, status: 'Completed', visit_type: 'New' },
    { appointment_id: 4, patient_id: 4, uhid: 'UHID-2025-00004', patient_name: 'Sunita Patel', doctor_id: 7, doctor_name: 'Dr. Anil Kumar', appointment_date: '2025-01-20', appointment_time: '14:00', token_number: 4, status: 'Booked', visit_type: 'New' },
    { appointment_id: 5, patient_id: 5, uhid: 'UHID-2025-00005', patient_name: 'Vikram Singh', doctor_id: 8, doctor_name: 'Dr. Kavita Singh', appointment_date: '2025-01-20', appointment_time: '15:30', token_number: 5, status: 'Cancelled', visit_type: 'Follow-up' }
  ],

  // IPD Admissions
  ipdAdmissions: [
    { admission_id: 1, patient_id: 1, uhid: 'UHID-2025-00001', patient_name: 'Amit Kumar', admitting_doctor_id: 2, doctor_name: 'Dr. Rajesh Sharma', ward_id: 1, ward_name: 'General Ward', room_no: '101', bed_no: 'B1', admission_date: '2025-01-18', admission_reason: 'Chest pain', status: 'Admitted' },
    { admission_id: 2, patient_id: 3, uhid: 'UHID-2025-00003', patient_name: 'Rajesh Verma', admitting_doctor_id: 7, doctor_name: 'Dr. Anil Kumar', ward_id: 2, ward_name: 'ICU', room_no: '201', bed_no: 'B2', admission_date: '2025-01-19', admission_reason: 'Fracture', status: 'Admitted' }
  ],

  // Pharmacy - Medicines
  medicines: [
    { medicine_id: 1, medicine_name: 'Paracetamol 500mg', category: 'Analgesics', strength: '500mg', dosage_form: 'Tablet', manufacturer: 'ABC Pharma', available_quantity: 5000, selling_rate: 2.50 },
    { medicine_id: 2, medicine_name: 'Amoxicillin 250mg', category: 'Antibiotics', strength: '250mg', dosage_form: 'Capsule', manufacturer: 'XYZ Pharma', available_quantity: 3000, selling_rate: 8.00 },
    { medicine_id: 3, medicine_name: 'Aspirin 75mg', category: 'Antiplatelet', strength: '75mg', dosage_form: 'Tablet', manufacturer: 'DEF Pharma', available_quantity: 2000, selling_rate: 3.50 },
    { medicine_id: 4, medicine_name: 'Omeprazole 20mg', category: 'Antacids', strength: '20mg', dosage_form: 'Capsule', manufacturer: 'GHI Pharma', available_quantity: 1500, selling_rate: 5.00 },
    { medicine_id: 5, medicine_name: 'Metformin 500mg', category: 'Antidiabetic', strength: '500mg', dosage_form: 'Tablet', manufacturer: 'JKL Pharma', available_quantity: 4000, selling_rate: 4.00 }
  ],

  // Lab Tests
  labTests: [
    { test_id: 1, test_code: 'CBC', test_name: 'Complete Blood Count', sample_type: 'Blood', department: 'Pathology', charge: 300 },
    { test_id: 2, test_code: 'LFT', test_name: 'Liver Function Test', sample_type: 'Blood', department: 'Biochemistry', charge: 500 },
    { test_id: 3, test_code: 'KFT', test_name: 'Kidney Function Test', sample_type: 'Blood', department: 'Biochemistry', charge: 450 },
    { test_id: 4, test_code: 'HBA1C', test_name: 'HbA1c', sample_type: 'Blood', department: 'Biochemistry', charge: 400 },
    { test_id: 5, test_code: 'URINE', test_name: 'Urine Routine', sample_type: 'Urine', department: 'Pathology', charge: 150 },
    { test_id: 6, test_code: 'LIPID', test_name: 'Lipid Profile', sample_type: 'Blood', department: 'Biochemistry', charge: 600 },
    { test_id: 7, test_code: 'TSH', test_name: 'Thyroid Stimulating Hormone', sample_type: 'Blood', department: 'Biochemistry', charge: 350 },
    { test_id: 8, test_code: 'ESR', test_name: 'Erythrocyte Sedimentation Rate', sample_type: 'Blood', department: 'Pathology', charge: 100 }
  ],

  // Lab Test Parameters
  labTestParameters: {
    1: [
      { param: 'Hemoglobin', unit: 'g/dL', normalRange: '12-16', value: '' },
      { param: 'WBC Count', unit: 'cells/cumm', normalRange: '4000-11000', value: '' },
      { param: 'RBC Count', unit: 'million/cumm', normalRange: '4.5-5.5', value: '' },
      { param: 'Platelet Count', unit: 'lakhs/cumm', normalRange: '1.5-4.5', value: '' }
    ],
    2: [
      { param: 'Bilirubin Total', unit: 'mg/dL', normalRange: '0.3-1.2', value: '' },
      { param: 'SGOT', unit: 'U/L', normalRange: '5-40', value: '' },
      { param: 'SGPT', unit: 'U/L', normalRange: '5-40', value: '' },
      { param: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '40-150', value: '' }
    ],
    3: [
      { param: 'Urea', unit: 'mg/dL', normalRange: '15-40', value: '' },
      { param: 'Creatinine', unit: 'mg/dL', normalRange: '0.6-1.2', value: '' },
      { param: 'Uric Acid', unit: 'mg/dL', normalRange: '3.5-7.2', value: '' }
    ]
  },

  // Lab Orders
  labOrders: [
    { order_id: 1, patient_id: 1, uhid: 'UHID-2025-00001', patient_name: 'Amit Kumar', test_name: 'Complete Blood Count', order_date: '2025-01-20', status: 'Pending', doctor_name: 'Dr. Rajesh Sharma' },
    { order_id: 2, patient_id: 2, uhid: 'UHID-2025-00002', patient_name: 'Priya Sharma', test_name: 'Liver Function Test', order_date: '2025-01-20', status: 'Completed', doctor_name: 'Dr. Rajesh Sharma' },
    { order_id: 3, patient_id: 3, uhid: 'UHID-2025-00003', patient_name: 'Rajesh Verma', test_name: 'HbA1c', order_date: '2025-01-19', status: 'In Progress', doctor_name: 'Dr. Meera Reddy' }
  ],

  // Radiology Tests
  radiologyTests: [
    { rad_test_id: 1, test_name: 'Chest X-Ray', modality: 'X-Ray', charge: 500 },
    { rad_test_id: 2, test_name: 'CT Scan Brain', modality: 'CT', charge: 3500 },
    { rad_test_id: 3, test_name: 'MRI Spine', modality: 'MRI', charge: 6000 },
    { rad_test_id: 4, test_name: 'Ultrasound Abdomen', modality: 'USG', charge: 800 }
  ],

  // OT Bookings
  otBookings: [
    { booking_id: 1, uhid: 'UHID-2025-00001', patient_name: 'Amit Kumar', surgery_name: 'Appendectomy', surgeon_name: 'Dr. Rajesh Sharma', anesthetist_name: 'Dr. Anil Kumar', surgery_date: '2025-01-22', ot_room: 'OT-1', status: 'Scheduled' },
    { booking_id: 2, uhid: 'UHID-2025-00002', patient_name: 'Priya Sharma', surgery_name: 'Hernia Repair', surgeon_name: 'Dr. Anil Kumar', anesthetist_name: 'Dr. Rajesh Sharma', surgery_date: '2025-01-23', ot_room: 'OT-2', status: 'Completed' },
    { booking_id: 3, uhid: 'UHID-2025-00003', patient_name: 'Rajesh Verma', surgery_name: 'Cholecystectomy', surgeon_name: 'Dr. Rajesh Sharma', anesthetist_name: 'Dr. Anil Kumar', surgery_date: '2025-01-24', ot_room: 'OT-1', status: 'In Progress' }
  ],

  // Bills
  bills: [
    { bill_id: 1, patient_id: 1, uhid: 'UHID-2025-00001', patient_name: 'Amit Kumar', visit_type: 'OP', gross_amount: 1500, discount_amount: 0, tax_amount: 270, net_amount: 1770, bill_date: '2025-01-20', payment_status: 'Paid' },
    { bill_id: 2, patient_id: 2, uhid: 'UHID-2025-00002', patient_name: 'Priya Sharma', visit_type: 'OP', gross_amount: 2000, discount_amount: 200, tax_amount: 324, net_amount: 2124, bill_date: '2025-01-20', payment_status: 'Pending' },
    { bill_id: 3, patient_id: 3, uhid: 'UHID-2025-00003', patient_name: 'Rajesh Verma', visit_type: 'IP', gross_amount: 25000, discount_amount: 2500, tax_amount: 4050, net_amount: 26550, bill_date: '2025-01-19', payment_status: 'Partial' }
  ],

  // Departments
  departments: [
    { department_id: 1, name: 'Administration', description: 'Admin Department' },
    { department_id: 2, name: 'Cardiology', description: 'Heart Care' },
    { department_id: 3, name: 'Nursing', description: 'Nursing Staff' },
    { department_id: 4, name: 'Pharmacy', description: 'Medicine Dispensing' },
    { department_id: 5, name: 'Reception', description: 'Front Desk' },
    { department_id: 6, name: 'Pediatrics', description: 'Child Care' },
    { department_id: 7, name: 'Orthopedics', description: 'Bone & Joint Care' },
    { department_id: 8, name: 'Gynecology', description: 'Women Health' }
  ],

  // Dashboard Stats
  dashboardStats: {
    totalPatients: 1234,
    opdToday: 45,
    ipdAdmissions: 23,
    revenueToday: 125000,
    pendingBills: 15,
    lowStockMedicines: 8,
    pendingLabTests: 12,
    availableBeds: 35
  }
};

// Helper function to simulate API delay
export const simulateApiDelay = (ms = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API response wrapper
export const mockApiResponse = (data, success = true, message = 'Success') => {
  return {
    success,
    message,
    data
  };
};
