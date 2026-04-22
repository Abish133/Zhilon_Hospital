const express = require('express');
const OpdVitalController = require('../controllers/OpdVitalController');
const router = express.Router();

router.post('/', OpdVitalController.createVital);
router.get('/', OpdVitalController.getAllVitals);
router.get('/patient/:patientId', OpdVitalController.getVitalsByPatientId);
router.get('/visit/:visitId', OpdVitalController.getVitalsByVisitId);
router.get('/:id', OpdVitalController.getVitalById);
router.put('/:id', OpdVitalController.updateVital);
router.delete('/:id', OpdVitalController.deleteVital);

module.exports = router;