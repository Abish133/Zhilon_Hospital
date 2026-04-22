const express = require('express');
const router = express.Router();
const ipdVitalsController = require('../controllers/ipdVitalsController');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, ipdVitalsController.recordVitals);
router.get('/admission/:admission_id', authenticate, ipdVitalsController.getVitalsByAdmission);
router.get('/admission/:admission_id/date/:date', authenticate, ipdVitalsController.getVitalsByDate);

module.exports = router;
