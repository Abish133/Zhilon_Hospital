const express = require('express');
const IpdAdmissionController = require('../controllers/IpdAdmissionController');
const router = express.Router();

router.post('/', IpdAdmissionController.createAdmission);
router.get('/', IpdAdmissionController.getAllAdmissions);
router.get('/:id', IpdAdmissionController.getAdmissionById);
router.put('/:id', IpdAdmissionController.updateAdmission);
router.post('/transfer-bed', IpdAdmissionController.transferBed);
router.delete('/:id', IpdAdmissionController.deleteAdmission);

module.exports = router;
