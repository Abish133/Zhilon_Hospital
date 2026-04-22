const express = require('express');
const OtIntraOperativeController = require('../controllers/OtIntraOperativeController');
const router = express.Router();
 
router.get('/', OtIntraOperativeController.getAllOtIntraOperatives);
router.get('/:id', OtIntraOperativeController.getOtIntraOperativeById);
router.post('/', OtIntraOperativeController.createOtIntraOperative);
router.put('/:id', OtIntraOperativeController.updateOtIntraOperative);
router.delete('/:id', OtIntraOperativeController.deleteOtIntraOperative);
 
module.exports = router;
 