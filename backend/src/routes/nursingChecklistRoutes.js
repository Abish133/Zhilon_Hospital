const express = require('express');
const router = express.Router();
const NursingChecklistController = require('../controllers/NursingChecklistController');

router.get('/template', NursingChecklistController.template);
router.post('/', NursingChecklistController.create);
router.get('/', NursingChecklistController.list);
router.put('/:id', NursingChecklistController.update);
router.delete('/:id', NursingChecklistController.remove);

module.exports = router;
