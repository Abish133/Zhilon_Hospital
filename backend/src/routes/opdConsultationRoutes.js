const express = require('express');
const router = express.Router();
const OpdConsultationController = require('../controllers/OpdConsultationController');

router.post('/', OpdConsultationController.createConsultation);
router.get('/', OpdConsultationController.getAllConsultations);
router.get('/patient/:patientId', OpdConsultationController.getConsultationsByPatientId);
router.get('/:id', OpdConsultationController.getConsultationById);
router.put('/:id', OpdConsultationController.updateConsultation);
router.delete('/:id', OpdConsultationController.deleteConsultation);

module.exports = router;