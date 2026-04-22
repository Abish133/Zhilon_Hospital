const express = require('express');
const PurchaseOrderController = require('../controllers/PurchaseOrderController');
const router = express.Router();

router.post('/', PurchaseOrderController.createPurchaseOrder);
router.get('/', PurchaseOrderController.getAllPurchaseOrders);
router.get('/:id', PurchaseOrderController.getPurchaseOrderById);
router.put('/:id', PurchaseOrderController.updatePurchaseOrder);
router.put('/:id/approve', PurchaseOrderController.approvePurchaseOrder);
router.delete('/:id', PurchaseOrderController.deletePurchaseOrder);
router.post('/auto-reorder/trigger', PurchaseOrderController.triggerAutoReorder);
router.get('/stock-levels/check', PurchaseOrderController.checkStockLevels);

module.exports = router;
