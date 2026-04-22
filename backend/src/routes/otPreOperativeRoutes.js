const express = require('express');
const OtPreOperativeController = require('../controllers/OtPreOperativeController');
const router = express.Router();
 
router.get('/', OtPreOperativeController.getAllOtPreOperatives);
router.get('/:id', OtPreOperativeController.getOtPreOperativeById);
router.post('/', OtPreOperativeController.createOtPreOperative);
router.put('/:id', OtPreOperativeController.updateOtPreOperative);
router.delete('/:id', OtPreOperativeController.deleteOtPreOperative);
 
module.exports = router;
 