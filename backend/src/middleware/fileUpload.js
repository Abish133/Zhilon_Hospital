const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/patient-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, PDFs, and common document types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // Check for double extensions (e.g., file.exe.pdf)
  const hasDoubleExtension = file.originalname.split('.').length > 2;
  if (hasDoubleExtension) {
    return cb(new Error('Files with multiple extensions are not allowed for security reasons'));
  }

  // Validate MIME type matches extension
  const mimeTypeMap = {
    '.jpg': ['image/jpeg', 'image/jpg'],
    '.jpeg': ['image/jpeg', 'image/jpg'],
    '.png': ['image/png'],
    '.gif': ['image/gif'],
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.txt': ['text/plain']
  };

  const fileExt = path.extname(file.originalname).toLowerCase();
  const expectedMimes = mimeTypeMap[fileExt];
  
  if (expectedMimes && !expectedMimes.includes(file.mimetype)) {
    return cb(new Error(`MIME type mismatch: expected ${expectedMimes.join(' or ')}, got ${file.mimetype}`));
  }

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image, PDF, document, and text files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;

