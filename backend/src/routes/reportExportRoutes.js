const express = require('express');
const router = express.Router();
const ReportExportController = require('../controllers/ReportExportController');

router.get('/:type', ReportExportController.export);

module.exports = router;
