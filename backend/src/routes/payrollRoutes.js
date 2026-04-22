const express = require('express');
const PayrollController = require('../controllers/PayrollController');
const authenticate = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Get all payroll records
router.get('/', authenticate, PayrollController.getAll);

// Get payroll by ID
router.get('/:id', authenticate, PayrollController.getById);

// Generate payroll for month/year
router.post('/generate', authenticate, auditLogger('CREATE', 'Payroll'), PayrollController.generate);

// Approve payroll
router.put('/:id/approve', authenticate, auditLogger('UPDATE', 'Payroll'), PayrollController.approve);

// Process payment
router.put('/:id/process', authenticate, auditLogger('UPDATE', 'Payroll'), PayrollController.process);

// Adjust payroll
router.put('/:id/adjust', authenticate, auditLogger('UPDATE', 'Payroll'), PayrollController.adjust);

// Get payslip
router.get('/:id/payslip', authenticate, PayrollController.getPayslip);

// Cancel payroll
router.put('/:id/cancel', authenticate, auditLogger('UPDATE', 'Payroll'), PayrollController.cancel);

module.exports = router;

