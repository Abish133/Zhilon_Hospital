const express = require('express');
const InventoryItemController = require('../controllers/InventoryItemController');
const router = express.Router();

router.post('/', InventoryItemController.createItem);
router.get('/', InventoryItemController.getAllItems);
router.get('/:id', InventoryItemController.getItemById);
router.put('/:id', InventoryItemController.updateItem);
router.delete('/:id', InventoryItemController.deleteItem);

module.exports = router;
