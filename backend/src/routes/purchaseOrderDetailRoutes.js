const express = require('express');
const PurchaseOrderDetailController = require('../controllers/PurchaseOrderDetailController');
const router = express.Router();

router.post('/', PurchaseOrderDetailController.createDetail);
router.get('/', PurchaseOrderDetailController.getAllDetails);
router.get('/:id', PurchaseOrderDetailController.getDetailById);
router.put('/:id', PurchaseOrderDetailController.updateDetail);
router.delete('/:id', PurchaseOrderDetailController.deleteDetail);

module.exports = router;
