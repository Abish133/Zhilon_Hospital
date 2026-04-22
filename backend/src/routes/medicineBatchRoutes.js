const express = require('express');
const MedicineBatchController = require('../controllers/MedicineBatchController');
const router = express.Router();
 
router.get('/', MedicineBatchController.getAllMedicineBatches);
router.get('/:id', MedicineBatchController.getMedicineBatchById);
router.post('/', MedicineBatchController.createMedicineBatch);
router.put('/:id', MedicineBatchController.updateMedicineBatch);
router.delete('/:id', MedicineBatchController.deleteMedicineBatch);
 
module.exports = router;
 