const express = require('express');
const router = express.Router();
const ChargeMasterController = require('../controllers/ChargeMasterController');

router.post('/', ChargeMasterController.create);
router.get('/', ChargeMasterController.getAll);
router.get('/:id', ChargeMasterController.getById);
router.put('/:id', ChargeMasterController.update);
router.delete('/:id', ChargeMasterController.delete);

module.exports = router;
