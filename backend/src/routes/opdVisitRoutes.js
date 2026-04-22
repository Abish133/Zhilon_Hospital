const express = require('express');
const OpdVisitController = require('../controllers/OpdVisitController');
const router = express.Router();

router.post('/', OpdVisitController.createVisit);
router.get('/', OpdVisitController.getAllVisits);
router.get('/:id', OpdVisitController.getVisitById);
router.put('/:id', OpdVisitController.updateVisit);
router.delete('/:id', OpdVisitController.deleteVisit);

module.exports = router;
