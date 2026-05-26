import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@components/layout/AppLayout';
import ProtectedRoute from '@components/layout/ProtectedRoute';
import Login from '@pages/auth/Login';
import InitialSetup from '@pages/auth/InitialSetup';
import Dashboard from '@pages/dashboard/Dashboard';
import PatientList from '@pages/patients/PatientList';
import MedicineCategoryList from '@pages/pharmacy/MedicineCategoryList';
import PatientDetail from '@pages/patients/PatientDetail';
import OPDAppointments from '@pages/opd/OPDAppointments';
import OPDVitals from '@pages/opd/OPDVitals';
import OPDConsultation from '@pages/opd/OPDConsultation';
import OPDVisits from '@pages/opd/OPDVisits';
import OPDDashboard from '@pages/opd/OPDDashboard';
import OPDPrescriptions from '@pages/opd/OPDPrescriptions';
import OPDQueue from '@pages/opd/OPDQueue';
import IPDAdmissions from '@pages/ipd/IPDAdmissions';
import IPDAdmissionForm from '@pages/ipd/IPDAdmissionForm';
import IPDDailyCare from '@pages/ipd/IPDDailyCare';
import IPDDischarge from '@pages/ipd/IPDDischarge';
import IpdVitalsForm from '@pages/ipd/IpdVitalsForm';
import IpdVitalsList from '@pages/ipd/IpdVitalsList';
import WardManagement from '@pages/ipd/WardManagement';
import NurseAssignment from '@pages/ipd/NurseAssignment';
import NursingChecklist from '@pages/ipd/NursingChecklist';
import Pharmacy from '@pages/pharmacy/Pharmacy';
import PharmacyDispense from '@pages/pharmacy/PharmacyDispense';
import PharmacySales from '@pages/pharmacy/PharmacySales';
import LabOrders from '@pages/lab/LabOrders';
import LabTestMaster from '@pages/lab/LabTestMaster';
import LabResultEntry from '@pages/lab/LabResultEntry';
import LabReport from '@pages/lab/LabReport';

