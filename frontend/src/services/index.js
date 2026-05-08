import BaseService from './BaseService';
import apiClient from '@config/api';

import pharmacyService from './PharmacyService';
import radiologyService from './RadiologyService';
import billingMainService from './BillingMainService';
import employeeService from './EmployeeService';
import inventoryMainService from './InventoryMainService';
import LabService from './LabService';
import OTService from './OTService';

export { pharmacyService };
export const labService = LabService;
export { radiologyService };
export const billingService = billingMainService;
export { employeeService };
export const otService = OTService;
export const inventoryService = inventoryMainService;

// Import and export new services
import ReportService from './ReportService';
import DocumentService from './DocumentService';
import VendorService from './VendorService';
import NotificationService from './NotificationService';

export const reportService = ReportService;
export const documentService = DocumentService;
export const vendorService = VendorService;
export const notificationService = NotificationService;

// User management
import UserService from './UserService';
export const userService = UserService;

// medical history management
import MedicalHistoryService from './MedicalHistoryService';
export const medicalHistoryService = MedicalHistoryService;

// Department management
import DepartmentService from './DepartmentService';
export const departmentService = DepartmentService;

// Hospital management
import HospitalService from './HospitalService';
export const hospitalService = HospitalService;

// Doctor management
import DoctorService from './DoctorService';
export const doctorService = DoctorService;

import DoctorQualificationService from './DoctorQualificationService';
export const doctorQualificationService = DoctorQualificationService;

import DoctorLeaveService from './DoctorLeaveService';
export const doctorLeaveService = DoctorLeaveService;

import CalibrationLogService from './CalibrationLogService';
export const calibrationLogService = CalibrationLogService;

// Doctor Schedule management
import DoctorScheduleService from './DoctorScheduleService';
export const doctorScheduleService = DoctorScheduleService;

// OPD Appointment management
import OpdAppointmentService from './OpdAppointmentService';
export const opdAppointmentService = OpdAppointmentService;

// OPD Vital management
import OpdVitalService from './OpdVitalService';
export const opdVitalService = OpdVitalService;

// Patient management
import PatientService from './PatientService';
export const patientService = PatientService;

// OPD Consultation
import OpdConsultationService from './OpdConsultationService';
export const opdConsultationService = OpdConsultationService;

// OPD Prescription
import OpdPrescriptionService from './OpdPrescriptionService';
export const opdPrescriptionService = OpdPrescriptionService;

// Lab Orders
import LabOrderService from './LabOrderService';
export const labOrderService = LabOrderService;

import LabOrderDetailService from './LabOrderDetailService';
export const labOrderDetailService = LabOrderDetailService;

import LabTestService from './LabTestService';
export const labTestService = LabTestService;

// Radiology Orders
import RadiologyOrderService from './RadiologyOrderService';
export const radiologyOrderService = RadiologyOrderService;

import RadiologyTestService from './RadiologyTestService';
export const radiologyTestService = RadiologyTestService;

// Medicine
import MedicineService from './MedicineService';
export const medicineService = MedicineService;

// OPD Visit management
import OpdVisitService from './OpdVisitService';
export const opdVisitService = OpdVisitService;

// Pharmacy Sales
import PharmacySaleService from './PharmacySaleService';
export const pharmacySaleService = PharmacySaleService;

import PharmacySaleDetailService from './PharmacySaleDetailService';
export const pharmacySaleDetailService = PharmacySaleDetailService;

import MedicineBatchService from './MedicineBatchService';
export const medicineBatchService = MedicineBatchService;

// Purchase Orders & Inventory
import PurchaseOrderService from './PurchaseOrderService';
export const purchaseOrderService = PurchaseOrderService;

import GoodsReceiptNoteService from './GoodsReceiptNoteService';
export const goodsReceiptNoteService = GoodsReceiptNoteService;

import InventoryItemService from './InventoryItemService';
export const inventoryItemService = InventoryItemService;

import InventoryCategoryService from './InventoryCategoryService';
export const inventoryCategoryService = InventoryCategoryService;

// Stock Issue & Return
import StockIssueService from './StockIssueService';
export const stockIssueService = StockIssueService;

import StockReturnService from './StockReturnService';
export const stockReturnService = StockReturnService;

// Radiology Services
import RadiologyImagingService from './RadiologyImagingService';
export const radiologyImagingService = RadiologyImagingService;

import RadiologyReportService from './RadiologyReportService';
export const radiologyReportService = RadiologyReportService;

// Lab Services
import LabSampleService from './LabSampleService';
import LabResultService from './LabResultService';
import LabReportService from './LabReportService';
export const labSampleService = LabSampleService;
export const labResultService = LabResultService;
export const labReportService = LabReportService;

// IPD Services
import WardService from './WardService';
import BedService from './BedService';
import IpdAdmissionService from './IpdAdmissionService';
import IpdNurseAssignmentService from './IpdNurseAssignmentService';
import IpdDischargeSummaryService from './IpdDischargeSummaryService';
import IpdProgressNoteService from './IpdProgressNoteService';
import IpdDischargeNursingSummaryService from './IpdDischargeNursingSummaryService';
import IpdVitalService from './IpdVitalService';
import NursingChecklistService from './NursingChecklistService';
export const wardService = WardService;
export const bedService = BedService;
export const ipdAdmissionService = IpdAdmissionService;
export const ipdNurseAssignmentService = IpdNurseAssignmentService;
export const ipdDischargeSummaryService = IpdDischargeSummaryService;
export const ipdProgressNoteService = IpdProgressNoteService;
export const ipdDischargeNursingSummaryService = IpdDischargeNursingSummaryService;
export const ipdVitalService = IpdVitalService;
export const nursingChecklistService = NursingChecklistService;

// Billing Services
import BillingEpisodeService from './BillingEpisodeService';
import BillChargeService from './BillChargeService';
import BillService from './BillService';
import PaymentService from './PaymentService';
import PaymentAdvanceService from './PaymentAdvanceService';
import RefundService from './RefundService';
export const billingEpisodeService = BillingEpisodeService;
export const billChargeService = BillChargeService;
export const billService = BillService;
export const paymentService = PaymentService;
export const paymentAdvanceService = PaymentAdvanceService;
export const refundService = RefundService;

// HR & Payroll Services
import ShiftService from './ShiftService';
import RosterService from './RosterService';
import SalaryStructureService from './SalaryStructureService';
import PayrollService from './PayrollService';
import AuditLogService from './AuditLogService';
import EmployeeAttendanceService from './EmployeeAttendanceService';
import LeaveRequestService from './LeaveRequestService';
export const shiftService = ShiftService;
export const rosterService = RosterService;
export const salaryStructureService = SalaryStructureService;
export const payrollService = PayrollService;
export const auditLogService = AuditLogService;
export const employeeAttendanceService = EmployeeAttendanceService;
export const leaveRequestService = LeaveRequestService;
