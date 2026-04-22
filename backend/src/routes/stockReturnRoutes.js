const express = require('express');
const router = express.Router();
const StockReturnController = require('../controllers/StockReturnController');

router.post('/', StockReturnController.createStockReturn);
router.get('/', StockReturnController.getAllStockReturns);
router.get('/:id', StockReturnController.getStockReturnById);
router.put('/:id', StockReturnController.updateStockReturn);
router.delete('/:id', StockReturnController.deleteStockReturn);

module.exports = router;
