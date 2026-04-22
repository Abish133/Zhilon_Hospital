const express = require('express');
const router = express.Router();
const MaintenanceRequestController = require('../controllers/MaintenanceRequestController');

router.post('/', MaintenanceRequestController.create);
router.get('/', MaintenanceRequestController.getAll);
router.get('/:id', MaintenanceRequestController.getById);
router.put('/:id', MaintenanceRequestController.update);
router.delete('/:id', MaintenanceRequestController.delete);

module.exports = router;
