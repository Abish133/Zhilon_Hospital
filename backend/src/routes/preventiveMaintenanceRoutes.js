const express = require('express');
const router = express.Router();
const PreventiveMaintenanceController = require('../controllers/PreventiveMaintenanceController');

router.post('/', PreventiveMaintenanceController.createPM);
router.get('/', PreventiveMaintenanceController.getAllPM);
router.get('/:id', PreventiveMaintenanceController.getPMById);
router.put('/:id', PreventiveMaintenanceController.updatePM);
router.delete('/:id', PreventiveMaintenanceController.deletePM);

module.exports = router;
