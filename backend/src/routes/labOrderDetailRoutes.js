const express = require('express');
const router = express.Router();
const LabOrderDetailController = require('../controllers/LabOrderDetailController');

router.post('/', LabOrderDetailController.createLabOrderDetail);
router.get('/', LabOrderDetailController.getAllLabOrderDetails);
router.get('/:id', LabOrderDetailController.getLabOrderDetailById);
router.put('/:id', LabOrderDetailController.updateLabOrderDetail);
router.delete('/:id', LabOrderDetailController.deleteLabOrderDetail);

module.exports = router;
