const express = require('express');
const router = express.Router();
const CalibrationLogController = require('../controllers/CalibrationLogController');

router.get('/due', CalibrationLogController.due);
router.post('/', CalibrationLogController.create);
router.get('/', CalibrationLogController.list);
router.put('/:id', CalibrationLogController.update);
router.delete('/:id', CalibrationLogController.remove);

module.exports = router;
