const express = require('express');
const router = express.Router();
const PackageController = require('../controllers/PackageController');

router.post('/', PackageController.create);
router.get('/', PackageController.getAll);
router.get('/:id', PackageController.getById);
router.put('/:id', PackageController.update);
router.delete('/:id', PackageController.delete);

module.exports = router;
