const express = require('express');
const router = express.Router();
const AlertsController = require('../controllers/AlertsController');

router.get('/low-stock', AlertsController.lowStock);
router.get('/expiring', AlertsController.expiring);
router.get('/expired', AlertsController.expired);
router.get('/summary', AlertsController.summary);

module.exports = router;
