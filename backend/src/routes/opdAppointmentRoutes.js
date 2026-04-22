const express = require('express');
const OpdAppointmentController = require('../controllers/OpdAppointmentController');
const router = express.Router();

router.post('/', OpdAppointmentController.createAppointment);
router.get('/', OpdAppointmentController.getAllAppointments);
router.get('/:id', OpdAppointmentController.getAppointmentById);
router.put('/:id', OpdAppointmentController.updateAppointment);
router.patch('/:id/status', OpdAppointmentController.updateStatus);
router.post('/:id/check-in', OpdAppointmentController.checkInAppointment);
router.delete('/:id', OpdAppointmentController.deleteAppointment);

module.exports = router;
