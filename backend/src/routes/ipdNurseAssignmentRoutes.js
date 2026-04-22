const express = require('express');
const router = express.Router();
const IpdNurseAssignmentController = require('../controllers/IpdNurseAssignmentController');

router.post('/', IpdNurseAssignmentController.createAssignment);
router.get('/', IpdNurseAssignmentController.getAllAssignments);
router.get('/:id', IpdNurseAssignmentController.getAssignmentById);
router.put('/:id', IpdNurseAssignmentController.updateAssignment);
router.delete('/:id', IpdNurseAssignmentController.deleteAssignment);

module.exports = router;
