const express = require('express');
const router = express.Router();
const VendorReturnController = require('../controllers/VendorReturnController');

router.post('/', VendorReturnController.createVendorReturn);
router.get('/', VendorReturnController.getAllVendorReturns);
router.get('/:id', VendorReturnController.getVendorReturnById);
router.put('/:id', VendorReturnController.updateVendorReturn);
router.put('/:id/approve', VendorReturnController.approveVendorReturn);
router.put('/:id/complete', VendorReturnController.completeVendorReturn);
router.put('/:id/reject', VendorReturnController.rejectVendorReturn);
router.delete('/:id', VendorReturnController.deleteVendorReturn);

module.exports = router;
