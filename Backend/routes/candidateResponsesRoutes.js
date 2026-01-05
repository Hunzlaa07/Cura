// routes/candidateResponsesRoutes.js
// Routes for candidate response submission and retrieval

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const candidateResponsesController = require('../controllers/candidateResponsesController');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/responses/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// ============================================
// RESPONSE SUBMISSION ROUTES
// ============================================

// Submit single response
router.post('/submit', candidateResponsesController.submitResponse);

// Submit multiple responses
router.post('/submit/bulk', candidateResponsesController.submitBulkResponses);

// Submit coding response
router.post('/submit/coding', candidateResponsesController.submitCodingResponse);

// Submit SQL response
router.post('/submit/sql', candidateResponsesController.submitSQLResponse);

// Submit spreadsheet response
router.post('/submit/spreadsheet', candidateResponsesController.submitSpreadsheetResponse);

// Submit video response
router.post('/submit/video', upload.single('video'), candidateResponsesController.submitVideoResponse);

// ============================================
// GET RESPONSES ROUTES
// ============================================

// Get responses by application
router.get('/', authMiddleware, candidateResponsesController.getResponsesByApplication);

// Get single response
router.get('/:id', authMiddleware, candidateResponsesController.getResponseById);

// ============================================
// SCORING ROUTES
// ============================================

// Manually score a response
router.put('/:id/score', authMiddleware, candidateResponsesController.scoreResponse);

// Trigger AI evaluation for open-ended responses
router.post('/evaluate/ai', authMiddleware, candidateResponsesController.triggerAIEvaluation);

// Get overall assessment results
router.get('/results/summary', authMiddleware, candidateResponsesController.getAssessmentResults);

module.exports = router;
