const express = require('express');
const router = express.Router();
const PatientMedicationHistoryController = require('../controllers/PatientMedicationHistoryController');

router.post('/', PatientMedicationHistoryController.create);
router.get('/', PatientMedicationHistoryController.getAll);
router.get('/:id', PatientMedicationHistoryController.getById);
router.get('/patient/:patientId', PatientMedicationHistoryController.getByPatientId);
router.put('/:id', PatientMedicationHistoryController.update);
router.delete('/:id', PatientMedicationHistoryController.delete);

module.exports = router;
