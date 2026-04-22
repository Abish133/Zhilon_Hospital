const express = require('express');
const EmployeeController = require('../controllers/EmployeeController');
const router = express.Router();

// Get users for dropdown
router.get('/users/dropdown', EmployeeController.getUsersForDropdown);
router.get('/users/:userId', EmployeeController.getUserById);

router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getAllEmployees);
router.get('/:id', EmployeeController.getEmployeeById);
router.put('/:id', EmployeeController.updateEmployee);
router.delete('/:id', EmployeeController.deleteEmployee);
router.get('/department/:departmentId', EmployeeController.getEmployeesByDepartment);

module.exports = router;