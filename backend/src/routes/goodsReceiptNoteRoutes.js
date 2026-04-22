const express = require('express');
const GoodsReceiptNoteController = require('../controllers/GoodsReceiptNoteController');
const router = express.Router();

router.post('/', GoodsReceiptNoteController.createGRN);
router.get('/', GoodsReceiptNoteController.getAllGRNs);
router.get('/:id', GoodsReceiptNoteController.getGRNById);
router.put('/:id', GoodsReceiptNoteController.updateGRN);
router.delete('/:id', GoodsReceiptNoteController.deleteGRN);

module.exports = router;
