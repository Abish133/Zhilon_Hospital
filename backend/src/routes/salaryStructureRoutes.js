const express = require('express');
const SalaryStructureController = require('../controllers/SalaryStructureController');
const authenticate = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Get all salary structures
router.get('/', authenticate, SalaryStructureController.getAll);

// Get salary structure by employee
router.get('/employee/:employeeId', authenticate, SalaryStructureController.getByEmployee);

// Create salary structure
router.post('/', authenticate, auditLogger('CREATE', 'SalaryStructure'), SalaryStructureController.create);

// Update salary structure
router.put('/:id', authenticate, auditLogger('UPDATE', 'SalaryStructure'), SalaryStructureController.update);

// Delete salary structure
router.delete('/:id', authenticate, auditLogger('DELETE', 'SalaryStructure'), SalaryStructureController.delete);

module.exports = router;

