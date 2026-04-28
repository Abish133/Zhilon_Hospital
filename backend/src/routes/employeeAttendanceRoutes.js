const express = require('express');
const EmployeeAttendanceController = require('../controllers/EmployeeAttendanceController');
const { authorize } = require('../middleware/rbac');
const router = express.Router();

// Self-service endpoints (any authenticated staff can mark their own attendance)
const ANY_STAFF = ['Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Radiologist',
                   'Receptionist', 'Accountant', 'HR', 'Employee'];

router.get('/today', authorize(ANY_STAFF), EmployeeAttendanceController.getToday);
router.post('/check-in', authorize(ANY_STAFF), EmployeeAttendanceController.checkIn);
router.post('/check-out', authorize(ANY_STAFF), EmployeeAttendanceController.checkOut);

// Admin / HR endpoints — manage anyone's attendance record
router.get('/', authorize(ANY_STAFF), EmployeeAttendanceController.getAllEmployeeAttendance);
router.get('/:id', authorize(ANY_STAFF), EmployeeAttendanceController.getEmployeeAttendanceById);
router.post('/', authorize('HR'), EmployeeAttendanceController.createEmployeeAttendance);
router.put('/:id', authorize('HR'), EmployeeAttendanceController.updateEmployeeAttendance);
router.delete('/:id', authorize('HR'), EmployeeAttendanceController.deleteEmployeeAttendance);

module.exports = router;
