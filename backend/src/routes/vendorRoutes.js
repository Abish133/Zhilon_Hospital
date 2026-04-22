const express = require('express');
const VendorController = require('../controllers/VendorController');
const router = express.Router();

router.post('/', VendorController.createVendor);
router.get('/', VendorController.getAllVendors);
router.get('/:id', VendorController.getVendorById);
router.put('/:id', VendorController.updateVendor);
router.delete('/:id', VendorController.deleteVendor);

module.exports = router;
