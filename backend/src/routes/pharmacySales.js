const express = require('express');
const router = express.Router();
const PharmacySaleController = require('../controllers/PharmacySaleController');

router.post('/dispense', PharmacySaleController.dispenseMedicine);
router.post('/return-ipd', PharmacySaleController.returnIpdMedicine);
router.get('/', PharmacySaleController.getAllSales);
router.get('/:id', PharmacySaleController.getSaleById);

module.exports = router;
