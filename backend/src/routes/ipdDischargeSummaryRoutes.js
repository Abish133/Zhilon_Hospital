const express = require('express');
const IpdDischargeSummaryController = require('../controllers/IpdDischargeSummaryController');
const router = express.Router();

router.post('/', IpdDischargeSummaryController.createDischargeSummary);
router.get('/', IpdDischargeSummaryController.getAllDischargeSummaries);
router.get('/:id', IpdDischargeSummaryController.getDischargeSummaryById);
router.put('/:id', IpdDischargeSummaryController.updateDischargeSummary);
router.delete('/:id', IpdDischargeSummaryController.deleteDischargeSummary);

module.exports = router;
