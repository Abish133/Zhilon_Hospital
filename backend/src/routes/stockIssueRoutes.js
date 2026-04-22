const express = require('express');
const router = express.Router();
const StockIssueController = require('../controllers/StockIssueController');

router.post('/', StockIssueController.createStockIssue);
router.get('/', StockIssueController.getAllStockIssues);
router.get('/:id', StockIssueController.getStockIssueById);
router.put('/:id', StockIssueController.updateStockIssue);
router.delete('/:id', StockIssueController.deleteStockIssue);

module.exports = router;
