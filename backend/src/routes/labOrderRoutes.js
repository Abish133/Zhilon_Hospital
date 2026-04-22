const express = require('express');
const router = express.Router();
const LabOrderController = require('../controllers/LabOrderController');

router.post('/', LabOrderController.createLabOrder);
router.get('/', LabOrderController.getAllLabOrders);
router.get('/patient/:patientId', LabOrderController.getLabOrdersByPatientId);
router.get('/:id', LabOrderController.getLabOrderById);
router.put('/:id', LabOrderController.updateLabOrder);
router.delete('/:id', LabOrderController.deleteLabOrder);

module.exports = router;