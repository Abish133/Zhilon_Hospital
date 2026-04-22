const express = require('express');
const MedicineCategoryController = require('../controllers/MedicineCategoryController');
const router = express.Router();
 
router.get('/', MedicineCategoryController.getAllCategories);
router.get('/:id', MedicineCategoryController.getCategoryById);
router.post('/', MedicineCategoryController.createCategory);
router.put('/:id', MedicineCategoryController.updateCategory);
router.delete('/:id', MedicineCategoryController.deleteCategory);
 
module.exports = router;
 