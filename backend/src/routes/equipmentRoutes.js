const express = require('express');
const router = express.Router();
const EquipmentController = require('../controllers/EquipmentController');

router.post('/', EquipmentController.createEquipment);
router.get('/', EquipmentController.getAllEquipment);
router.get('/:id', EquipmentController.getEquipmentById);
router.put('/:id', EquipmentController.updateEquipment);
router.delete('/:id', EquipmentController.deleteEquipment);

module.exports = router;