import Billing from '@pages/billing/Billing';
import BillGeneration from '@pages/billing/BillGeneration';
import AdvancePayment from '@pages/billing/AdvancePayment';
import InsuranceClaims from '@pages/billing/InsuranceClaims';
import RefundManagement from '@pages/billing/RefundManagement';
import Employees from '@pages/employees/Employees';
import Reports from '@pages/reports/Reports';
import Profile from '@pages/profile/Profile';
import Settings from '@pages/settings/Settings';
import AppointmentBooking from '@pages/appointments/AppointmentBooking';
import Radiology from '@pages/radiology/Radiology';
import RadiologyOrders from '@pages/radiology/RadiologyOrders';
import RadiologyReport from '@pages/radiology/RadiologyReport';
import OTManagement from '@pages/ot/OTManagement';
import OTPreOpChecklist from '@pages/ot/OTPreOpChecklist';
import OTIntraOpNotes from '@pages/ot/OTIntraOpNotes';
import OTPostOpNotes from '@pages/ot/OTPostOpNotes';
import OTRooms from '@pages/ot/OTRooms';
import { OTConsumablesManagement } from '@pages/ot/OTConsumables';
import AnesthesiaNotes from '@pages/ot/AnesthesiaNotes';
import Inventory from '@pages/inventory/Inventory';
import Equipment from '@pages/equipment/Equipment';
import ChargeMaster from '@pages/admin/ChargeMaster';
import UserManagement from '@pages/admin/UserManagement';
import AuditLogs from '@pages/admin/AuditLogs';
import DoctorSchedules from '@pages/admin/DoctorSchedules';
import Doctors from '@pages/admin/Doctors';
import DoctorProfile from '@pages/admin/DoctorProfile';
import DoctorQualifications from '@pages/admin/DoctorQualifications';
import DoctorLeaves from '@pages/admin/DoctorLeaves';
import CalibrationLogs from '@pages/admin/CalibrationLogs';
import AttendancePayroll from '@pages/admin/AttendancePayroll';
import AnalyticsDashboard from '@pages/admin/AnalyticsDashboard';
import PackageManagement from '@pages/admin/PackageManagement';
import MarkAttendance from '@pages/attendance/MarkAttendance';
import BedManagement from '@pages/beds/BedManagement';
import PurchaseOrders from '@pages/inventory/PurchaseOrders';
import GoodsReceipt from '@pages/inventory/GoodsReceipt';
import VendorManagement from '@pages/inventory/VendorManagement';
import RadiologyScheduling from '@pages/radiology/RadiologyScheduling';
import RadiologyTestMaster from '@pages/radiology/RadiologyTestMaster';
import RadiologyImaging from '@pages/radiology/RadiologyImaging';
import EquipmentMaintenance from '@pages/equipment/EquipmentMaintenance';
import DetailedReports from '@pages/reports/DetailedReports';
import InventoryIssueReturn from '@pages/inventory/InventoryIssueReturn';
import EquipmentMaintenanceCalendar from '@pages/equipment/EquipmentMaintenanceCalendar';
import { ROLES } from '@utils/constants';
import MedicineList from './pages/pharmacy/MedicineList';
import MedicineBatch from './pages/pharmacy/MedicineBatch';
import PatientMedicalHistoryList from './pages/patients/PatientMedicalHistoryList';
import InventoryCategoryList from './pages/inventory/InventoryCategoryList';
import EquipmentDashboard from './pages/equipment/EquipmentDashboard';
import PreventiveMaintenance from './pages/equipment/PreventiveMaintenance';
import PatientMedicationHistoryList from './pages/patients/PatientMedicationHistoryList';
import PatientClinicalHistoryList from './pages/patients/PatientClinicalHistoryList';
import MaintenanceHistory from './pages/equipment/MaintenanceHistory';
import ShiftManagement from './pages/hr/ShiftManagement';
import RosterManagement from './pages/hr/RosterManagement';
import PayrollGeneration from './pages/hr/PayrollGeneration';
import LeaveRequests from './pages/hr/LeaveRequests';
import SalaryStructure from './pages/hr/SalaryStructure';
import AdvancedReports from './pages/reports/AdvancedReports';
import IpdPatientDetails from './pages/IpdPatientDetails';
import IpdMedicationsList from './pages/ipd/IpdMedicationsList';
import IpdPharmacy from './pages/pharmacy/IpdPharmacy';
import NotFoundPage from './pages/error/NotFoundPage';
import DepartmentBilling from './pages/billing/DepartmentBilling';

