const express = require('express');
const IpdProgressNoteController = require('../controllers/IpdProgressNoteController');
const router = express.Router();

router.post('/', IpdProgressNoteController.createProgressNote);
router.get('/', IpdProgressNoteController.getAllProgressNotes);
router.get('/:id', IpdProgressNoteController.getProgressNoteById);
router.put('/:id', IpdProgressNoteController.updateProgressNote);
router.delete('/:id', IpdProgressNoteController.deleteProgressNote);

module.exports = router;
