const express = require('express');
const MedicineController = require('../controllers/MedicineController');
const router = express.Router();
 
router.get('/', MedicineController.getAllMedicines);
router.get('/:id', MedicineController.getMedicineById);
router.post('/', MedicineController.createMedicine);
router.put('/:id', MedicineController.updateMedicine);
router.delete('/:id', MedicineController.deleteMedicine);
 
module.exports = router;
 