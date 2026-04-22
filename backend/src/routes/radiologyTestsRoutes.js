const express = require('express');
const RadiologyTestsController = require('../controllers/RadiologyTestsController');
const router = express.Router();

router.get('/', RadiologyTestsController.getAllRadiologyTests);
router.get('/:id', RadiologyTestsController.getRadiologyTestById);
router.post('/', RadiologyTestsController.createRadiologyTest);
router.put('/:id', RadiologyTestsController.updateRadiologyTest);
router.delete('/:id', RadiologyTestsController.deleteRadiologyTest);

module.exports = router;