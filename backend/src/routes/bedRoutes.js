const express = require('express');
const router = express.Router();
const BedController = require('../controllers/BedController');

router.post('/', BedController.createBed);
router.get('/', BedController.getAllBeds);
router.get('/:id', BedController.getBedById);
router.put('/:id', BedController.updateBed);
router.delete('/:id', BedController.deleteBed);

module.exports = router;
