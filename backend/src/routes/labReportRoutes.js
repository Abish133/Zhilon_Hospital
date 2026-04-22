const express = require('express');
const router = express.Router();
const LabReportController = require('../controllers/LabReportController');

router.post('/', LabReportController.createLabReport);
router.get('/', LabReportController.getAllLabReports);
router.get('/:id', LabReportController.getLabReportById);
router.put('/:id', LabReportController.updateLabReport);
router.delete('/:id', LabReportController.deleteLabReport);

module.exports = router;
