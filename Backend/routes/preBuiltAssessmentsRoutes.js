const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const {
  getPreBuiltAssessments,
  getPreBuiltAssessmentById,
  getCategories,
  publishPreBuiltAssessment,
  getMyPublishedAssessments,
  saveAssessment,
  unsaveAssessment,
  getSavedAssessments,
  getAssessmentByShareToken,
  updatePublishedStatus
} = require('../controllers/preBuiltAssessmentsController');

// Public routes
router.get('/share/:token', getAssessmentByShareToken);

// Protected routes (require authentication)
router.get('/', authenticateToken, getPreBuiltAssessments);
router.get('/categories', authenticateToken, getCategories);
router.get('/saved', authenticateToken, getSavedAssessments);
router.get('/published', authenticateToken, getMyPublishedAssessments);
router.get('/:id', authenticateToken, getPreBuiltAssessmentById);

router.post('/:id/publish', authenticateToken, publishPreBuiltAssessment);
router.post('/:id/save', authenticateToken, saveAssessment);
router.delete('/:id/save', authenticateToken, unsaveAssessment);

router.patch('/published/:id/status', authenticateToken, updatePublishedStatus);

module.exports = router;
