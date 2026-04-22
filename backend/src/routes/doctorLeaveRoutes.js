const express = require('express');
const router = express.Router();
const DoctorLeaveController = require('../controllers/DoctorLeaveController');

router.get('/check', DoctorLeaveController.checkAvailability);
router.post('/', DoctorLeaveController.create);
router.get('/', DoctorLeaveController.list);
router.put('/:id/status', DoctorLeaveController.updateStatus);
router.delete('/:id', DoctorLeaveController.remove);

module.exports = router;
