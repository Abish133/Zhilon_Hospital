const express = require('express');
const ShiftController = require('../controllers/ShiftController');
const authenticate = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Get all shifts
router.get('/', authenticate, ShiftController.getAll);

// Get shift by ID
router.get('/:id', authenticate, ShiftController.getById);

// Create shift
router.post('/', authenticate, auditLogger('CREATE', 'Shift'), ShiftController.create);

// Update shift
router.put('/:id', authenticate, auditLogger('UPDATE', 'Shift'), ShiftController.update);

// Delete shift
router.delete('/:id', authenticate, auditLogger('DELETE', 'Shift'), ShiftController.delete);

module.exports = router;

