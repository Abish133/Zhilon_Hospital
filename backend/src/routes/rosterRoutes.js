const express = require('express');
const RosterController = require('../controllers/RosterController');
const authenticate = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

const router = express.Router();

// Get all roster entries
router.get('/', authenticate, RosterController.getAll);

// Create single roster entry
router.post('/', authenticate, auditLogger('CREATE', 'Roster'), RosterController.create);

// Bulk create roster entries
router.post('/bulk', authenticate, auditLogger('CREATE', 'Roster'), RosterController.bulkCreate);

// Generate monthly roster
router.post('/generate', authenticate, auditLogger('CREATE', 'Roster'), RosterController.generateMonthly);

// Request shift swap
router.post('/swap', authenticate, auditLogger('UPDATE', 'Roster'), RosterController.requestSwap);

// Approve swap
router.put('/:id/swap', authenticate, auditLogger('UPDATE', 'Roster'), RosterController.approveSwap);

// Mark as leave
router.put('/:id/leave', authenticate, auditLogger('UPDATE', 'Roster'), RosterController.markLeave);

// Update roster entry
router.put('/:id', authenticate, auditLogger('UPDATE', 'Roster'), RosterController.update);

// Delete roster entry
router.delete('/:id', authenticate, auditLogger('DELETE', 'Roster'), RosterController.delete);

module.exports = router;

