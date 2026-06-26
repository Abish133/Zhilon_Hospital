const express = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/auth');
const { authorize, enforceHospitalScope } = require('../middleware/rbac');
const { authLimiter } = require('../middleware/rateLimiter');
const auditLogger = require('../middleware/auditLogger');
const router = express.Router();

router.post('/register', authLimiter, auditLogger('CREATE', 'User'), AuthController.register);
router.post('/login', authLimiter, auditLogger('LOGIN', 'User'), AuthController.login);
router.post('/forgot-password', authLimiter, auditLogger('UPDATE', 'User'), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, auditLogger('UPDATE', 'User'), AuthController.resetPassword);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, auditLogger('UPDATE', 'User'), AuthController.updateProfile);
router.post('/change-password', authMiddleware, auditLogger('UPDATE', 'User'), AuthController.changePassword);
router.get('/', authMiddleware, enforceHospitalScope, authorize('Admin', 'HR'), AuthController.getAllUsers);
router.get('/:id', authMiddleware, enforceHospitalScope, authorize('Admin', 'HR'), AuthController.getUserById);
router.put('/:id', authMiddleware, enforceHospitalScope, authorize('Admin', 'HR'), auditLogger('UPDATE', 'User'), AuthController.updateUser);
router.delete('/:id', authMiddleware, enforceHospitalScope, authorize('Admin'), auditLogger('DELETE', 'User'), AuthController.deleteUser);

module.exports = router;
