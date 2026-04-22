'use strict';

const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/ReportController');

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
