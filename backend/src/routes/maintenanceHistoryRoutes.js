const express = require('express');
const router = express.Router();
const MaintenanceHistoryController = require('../controllers/MaintenanceHistoryController');

router.post('/', MaintenanceHistoryController.create);
router.get('/', MaintenanceHistoryController.getAll);
router.get('/:id', MaintenanceHistoryController.getById);
router.put('/:id', MaintenanceHistoryController.update);
router.delete('/:id', MaintenanceHistoryController.delete);

module.exports = router;
