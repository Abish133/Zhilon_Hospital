const express = require('express');
const PatientController = require('../controllers/PatientController');
const router = express.Router();
 
router.get('/', PatientController.getAllPatients);
router.get('/search', PatientController.searchPatients);
router.get('/:id/timeline', PatientController.getPatientTimeline);
router.get('/:id', PatientController.getPatientById);
router.post('/', PatientController.createPatient);
router.put('/:id', PatientController.updatePatient);
router.delete('/:id', PatientController.deletePatient);
 
module.exports = router;
 