const express = require('express');
const AuditLogController = require('../controllers/AuditLogController');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Get all audit logs with filters
router.get('/', authenticate, AuditLogController.getAll);

// Get audit log by ID
router.get('/:id', authenticate, AuditLogController.getById);

// Export audit logs
router.post('/export', authenticate, AuditLogController.export);

module.exports = router;

