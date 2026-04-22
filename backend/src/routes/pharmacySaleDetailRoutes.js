const express = require('express');
const router = express.Router();
const PharmacySaleDetailController = require('../controllers/PharmacySaleDetailController');

router.post('/', PharmacySaleDetailController.createSaleDetail);
router.get('/', PharmacySaleDetailController.getAllSaleDetails);
router.get('/:id', PharmacySaleDetailController.getSaleDetailById);
router.put('/:id', PharmacySaleDetailController.updateSaleDetail);
router.delete('/:id', PharmacySaleDetailController.deleteSaleDetail);

module.exports = router;
