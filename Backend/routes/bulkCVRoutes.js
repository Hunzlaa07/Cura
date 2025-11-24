const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require("../middlewares/authMiddleware");
const bulkCVController = require('../controllers/bulkCVController');

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 100 }, // 50MB per file, max 100 files
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT allowed.'));
    }
  }
});

// Routes
router.post(
  '/upload',
  authMiddleware,
  upload.array('files', 100),
  bulkCVController.uploadCVsLocal
);

router.get(
  '/status/:bulkJobId',
  authMiddleware,
  bulkCVController.getBulkJobStatus
);

router.get(
  '/export/:bulkJobId',
  authMiddleware,
  bulkCVController.exportResults
);

module.exports = router;