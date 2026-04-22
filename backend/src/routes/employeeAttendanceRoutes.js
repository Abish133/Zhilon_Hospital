const express = require('express');
const EmployeeAttendanceController = require('../controllers/EmployeeAttendanceController');
const router = express.Router();

// Self-service endpoints (based on authenticated user)
router.get('/today', EmployeeAttendanceController.getToday);
router.post('/check-in', EmployeeAttendanceController.checkIn);
router.post('/check-out', EmployeeAttendanceController.checkOut);

// Admin / report endpoints
router.get('/', EmployeeAttendanceController.getAllEmployeeAttendance);
router.get('/:id', EmployeeAttendanceController.getEmployeeAttendanceById);
router.post('/', EmployeeAttendanceController.createEmployeeAttendance);
router.put('/:id', EmployeeAttendanceController.updateEmployeeAttendance);
router.delete('/:id', EmployeeAttendanceController.deleteEmployeeAttendance);

module.exports = router;
