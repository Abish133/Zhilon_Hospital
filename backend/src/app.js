require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authMiddleware = require('./middleware/auth');
const { enforceHospitalScope } = require('./middleware/rbac');
const { gateFor } = require('./middleware/roleMatrix');
const { apiLimiter } = require('./middleware/rateLimiter');
const { globalAuditLogger } = require('./middleware/auditLogger');
let helmet;
try { helmet = require('helmet'); } catch (e) { helmet = null; }
const doctorRoutes = require('./routes/doctorRoutes');
const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const patientRoutes = require('./routes/patientRoutes');
const opdConsultationRoutes = require('./routes/opdConsultationRoutes');
const wardRoutes = require('./routes/wardRoutes');
const bedRoutes = require('./routes/bedRoutes');
const ipdNurseAssignmentRoutes = require('./routes/ipdNurseAssignmentRoutes');
const grnDetailRoutes = require('./routes/grnDetailRoutes');
const stockIssueRoutes = require('./routes/stockIssueRoutes');
const stockReturnRoutes = require('./routes/stockReturnRoutes');
const opdAppointmentRoutes = require('./routes/opdAppointmentRoutes');
const opdVisitRoutes = require('./routes/opdVisitRoutes');
const opdVitalRoutes = require('./routes/opdVitalRoutes');
const ipdAdmissionRoutes = require('./routes/ipdAdmissionRoutes');
const ipdProgressNoteRoutes = require('./routes/ipdProgressNoteRoutes');
const ipdDischargeSummaryRoutes = require('./routes/ipdDischargeSummaryRoutes');
const ipdVitalsRoutes = require('./routes/ipdVitals');
const inventoryItemRoutes = require('./routes/inventoryItemRoutes');
const ipdDischargeNursingSummaryRoutes = require('./routes/ipdDischargeNursingSummaryRoutes');
const inventoryCategoryRoutes = require('./routes/inventoryCategoryRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const purchaseOrderDetailRoutes = require('./routes/purchaseOrderDetailRoutes');
const goodsReceiptNoteRoutes = require('./routes/goodsReceiptNoteRoutes');
const patientMedicalHistoryRoutes = require('./routes/PatientMedicalHistoryRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const medicinebatchRoutes = require('./routes/medicineBatchRoutes');
const patientClinicalHistory = require('./routes/patientClinicalHistoryRoutes');
const patientMedicationHistoryRoutes = require('./routes/patientMedicationHistoryRoutes');
const otRoomsRoutes = require('./routes/otRoomsRoutes');
const otBookingsRoutes = require('./routes/otBookingsRoutes');
const otPreoperativeRoutes = require('./routes/otPreOperativeRoutes');
const otintraoperativeRoutes = require('./routes/otIntraOperativeRoutes');
const otpostoperativeRoutes = require('./routes/otPostOperativeRoutes');
const opdPrescriptionRoutes = require('./routes/opdPrescriptionRoutes');
const pharmacySaleRoutes = require('./routes/pharmacySaleRoutes');
const pharmacySaleDetailRoutes = require('./routes/pharmacySaleDetailRoutes');
const pharmacySalesDispenseRoutes = require('./routes/pharmacySales');
const labTestRoutes = require('./routes/labTestRoutes');
const labOrderRoutes = require('./routes/labOrderRoutes');
const labOrderDetailRoutes = require('./routes/labOrderDetailRoutes');
const labSampleRoutes = require('./routes/labSampleRoutes');
const labResultRoutes = require('./routes/labResultRoutes');
const labReportRoutes = require('./routes/labReportRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const preventiveMaintenanceRoutes = require('./routes/preventiveMaintenanceRoutes');
const maintenanceRequestRoutes = require('./routes/maintenanceRequestRoutes');
const maintenanceHistoryRoutes = require('./routes/maintenanceHistoryRoutes');
const billingEpisodeRoutes = require('./routes/billingEpisodeRoutes');
const billChargeRoutes = require('./routes/billChargeRoutes');
const billRoutes = require('./routes/billRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentAdvanceRoutes = require('./routes/paymentAdvanceRoutes');
const refundRoutes = require('./routes/refundRoutes');
const chargeMasterRoutes = require('./routes/chargeMasterRoutes');
const packageRoutes = require('./routes/packageRoutes');
const otconsumablesusedRoutes = require('./routes/otConsumablesUsedRoutes');
const radiologyTestsRoutes = require('./routes/radiologyTestsRoutes');
const radiologyOrdersRoutes = require('./routes/radiologyOrdersRoutes');
const radiologyImagingRoutes = require('./routes/radiologyImagingRoutes');
const radiologyReportsRoutes = require('./routes/radiologyReportsRoutes');
const doctorSchedulesRoutes = require('./routes/doctorSchedulesRoutes');
const employeeAttendanceRoutes = require('./routes/employeeAttendanceRoutes');
const medicineCategoryRoutes = require('./routes/medicineCategoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const patientDocumentRoutes = require('./routes/patientDocumentRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const rosterRoutes = require('./routes/rosterRoutes');
const salaryStructureRoutes = require('./routes/salaryStructureRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const insuranceClaimRoutes = require('./routes/insuranceClaimRoutes');
const leaveRequestRoutes = require('./routes/leaveRequestRoutes');
const enhancedReportRoutes = require('./routes/enhancedReportRoutes');
const ipdMedicationRoutes = require('./routes/ipdMedication');
const adminJobsRoutes = require('./routes/adminJobsRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const doctorLeaveRoutes = require('./routes/doctorLeaveRoutes');
const doctorQualificationRoutes = require('./routes/doctorQualificationRoutes');
const calibrationLogRoutes = require('./routes/calibrationLogRoutes');
const nursingChecklistRoutes = require('./routes/nursingChecklistRoutes');
const reportExportRoutes = require('./routes/reportExportRoutes');
const vendorReturnRoutes = require('./routes/vendorReturnRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startScheduler } = require('./jobs/scheduler');
const { xssProtection, securityHeaders } = require('./middleware/xssProtection');

const app = express();

// Security headers middleware
app.use(securityHeaders);

// XSS Protection middleware
app.use(xssProtection);

// CORS middleware — allowed origins come from CORS_ORIGIN (comma-separated)
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

if (helmet) app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(express.json({ limit: '10mb' }));

// Liveness/readiness probe for load balancers and orchestrators.
// Liveness = process is up; readiness = also DB reachable.
app.get('/healthz', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/readyz', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not-ready', error: err.message });
  }
});

// Rate limit all API traffic
app.use('/api/', apiLimiter);

// Auth routes (login/register exempt from token check)
app.use('/api/auth', authRoutes);

// Hospital registration (public endpoint for initial setup)
app.post('/api/hospitals/register', require('./controllers/HospitalController').registerHospital);

// All other /api routes require authentication + hospital scope + RBAC role gate
const protect = [authMiddleware, enforceHospitalScope, globalAuditLogger];
const guard = (mod) => [...protect, gateFor(mod)];

app.use('/api/hospitals', guard('hospital'), hospitalRoutes);
app.use('/api/doctors', guard('doctor'), doctorRoutes);
app.use('/api/employees', guard('employee'), employeeRoutes);
app.use('/api/departments', guard('department'), departmentRoutes);
app.use('/api/patients', guard('patients'), patientRoutes);
app.use('/api/opd-consultations', guard('opdConsultation'), opdConsultationRoutes);
app.use('/api/wards', guard('ward'), wardRoutes);
app.use('/api/beds', guard('bed'), bedRoutes);
app.use('/api/ipd-nurse-assignments', guard('ipdNurseAssign'), ipdNurseAssignmentRoutes);
app.use('/api/grn-details', guard('grn'), grnDetailRoutes);
app.use('/api/stock-issues', guard('stock'), stockIssueRoutes);
app.use('/api/stock-returns', guard('stock'), stockReturnRoutes);
app.use('/api/opd-appointments', guard('opdAppointment'), opdAppointmentRoutes);
app.use('/api/opd-visits', guard('opdVisit'), opdVisitRoutes);
app.use('/api/opd-vitals', guard('opdVital'), opdVitalRoutes);
app.use('/api/ipd-admissions', guard('ipdAdmission'), ipdAdmissionRoutes);
app.use('/api/ipd-progress-notes', guard('ipdProgress'), ipdProgressNoteRoutes);
app.use('/api/ipd-discharge-summary', guard('ipdDischarge'), ipdDischargeSummaryRoutes);
app.use('/api/ipd-vitals', guard('ipdVitals'), ipdVitalsRoutes);
app.use('/api/inventory-items', guard('inventory'), inventoryItemRoutes);
app.use('/api/ipd-discharge-nursing-summary', guard('ipdDischarge'), ipdDischargeNursingSummaryRoutes);
app.use('/api/inventory-categories', guard('inventory'), inventoryCategoryRoutes);
app.use('/api/vendors', guard('vendor'), vendorRoutes);
app.use('/api/vendor-returns', guard('vendorReturn'), vendorReturnRoutes);
app.use('/api/purchase-orders', guard('purchaseOrder'), purchaseOrderRoutes);
app.use('/api/purchase-order-details', guard('purchaseOrder'), purchaseOrderDetailRoutes);
app.use('/api/goods-receipt-notes', guard('grn'), goodsReceiptNoteRoutes);
app.use('/api/patient-medical-history', guard('patientHistory'), patientMedicalHistoryRoutes);
app.use('/api/medicine', guard('medicine'), medicineRoutes);
app.use('/api/medicine-batch', guard('medicineBatch'), medicinebatchRoutes);
app.use('/api/patient-clinical-history', guard('patientHistory'), patientClinicalHistory);
app.use('/api/patient-medication-history', guard('patientHistory'), patientMedicationHistoryRoutes);
app.use('/api/ot-rooms', guard('otRoom'), otRoomsRoutes);
app.use('/api/ot-bookings', guard('otBooking'), otBookingsRoutes);
app.use('/api/ot-pre-operative', guard('otClinical'), otPreoperativeRoutes);
app.use('/api/ot-intra-operative', guard('otClinical'), otintraoperativeRoutes);
app.use('/api/ot-post-operative', guard('otClinical'), otpostoperativeRoutes);
app.use('/api/opd-prescriptions', guard('opdPrescription'), opdPrescriptionRoutes);
app.use('/api/pharmacy-sales', guard('pharmacy'), pharmacySaleRoutes);
app.use('/api/pharmacy-sale-details', guard('pharmacy'), pharmacySaleDetailRoutes);
app.use('/api/pharmacy/sales', guard('pharmacy'), pharmacySalesDispenseRoutes);
app.use('/api/lab-tests', guard('lab'), labTestRoutes);
app.use('/api/lab-orders', guard('lab'), labOrderRoutes);
app.use('/api/lab-order-details', guard('lab'), labOrderDetailRoutes);
app.use('/api/lab-samples', guard('lab'), labSampleRoutes);
app.use('/api/lab-results', guard('labResult'), labResultRoutes);
app.use('/api/lab-reports', guard('labResult'), labReportRoutes);
app.use('/api/equipment', guard('equipment'), equipmentRoutes);
app.use('/api/preventive-maintenance', guard('maintenance'), preventiveMaintenanceRoutes);
app.use('/api/maintenance-requests', guard('maintenance'), maintenanceRequestRoutes);
app.use('/api/maintenance-history', guard('maintenance'), maintenanceHistoryRoutes);
app.use('/api/billing-episodes', guard('billing'), billingEpisodeRoutes);
app.use('/api/bill-charges', guard('billing'), billChargeRoutes);
app.use('/api/bills', guard('billing'), billRoutes);
app.use('/api/counter-billing', guard('billing'), require('./routes/counterBillingRoutes'));
app.use('/api/payments', guard('payment'), paymentRoutes);
app.use('/api/payment-advances', guard('payment'), paymentAdvanceRoutes);
app.use('/api/refunds', guard('refund'), refundRoutes);
app.use('/api/charge-masters', guard('chargeMaster'), chargeMasterRoutes);
app.use('/api/packages', guard('packageMaster'), packageRoutes);
app.use('/api/ot-consumables-used', guard('otConsumables'), otconsumablesusedRoutes);
app.use('/api/radiology-tests', guard('radiology'), radiologyTestsRoutes);
app.use('/api/radiology-orders', guard('radiology'), radiologyOrdersRoutes);
app.use('/api/radiology-imaging', guard('radiology'), radiologyImagingRoutes);
app.use('/api/radiology-reports', guard('radiologyReport'), radiologyReportsRoutes);
app.use('/api/doctor-schedules', guard('doctorSchedule'), doctorSchedulesRoutes);
// Attendance: route file handles per-endpoint RBAC (self-service vs HR-admin)
app.use('/api/employee-attendance', protect, employeeAttendanceRoutes);
app.use('/api/medicine_category', guard('medicineCategory'), medicineCategoryRoutes);
// Dashboard stats: open to every authenticated staff member, mounted before the
// financial-only `reports` gate so non-finance roles can still load the home page.
app.get('/api/reports/dashboard-stats', ...protect, require('./controllers/ReportController').getDashboardStats);
app.use('/api/reports', guard('reports'), reportRoutes);
app.use('/api/patient-documents', guard('patientDocs'), patientDocumentRoutes);
app.use('/api/shifts', guard('shift'), shiftRoutes);
app.use('/api/roster', guard('roster'), rosterRoutes);
app.use('/api/salary-structures', guard('salaryStructure'), salaryStructureRoutes);
app.use('/api/payroll', guard('payroll'), payrollRoutes);
app.use('/api/audit-logs', guard('auditLog'), auditLogRoutes);
app.use('/api/insurance-claims', guard('insurance'), insuranceClaimRoutes);
app.use('/api/leave-requests', guard('leaveRequest'), leaveRequestRoutes);
app.use('/api/leave-balances', guard('leaveBalance'), require('./routes/leaveBalanceRoutes'));
app.use('/api/expenses', guard('expense'), require('./routes/expenseRoutes'));
app.use('/api/reports-advanced', guard('reportsAdvanced'), enhancedReportRoutes);
app.use('/api/ipd', guard('ipdMedication'), ipdMedicationRoutes);
app.use('/api/admin/jobs', guard('adminJobs'), adminJobsRoutes);
app.use('/api/alerts', guard('alert'), alertsRoutes);
app.use('/api/doctor-leaves', guard('doctorLeave'), doctorLeaveRoutes);
app.use('/api/doctor-qualifications', guard('doctorQualification'), doctorQualificationRoutes);
app.use('/api/calibration-logs', guard('calibration'), calibrationLogRoutes);
app.use('/api/nursing-checklists', guard('nursingChecklist'), nursingChecklistRoutes);
app.use('/api/reports-export', guard('reports'), reportExportRoutes);
app.use('/api/notifications', guard('notification'), notificationRoutes);

const logger = require('./utils/logger');
const path = require('path');

// Serve static files from the 'public' directory (built React app)
app.use(express.static(path.join(__dirname, '../public')));

// Serve hospital logos publicly (non-sensitive branding assets). Only the
// `logos` subfolder is exposed — patient documents under uploads stay private.
app.use('/uploads/logos', express.static(path.join(__dirname, '../uploads/logos')));

// API root info endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Hospital Management System SaaS API is running' });
});

// Health check endpoint for monitoring
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await sequelize.authenticate();
    
    // Get database stats
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_tables,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()) as schema_tables
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: true,
        dialect: sequelize.options.dialect,
        tables: results[0]?.total_tables || 0
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

// Handle React routing — all non-API GET requests serve the React app
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.url.startsWith('/api/')) {
    return next();
  }
  const indexPath = path.join(__dirname, '../public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If index.html doesn't exist yet (e.g. build not done), just send API info
      res.json({ message: 'Hospital Management System API is running. Frontend not built yet.' });
    }
  });
});

// Global error handler — MUST be last middleware
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { method: req.method, url: req.originalUrl, error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Test database connection
sequelize.authenticate()
  .then(() => {
    startScheduler();
  })
  .catch(err => console.error('Database connection failed:', err));

module.exports = app;