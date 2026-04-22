const express = require('express');
const PatientDocumentController = require('../controllers/PatientDocumentController');
const upload = require('../middleware/fileUpload');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Upload document
router.post('/upload', authenticate, upload.single('file'), PatientDocumentController.uploadDocument);

// Get documents by patient
router.get('/patient/:patientId', authenticate, PatientDocumentController.getDocumentsByPatient);

// Download document
router.get('/:id/download', authenticate, PatientDocumentController.downloadDocument);

// Delete document
router.delete('/:id', authenticate, PatientDocumentController.deleteDocument);

module.exports = router;

