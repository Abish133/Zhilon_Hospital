const express = require('express');
const router = express.Router();
const BillController = require('../controllers/BillController');

router.post('/generate', BillController.generateBill);
router.get('/admission/:admissionId', BillController.getByAdmissionId);
router.get('/episode/:episodeId', BillController.getByEpisodeId);
router.get('/pending', BillController.getPendingBills);
router.get('/summary', BillController.getBillingSummary);
router.get('/:id/charges', BillController.getBillWithCharges);
router.post('/', BillController.create);
router.get('/', BillController.getAll);
router.get('/:id', BillController.getById);
router.put('/:id', BillController.update);
router.delete('/:id', BillController.delete);

module.exports = router;
