const express = require('express');
const IpdDischargeNursingSummaryController = require('../controllers/IpdDischargeNursingSummaryController');
const router = express.Router();

router.post('/', IpdDischargeNursingSummaryController.createNursingSummary);
router.get('/', IpdDischargeNursingSummaryController.getAllNursingSummaries);
router.get('/:id', IpdDischargeNursingSummaryController.getNursingSummaryById);
router.put('/:id', IpdDischargeNursingSummaryController.updateNursingSummary);
router.delete('/:id', IpdDischargeNursingSummaryController.deleteNursingSummary);

module.exports = router;
