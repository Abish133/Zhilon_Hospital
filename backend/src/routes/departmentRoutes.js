const express = require('express');
const DepartmentController = require('../controllers/DepartmentController');
const router = express.Router();

router.post('/', DepartmentController.createDepartment);
router.get('/', DepartmentController.getAllDepartments);
router.get('/:id', DepartmentController.getDepartmentById);
router.put('/:id', DepartmentController.updateDepartment);
router.delete('/:id', DepartmentController.deleteDepartment);

module.exports = router;