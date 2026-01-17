const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists for temporary Word files
const uploadDir = path.join(__dirname, '../uploads/word-temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for Word documents
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random.docx
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `word_${timestamp}_${random}${ext}`);
  }
});

// File filter - only allow Word documents
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.docx$/i;
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only Word documents (.docx) are allowed'), false);
  }
};

// Configure multer for Word uploads
const wordUpload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (Word files with images can be large)
  },
  fileFilter: fileFilter
});

/**
 * Cleanup temporary Word file after processing
 */
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup temp file:', error.message);
  }
};

module.exports = {
  wordUpload,
  cleanupTempFile,
  uploadDir
};

