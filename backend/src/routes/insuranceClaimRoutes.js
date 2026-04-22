const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const InsuranceClaimController = require('../controllers/InsuranceClaimController');

router.post('/', authMiddleware, InsuranceClaimController.create);
router.get('/', authMiddleware, InsuranceClaimController.getAll);
router.get('/stats', authMiddleware, InsuranceClaimController.getClaimStats);
router.get('/:id', authMiddleware, InsuranceClaimController.getById);
router.get('/patient/:patient_id', authMiddleware, InsuranceClaimController.getByPatient);
router.post('/:id/submit', authMiddleware, InsuranceClaimController.submitClaim);
router.post('/:id/approve', authMiddleware, InsuranceClaimController.approveClaim);
router.post('/:id/reject', authMiddleware, InsuranceClaimController.rejectClaim);
router.post('/:id/payment', authMiddleware, InsuranceClaimController.processPayment);
router.get('/:id/track', authMiddleware, InsuranceClaimController.trackClaim);

module.exports = router;
