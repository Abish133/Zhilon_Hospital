const express = require('express');
const router = express.Router();
const PharmacySaleController = require('../controllers/PharmacySaleController');

// POST / creation is disabled in favor of the dispense engine
// router.post('/', PharmacySaleController.createSale);
router.get('/', PharmacySaleController.getAllSales);
router.get('/:id', PharmacySaleController.getSaleById);
router.put('/:id', PharmacySaleController.updateSale);
router.delete('/:id', PharmacySaleController.deleteSale);

module.exports = router;
