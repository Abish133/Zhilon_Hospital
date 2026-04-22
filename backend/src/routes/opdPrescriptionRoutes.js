const express = require('express');
const router = express.Router();
const OpdPrescriptionController = require('../controllers/OpdPrescriptionController');

router.post('/', OpdPrescriptionController.createPrescription);
router.get('/', OpdPrescriptionController.getAllPrescriptions);
router.get('/by-visit/:visitId/pdf', OpdPrescriptionController.generatePDF);
router.get('/patient/:patientId', OpdPrescriptionController.getPrescriptionsByPatientId);
router.get('/:id/pdf', OpdPrescriptionController.generatePDF);
router.get('/:id', OpdPrescriptionController.getPrescriptionById);
router.put('/:id', OpdPrescriptionController.updatePrescription);
router.delete('/:id', OpdPrescriptionController.deletePrescription);

module.exports = router;