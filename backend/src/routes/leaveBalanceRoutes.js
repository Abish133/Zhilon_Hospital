const express = require('express');
const router = express.Router();
const LeaveBalanceController = require('../controllers/LeaveBalanceController');

router.get('/', LeaveBalanceController.getAll);
router.post('/', LeaveBalanceController.allocate);

module.exports = router;
