const express = require('express');
const router = express.Router();
const RefundController = require('../controllers/RefundController');

router.post('/', RefundController.create);
router.get('/', RefundController.getAll);
router.get('/:id', RefundController.getById);
router.put('/:id', RefundController.update);
router.delete('/:id', RefundController.delete);

module.exports = router;
