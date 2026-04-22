const express = require('express');
const InventoryCategoryController = require('../controllers/InventoryCategoryController');
const router = express.Router();

router.post('/', InventoryCategoryController.createCategory);
router.get('/', InventoryCategoryController.getAllCategories);
router.get('/:id', InventoryCategoryController.getCategoryById);
router.put('/:id', InventoryCategoryController.updateCategory);
router.delete('/:id', InventoryCategoryController.deleteCategory);

module.exports = router;
