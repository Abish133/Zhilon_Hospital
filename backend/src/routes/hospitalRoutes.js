const express = require('express');
const HospitalController = require('../controllers/HospitalController');
const logoUpload = require('../middleware/logoUpload');
const router = express.Router();

router.post('/register', HospitalController.registerHospital);
router.get('/', HospitalController.getAllHospitals);
router.get('/:id', HospitalController.getHospitalById);
router.put('/:id', HospitalController.updateHospital);
router.post('/:id/logo', logoUpload.single('logo'), HospitalController.uploadLogo);
router.delete('/:id', HospitalController.deleteHospital);

module.exports = router;