const express = require('express');
const router = express.Router();
const BillingEpisodeController = require('../controllers/BillingEpisodeController');

router.get('/unbilled', BillingEpisodeController.getUnbilled);
router.post('/', BillingEpisodeController.create);
router.get('/', BillingEpisodeController.getAll);
router.get('/:id', BillingEpisodeController.getById);
router.put('/:id', BillingEpisodeController.update);
router.delete('/:id', BillingEpisodeController.delete);

module.exports = router;
