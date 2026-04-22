const express = require('express');
const router = express.Router();
const PaymentAdvanceController = require('../controllers/PaymentAdvanceController');

router.post('/', PaymentAdvanceController.create);
router.get('/', PaymentAdvanceController.getAll);
router.get('/:id', PaymentAdvanceController.getById);
router.put('/:id', PaymentAdvanceController.update);
router.delete('/:id', PaymentAdvanceController.delete);

module.exports = router;
