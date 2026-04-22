const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ReportController = require('../controllers/EnhancedReportController');

// Patient Statistics
router.get('/patients/statistics', authMiddleware, ReportController.getPatientStatistics);

// Doctor Productivity
router.get('/doctors/productivity', authMiddleware, ReportController.getDoctorProductivity);

// Pharmacy Sales
router.get('/pharmacy/sales', authMiddleware, ReportController.getPharmacySalesReport);

// Inventory Expiry
router.get('/inventory/expiry', authMiddleware, ReportController.getInventoryExpiryReport);

// Outstanding Payments
router.get('/billing/outstanding', authMiddleware, ReportController.getOutstandingPaymentsReport);

// Bed Occupancy
router.get('/ipd/bed-occupancy', authMiddleware, ReportController.getBedOccupancyReport);

// Department Performance
router.get('/departments/performance', authMiddleware, ReportController.getDepartmentPerformance);

// Revenue Report
router.get('/billing/revenue', authMiddleware, ReportController.getRevenueReport);

// Inventory Stock
router.get('/inventory/stock', authMiddleware, ReportController.getInventoryStockReport);

module.exports = router;
