// routes/customQuestionsRoutes.js
// Routes for custom questions management

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const customQuestionsController = require('../controllers/customQuestionsController');

// ============================================
// CUSTOM QUESTIONS ROUTES
// ============================================

// Create a new question
router.post('/', authMiddleware, customQuestionsController.createQuestion);

// Create multiple questions
router.post('/bulk', authMiddleware, customQuestionsController.createBulkQuestions);

// Get questions by template
router.get('/template/:templateId', authMiddleware, customQuestionsController.getQuestionsByTemplate);

// Get questions by case study
router.get('/case-study/:caseStudyId', authMiddleware, customQuestionsController.getQuestionsByCaseStudy);

// Get single question
router.get('/:id', authMiddleware, customQuestionsController.getQuestionById);

// Update question
router.put('/:id', authMiddleware, customQuestionsController.updateQuestion);

// Delete question
router.delete('/:id', authMiddleware, customQuestionsController.deleteQuestion);

// Reorder questions
router.put('/reorder', authMiddleware, customQuestionsController.reorderQuestions);

// Duplicate question
router.post('/:id/duplicate', authMiddleware, customQuestionsController.duplicateQuestion);

// ============================================
// SCORING RULES ROUTES
// ============================================

// Create scoring rule
router.post('/scoring-rules', authMiddleware, customQuestionsController.createScoringRule);

// Get scoring rules for question
router.get('/scoring-rules/:questionId', authMiddleware, customQuestionsController.getScoringRules);

// Update scoring rule
router.put('/scoring-rules/:id', authMiddleware, customQuestionsController.updateScoringRule);

// Delete scoring rule
router.delete('/scoring-rules/:id', authMiddleware, customQuestionsController.deleteScoringRule);

// ============================================
// QUESTION BANK ROUTES
// ============================================

// Get question bank
router.get('/bank', authMiddleware, customQuestionsController.getQuestionBank);

// Add to question bank
router.post('/bank', authMiddleware, customQuestionsController.addToQuestionBank);

// Import from question bank
router.post('/bank/import', authMiddleware, customQuestionsController.importFromQuestionBank);

module.exports = router;
