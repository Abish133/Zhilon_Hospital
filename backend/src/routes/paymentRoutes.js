const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

router.post('/process-bill', PaymentController.processBillPayment);
router.get('/summary', PaymentController.getPaymentSummary);
router.post('/', PaymentController.create);
router.get('/', PaymentController.getAll);
router.get('/:id', PaymentController.getById);
router.put('/:id', PaymentController.update);
router.delete('/:id', PaymentController.delete);

module.exports = router;
