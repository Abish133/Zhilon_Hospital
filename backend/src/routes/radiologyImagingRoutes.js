const express = require('express');
const { RadiologyImagingController, upload } = require('../controllers/RadiologyImagingController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Image upload endpoint
router.post('/upload', authMiddleware, upload.single('image'), RadiologyImagingController.uploadImage);

// Download image
router.get('/download/:id', authMiddleware, RadiologyImagingController.downloadImage);

// Standard CRUD endpoints
router.get('/', RadiologyImagingController.getAllRadiologyImaging);
router.get('/:id', RadiologyImagingController.getRadiologyImagingById);
router.post('/', authMiddleware, RadiologyImagingController.createRadiologyImaging);
router.put('/:id', authMiddleware, RadiologyImagingController.updateRadiologyImaging);
router.delete('/:id', authMiddleware, RadiologyImagingController.deleteRadiologyImaging);

module.exports = router;