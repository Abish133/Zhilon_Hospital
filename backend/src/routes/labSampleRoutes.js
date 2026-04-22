const express = require('express');
const router = express.Router();
const LabSampleController = require('../controllers/LabSampleController');

router.post('/', LabSampleController.createLabSample);
router.get('/', LabSampleController.getAllLabSamples);
router.get('/:id/barcode', LabSampleController.getBarcodeImage);
router.get('/:id', LabSampleController.getLabSampleById);
router.put('/:id', LabSampleController.updateLabSample);
router.delete('/:id', LabSampleController.deleteLabSample);

module.exports = router;
