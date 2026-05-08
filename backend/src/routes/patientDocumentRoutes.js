const express = require('express');
const PatientDocumentController = require('../controllers/PatientDocumentController');
const upload = require('../middleware/fileUpload');

// Auth + RBAC are applied at the mount point in app.js (`guard('patientDocs')`),
// so we don't re-add `authenticate` here — the protect chain already runs first.
const router = express.Router();

router.post('/upload', upload.single('file'), PatientDocumentController.uploadDocument);
router.get('/patient/:patientId', PatientDocumentController.getDocumentsByPatient);
router.get('/:id/download', PatientDocumentController.downloadDocument);
router.delete('/:id', PatientDocumentController.deleteDocument);

module.exports = router;
