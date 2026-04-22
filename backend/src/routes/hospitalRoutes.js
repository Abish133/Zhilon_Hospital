const express = require('express');
const HospitalController = require('../controllers/HospitalController');
const router = express.Router();

router.post('/register', HospitalController.registerHospital);
router.get('/', HospitalController.getAllHospitals);
router.get('/:id', HospitalController.getHospitalById);
router.put('/:id', HospitalController.updateHospital);
router.delete('/:id', HospitalController.deleteHospital);

module.exports = router;