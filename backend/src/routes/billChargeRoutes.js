const express = require('express');
const router = express.Router();
const BillChargeController = require('../controllers/BillChargeController');

router.post('/from-master', BillChargeController.addChargeFromMaster);
router.get('/episode/:episode_id', BillChargeController.getChargesByEpisode);
router.post('/', BillChargeController.create);
router.get('/', BillChargeController.getAll);
router.get('/:id', BillChargeController.getById);
router.put('/:id', BillChargeController.update);
router.delete('/:id', BillChargeController.delete);

module.exports = router;
