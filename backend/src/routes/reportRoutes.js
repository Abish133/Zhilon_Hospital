'use strict';

const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');
const { authorize } = require('../middleware/rbac');

// Dashboard summary — open to all authenticated staff so every role sees a home page.
const ANY_STAFF = ['Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Radiologist',
                   'Receptionist', 'Accountant', 'HR', 'Employee'];
router.get('/dashboard-stats', authorize(ANY_STAFF), ReportController.getDashboardStats);

// OPD Statistics
router.get('/opd-statistics', ReportController.getOPDStatistics);

// IPD Occupancy
router.get('/ipd-occupancy', ReportController.getIPDOccupancy);

// Revenue Report
router.get('/revenue', ReportController.getRevenue);

// Doctor Performance
router.get('/doctor-performance', ReportController.getDoctorPerformance);

// Stock/Inventory Expiry
router.get('/inventory/expiry', ReportController.getStockExpiry);

// Inventory Consumption
router.get('/inventory/consumption', ReportController.getInventoryConsumption);

// Outstanding Payments
router.get('/outstanding-payments', ReportController.getOutstandingPayments);

// Collection report grouped by payment mode
router.get('/collection-by-mode', ReportController.getCollectionByMode);

// Fast / slow moving medicines (velocity)
router.get('/medicine-velocity', ReportController.getMedicineVelocity);

// Export Report
router.get('/export/:reportType', ReportController.exportReport);

module.exports = router;
