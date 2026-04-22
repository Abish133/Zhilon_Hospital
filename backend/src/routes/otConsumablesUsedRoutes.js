const express = require('express');
const OtConsumablesUsedController = require('../controllers/OtConsumablesUsedController');
const router = express.Router();

router.get('/', OtConsumablesUsedController.getAllOtConsumablesUsed);
router.get('/:id', OtConsumablesUsedController.getOtConsumablesUsedById);
router.post('/', OtConsumablesUsedController.createOtConsumablesUsed);
router.put('/:id', OtConsumablesUsedController.updateOtConsumablesUsed);
router.delete('/:id', OtConsumablesUsedController.deleteOtConsumablesUsed);

module.exports = router;