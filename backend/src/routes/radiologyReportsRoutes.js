const express = require('express');
const RadiologyReportsController = require('../controllers/RadiologyReportsController');
const router = express.Router();

router.get('/', RadiologyReportsController.getAllRadiologyReports);
router.get('/:id', RadiologyReportsController.getRadiologyReportById);
router.post('/', RadiologyReportsController.createRadiologyReport);
router.put('/:id', RadiologyReportsController.updateRadiologyReport);
router.delete('/:id', RadiologyReportsController.deleteRadiologyReport);

module.exports = router;