const router = createBrowserRouter([
  {
    path: '/setup',
    element: <InitialSetup />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/profile', element: <Profile /> },
      { path: '/attendance/mark', element: <MarkAttendance /> },
      {
        path: '/patients',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <PatientList />
          </ProtectedRoute>
        )
      },
      {
        path: '/patients/:uhid',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <PatientDetail />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <OPDDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/appointments',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <OPDAppointments />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/visits',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN]}>
            <OPDVisits />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/vitals/:visitId',
        element: (
          <ProtectedRoute roles={[ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN]}>
            <OPDVitals />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/consultation/:visitId',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <OPDConsultation />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/prescriptions',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN]}>
            <OPDPrescriptions />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/queue',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ADMIN]}>
            <OPDQueue />
          </ProtectedRoute>
        )
      },
      {
        path: '/appointments/book',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.ADMIN]}>
            <AppointmentBooking />
          </ProtectedRoute>
        )
      },

      {
        path: '/ipd',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <IPDAdmissions />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/admit',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.ADMIN]}>
            <IPDAdmissionForm />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/vitals',
        element: (
          <ProtectedRoute roles={[ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN]}>
            <IpdVitalsList />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/vitals/:admissionId',
        element: (
          <ProtectedRoute roles={[ROLES.NURSE, ROLES.DOCTOR, ROLES.ADMIN]}>
            <IpdVitalsForm />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/medications',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <IpdMedicationsList />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/patient/:admissionId',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <IpdPatientDetails />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/care/:admissionId',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <IPDDailyCare />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/discharge/:admissionId',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <IPDDischarge />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/wards',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.NURSE]}>
            <WardManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/nurse-assignments',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.NURSE]}>
            <NurseAssignment />
          </ProtectedRoute>
        )
      },
      {
        path: '/ipd/nursing-checklist',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.NURSE]}>
            <NursingChecklist />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <Pharmacy />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/dispense',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <PharmacyDispense />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/ipd',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <IpdPharmacy />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/sales',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <PharmacySales />
          </ProtectedRoute>
        )
      },
      {
        path: '/lab',
        element: (
          <ProtectedRoute roles={[ROLES.LAB_TECH, ROLES.ADMIN]}>
            <LabOrders />
          </ProtectedRoute>
        )
      },
      {
        path: '/lab/test-master',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <LabTestMaster />
          </ProtectedRoute>
        )
      },
      {
        path: '/lab/results/:order_id',
        element: (
          <ProtectedRoute roles={[ROLES.LAB_TECH, ROLES.ADMIN]}>
            <LabResultEntry />
          </ProtectedRoute>
        )
      },
      {
        path: '/lab/report/:order_id',
        element: (
          <ProtectedRoute roles={[ROLES.LAB_TECH, ROLES.DOCTOR, ROLES.ADMIN]}>
            <LabReport />
          </ProtectedRoute>
        )
      },
      {
        path: '/radiology',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RADIOLOGIST, ROLES.DOCTOR]}>
            <RadiologyOrders />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <OTManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/rooms',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <OTRooms />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/preop',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <OTPreOpChecklist />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/intraop',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <OTIntraOpNotes />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/postop',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <OTPostOpNotes />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/consumables',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <OTConsumablesManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/ot/anesthesia/:booking_id',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <AnesthesiaNotes />
          </ProtectedRoute>
        )
      },
      {
        path: '/inventory',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.PHARMACIST]}>
            <Inventory />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <Equipment />
          </ProtectedRoute>
        )
      },
      {
        path: '/billing',
        element: (
          <ProtectedRoute roles={[ROLES.ACCOUNTANT, ROLES.RECEPTIONIST, ROLES.ADMIN]}>
            <Billing />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/billing',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ACCOUNTANT, ROLES.ADMIN]}>
            <DepartmentBilling departmentType="Pharmacy" serviceTypeMap="Pharmacy" />
          </ProtectedRoute>
        )
      },
      {
        path: '/lab/billing',
        element: (
          <ProtectedRoute roles={[ROLES.LAB_TECH, ROLES.ACCOUNTANT, ROLES.ADMIN]}>
            <DepartmentBilling departmentType="Laboratory" serviceTypeMap="Investigation" />
          </ProtectedRoute>
        )
      },
      {
        path: '/opd/billing',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.ACCOUNTANT, ROLES.ADMIN]}>
            <DepartmentBilling departmentType="OPD" serviceTypeMap="Consultation" />
          </ProtectedRoute>
        )
      },
      {
        path: '/billing/generate/:episodeId',
        element: (
          <ProtectedRoute roles={[ROLES.ACCOUNTANT, ROLES.RECEPTIONIST, ROLES.ADMIN]}>
            <BillGeneration />
          </ProtectedRoute>
        )
      },
      {
        path: '/billing/advance',
        element: (
          <ProtectedRoute roles={[ROLES.ACCOUNTANT, ROLES.RECEPTIONIST, ROLES.ADMIN]}>
            <AdvancePayment />
          </ProtectedRoute>
        )
      },
    
     
      {
        path: '/employees',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <Employees />
          </ProtectedRoute>
        )
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.HR]}>
            <Reports />
          </ProtectedRoute>
        )
      },
      {
        path: '/settings',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <Settings />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/charges',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT]}>
            <ChargeMaster />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <UserManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/audit-logs',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AuditLogs />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/doctors',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <Doctors />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/doctors/:id',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST]}>
            <DoctorProfile />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/schedules',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR]}>
            <DoctorSchedules />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/doctor-qualifications',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <DoctorQualifications />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/doctor-leaves',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.DOCTOR]}>
            <DoctorLeaves />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/calibration',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <CalibrationLogs />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/attendance',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <AttendancePayroll />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/analytics',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <AnalyticsDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/packages',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT]}>
            <PackageManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/beds/management',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.NURSE, ROLES.RECEPTIONIST]}>
            <BedManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/billing/insurance',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <InsuranceClaims />
          </ProtectedRoute>
        )
      },
      {
        path: '/billing/refunds',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT]}>
            <RefundManagement />
          </ProtectedRoute>
        )
      },

      {
        path: '/inventory/purchase-orders',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PHARMACIST, ROLES.HR, ROLES.ACCOUNTANT]}>
            <PurchaseOrders />
          </ProtectedRoute>
        )
      },
      {
        path: '/inventory/goods-receipt',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PHARMACIST, ROLES.HR]}>
            <GoodsReceipt />
          </ProtectedRoute>
        )
      },
      {
        path: '/inventory/vendors',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT]}>
            <VendorManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/radiology/test-master',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RADIOLOGIST]}>
            <RadiologyTestMaster />
          </ProtectedRoute>
        )
      },
      {
        path: '/radiology/imaging/:orderId',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RADIOLOGIST]}>
            <RadiologyImaging />
          </ProtectedRoute>
        )
      },
      {
        path: '/radiology/scheduling',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.RADIOLOGIST]}>
            <RadiologyScheduling />
          </ProtectedRoute>
        )
      },
      {
        path: '/radiology/report/:orderId',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.RADIOLOGIST]}>
            <RadiologyReport />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/maintenance',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.NURSE]}>
            <EquipmentMaintenance />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/maintenance-calendar',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <EquipmentMaintenanceCalendar />
          </ProtectedRoute>
        )
      },
      {
        path: '/inventory/issue-return',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PHARMACIST, ROLES.HR, ROLES.NURSE]}>
            <InventoryIssueReturn />
          </ProtectedRoute>
        )
      },
      {
        path: '/reports/detailed',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.HR]}>
            <DetailedReports />
          </ProtectedRoute>
        )
      },
      {
        path: '/reports/advanced',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.ACCOUNTANT, ROLES.HR, ROLES.DOCTOR]}>
            <AdvancedReports />
          </ProtectedRoute>
        )
      },
      {
        path: '/medicalhistory',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <PatientMedicalHistoryList />
          </ProtectedRoute>
        )
      },
       {
        path: '/pharmacy/medicine-categories',
        element: (
          <ProtectedRoute roles={[ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <MedicineCategoryList/>
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/medicines',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <MedicineList />
          </ProtectedRoute>
        )
      },
      {
        path: '/pharmacy/batches',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
            <MedicineBatch />
          </ProtectedRoute>
        )
      },
       {
        path: '/inventory/categories',
        element: (
          <ProtectedRoute roles={[ROLES.PHARMACIST, ROLES.ADMIN, ROLES.HR]}>
            <InventoryCategoryList />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/dashboard',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <EquipmentDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/preventive-maintenance',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <PreventiveMaintenance />
          </ProtectedRoute>
        )
      },
      {
        path: '/equipment/maintenance-history',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <MaintenanceHistory />
          </ProtectedRoute>
        )
      },
      {
        path: '/clinical-history',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN]}>
            <PatientClinicalHistoryList />
          </ProtectedRoute>
        )
      },
      {
        path: '/medication-history',
        element: (
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.PHARMACIST, ROLES.ADMIN]}>
            <PatientMedicationHistoryList />
          </ProtectedRoute>
        )
      },
      {
        path: '/hr/shifts',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <ShiftManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/hr/roster',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <RosterManagement />
          </ProtectedRoute>
        )
      },
      {
        path: '/hr/payroll',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.ACCOUNTANT]}>
            <PayrollGeneration />
          </ProtectedRoute>
        )
      },
      {
        path: '/hr/leave-requests',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE, ROLES.DOCTOR, ROLES.NURSE]}>
            <LeaveRequests />
          </ProtectedRoute>
        )
      },
      {
        path: '/hr/salary-structure',
        element: (
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]}>
            <SalaryStructure />
          </ProtectedRoute>
        )
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  },
  { path: '*', element: <NotFoundPage /> }
]);

export default router;
