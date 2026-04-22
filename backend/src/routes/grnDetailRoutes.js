const express = require('express');
const router = express.Router();
const GrnDetailController = require('../controllers/GrnDetailController');

router.post('/', GrnDetailController.createGrnDetail);
router.get('/', GrnDetailController.getAllGrnDetails);
router.get('/:id', GrnDetailController.getGrnDetailById);
router.put('/:id', GrnDetailController.updateGrnDetail);
router.delete('/:id', GrnDetailController.deleteGrnDetail);

module.exports = router;
