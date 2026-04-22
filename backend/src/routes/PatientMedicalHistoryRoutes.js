const express = require('express');
const PatientMedicalHistoryController = require('../controllers/PatientMedicalHistoryController');
const router = express.Router();

router.get('/', PatientMedicalHistoryController.getAllMedicalHistories);
router.get('/:id', PatientMedicalHistoryController.getMedicalHistoryById);
router.get('/patient/:patientId', PatientMedicalHistoryController.getMedicalHistoryByPatientId);
router.post('/', PatientMedicalHistoryController.createMedicalHistory);
router.put('/:id', PatientMedicalHistoryController.updateMedicalHistory);
router.delete('/:id', PatientMedicalHistoryController.deleteMedicalHistory);

module.exports = router;
