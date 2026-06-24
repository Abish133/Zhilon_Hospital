const express = require('express');
const router = express.Router();
const CounterBillingController = require('../controllers/CounterBillingController');

// Common "counter" billing — pick any master item, dispense + bill in one go.
router.get('/catalog', CounterBillingController.getCatalog);
router.post('/', CounterBillingController.createCounterBill);

module.exports = router;
