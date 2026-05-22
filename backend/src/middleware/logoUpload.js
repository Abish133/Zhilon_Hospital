const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Hospital logos live in their own folder so they can be served publicly
// (they are non-sensitive branding) without exposing patient documents.
const logosDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const id = req.params.id || 'h';
    cb(null, `logo-${id}-${Date.now()}${ext}`);
  }
});

// Restrict to PNG/JPG only: these are the formats the PDF generator (PDFKit)
// can actually render, so a logo that uploads will also appear on documents.
const fileFilter = (req, file, cb) => {
  if (file.originalname.split('.').length > 2) {
    return cb(new Error('Files with multiple extensions are not allowed'));
  }
  const ext = path.extname(file.originalname).toLowerCase();
  const extOk = ['.png', '.jpg', '.jpeg'].includes(ext);
  const mimeOk = ['image/png', 'image/jpeg', 'image/jpg'].includes(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Logo must be a PNG or JPG image'));
};

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter
});
