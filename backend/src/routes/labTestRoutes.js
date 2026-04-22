const express = require('express');
const router = express.Router();
const LabTestController = require('../controllers/LabTestController');

router.post('/', LabTestController.createLabTest);
router.get('/', LabTestController.getAllLabTests);
router.get('/:id', LabTestController.getLabTestById);
router.put('/:id', LabTestController.updateLabTest);
router.delete('/:id', LabTestController.deleteLabTest);

module.exports = router;
