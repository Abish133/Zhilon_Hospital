const express = require('express');
const router = express.Router();
const ipdMedicationController = require('../controllers/ipdMedicationController');
const authenticate = require('../middleware/auth');

router.post('/medications', authenticate, ipdMedicationController.createMedication);
router.get('/medications/admission/:admissionId', authenticate, ipdMedicationController.getMedicationsByAdmission);
router.put('/medications/:medicationId/status', authenticate, ipdMedicationController.updateMedicationStatus);
router.post('/medications/administer', authenticate, ipdMedicationController.administerMedication);
router.get('/medications/administration/:admissionId', authenticate, ipdMedicationController.getAdministrationRecords);

module.exports = router;
