const express = require('express');
const DoctorController = require('../controllers/DoctorController');
const router = express.Router();

// IMPORTANT: Specific routes MUST come before parameterized routes
router.get('/employees/dropdown', DoctorController.getDoctorEmployees);

router.get('/', DoctorController.getAllDoctors);
router.post('/', DoctorController.createDoctor);
router.get('/:id', DoctorController.getDoctorById);
router.put('/:id', DoctorController.updateDoctor);
router.delete('/:id', DoctorController.deleteDoctor);

module.exports = router;