const express = require('express');
const router = express.Router();
const caseStudyAssessmentController = require('../controllers/caseStudyAssessmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const languageMiddleware = require('../middlewares/languageMiddleware');

// Public routes (no auth required)
router.post('/send-otp', caseStudyAssessmentController.sendOTP);
router.post('/verify-otp', caseStudyAssessmentController.verifyOTP);

// Protected routes (recruiter only)
router.get('/:assessmentId/applications', authMiddleware, languageMiddleware, caseStudyAssessmentController.getApplications);
router.put('/:assessmentId/close', authMiddleware, caseStudyAssessmentController.closeAssessment);
router.delete('/:assessmentId', authMiddleware, caseStudyAssessmentController.deleteAssessment);

module.exports = router;

