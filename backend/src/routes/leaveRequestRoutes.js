const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const LeaveRequestController = require('../controllers/LeaveRequestController');

router.post('/', authMiddleware, LeaveRequestController.createLeaveRequest);
router.get('/', authMiddleware, LeaveRequestController.getAll);
router.get('/stats', authMiddleware, LeaveRequestController.getLeaveStats);
router.get('/:id', authMiddleware, LeaveRequestController.getById);
router.get('/employee/:employee_id', authMiddleware, LeaveRequestController.getByEmployee);
router.post('/:id/approve', authMiddleware, LeaveRequestController.approveLeaveRequest);
router.post('/:id/reject', authMiddleware, LeaveRequestController.rejectLeaveRequest);

module.exports = router;
