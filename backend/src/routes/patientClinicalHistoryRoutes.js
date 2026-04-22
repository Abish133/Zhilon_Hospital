const express = require('express');
const router = express.Router();
const PatientClinicalHistoryController = require('../controllers/PatientClinicalHistoryController');

router.post('/', PatientClinicalHistoryController.create);
router.get('/', PatientClinicalHistoryController.getAll);
router.get('/:id', PatientClinicalHistoryController.getById);
router.get('/patient/:patientId', PatientClinicalHistoryController.getByPatientId);
router.put('/:id', PatientClinicalHistoryController.update);
router.delete('/:id', PatientClinicalHistoryController.delete);

module.exports = router;
