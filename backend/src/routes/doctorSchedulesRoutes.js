const express = require('express');
const DoctorSchedulesController = require('../controllers/DoctorSchedulesController');
const router = express.Router();

router.get('/', DoctorSchedulesController.getAllDoctorSchedules);
router.get('/:id', DoctorSchedulesController.getDoctorScheduleById);
router.post('/', DoctorSchedulesController.createDoctorSchedule);
router.put('/:id', DoctorSchedulesController.updateDoctorSchedule);
router.delete('/:id', DoctorSchedulesController.deleteDoctorSchedule);

module.exports = router;