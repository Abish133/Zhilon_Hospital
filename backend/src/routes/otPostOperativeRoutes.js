const express = require('express');
const OtPostOperativeController = require('../controllers/OtPostOperativeController');
const router = express.Router();
 
router.get('/', OtPostOperativeController.getAllOtPostOperatives);
router.get('/:id', OtPostOperativeController.getOtPostOperativeById);
router.post('/', OtPostOperativeController.createOtPostOperative);
router.put('/:id', OtPostOperativeController.updateOtPostOperative);
router.delete('/:id', OtPostOperativeController.deleteOtPostOperative);
 
module.exports = router;
 