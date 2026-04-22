const express = require('express');
const router = express.Router();
const LabResultController = require('../controllers/LabResultController');

router.post('/', LabResultController.createLabResult);
router.get('/', LabResultController.getAllLabResults);
router.get('/:id', LabResultController.getLabResultById);
router.put('/:id', LabResultController.updateLabResult);
router.delete('/:id', LabResultController.deleteLabResult);

module.exports = router;
