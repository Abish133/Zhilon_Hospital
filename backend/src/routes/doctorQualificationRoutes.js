const express = require('express');
const router = express.Router();
const DoctorQualificationController = require('../controllers/DoctorQualificationController');

router.post('/', DoctorQualificationController.create);
router.get('/', DoctorQualificationController.list);
router.put('/:id', DoctorQualificationController.update);
router.delete('/:id', DoctorQualificationController.remove);

module.exports = router;
