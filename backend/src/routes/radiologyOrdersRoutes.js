const express = require('express');
const RadiologyOrdersController = require('../controllers/RadiologyOrdersController');
const router = express.Router();

router.get('/', RadiologyOrdersController.getAllRadiologyOrders);
router.get('/patient/:patientId', RadiologyOrdersController.getRadiologyOrdersByPatientId);
router.get('/:id', RadiologyOrdersController.getRadiologyOrderById);
router.post('/', RadiologyOrdersController.createRadiologyOrder);
router.put('/:id', RadiologyOrdersController.updateRadiologyOrder);
router.delete('/:id', RadiologyOrdersController.deleteRadiologyOrder);

module.exports = router;