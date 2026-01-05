// routes/assessmentModulesRoutes.js
// Routes for assessment templates, modules, and anti-cheating settings

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const assessmentModulesController = require('../controllers/assessmentModulesController');

// ============================================
// ASSESSMENT TEMPLATES ROUTES
// ============================================

// Create template
router.post('/templates', authMiddleware, assessmentModulesController.createTemplate);

// Get all templates
router.get('/templates', authMiddleware, assessmentModulesController.getTemplates);

// Get single template with questions and modules
router.get('/templates/:id', authMiddleware, assessmentModulesController.getTemplateById);

// Update template
router.put('/templates/:id', authMiddleware, assessmentModulesController.updateTemplate);

// Delete template
router.delete('/templates/:id', authMiddleware, assessmentModulesController.deleteTemplate);

// Duplicate template
router.post('/templates/:id/duplicate', authMiddleware, assessmentModulesController.duplicateTemplate);

// ============================================
// ASSESSMENT MODULES ROUTES
// ============================================

// Create module
router.post('/modules', authMiddleware, assessmentModulesController.createModule);

// Get modules by template
router.get('/modules/template/:templateId', authMiddleware, assessmentModulesController.getModulesByTemplate);

// Update module
router.put('/modules/:id', authMiddleware, assessmentModulesController.updateModule);

// Delete module
router.delete('/modules/:id', authMiddleware, assessmentModulesController.deleteModule);

// Reorder modules
router.put('/modules/reorder', authMiddleware, assessmentModulesController.reorderModules);

// ============================================
// ANTI-CHEATING SETTINGS ROUTES
// ============================================

// Save anti-cheating settings
router.post('/anti-cheating', authMiddleware, assessmentModulesController.saveAntiCheatingSettings);

// Get anti-cheating settings
router.get('/anti-cheating', authMiddleware, assessmentModulesController.getAntiCheatingSettings);

// ============================================
// COGNITIVE TEST TEMPLATES ROUTES
// ============================================

// Get cognitive test templates
router.get('/cognitive-tests', authMiddleware, assessmentModulesController.getCognitiveTestTemplates);

// Create cognitive test template
router.post('/cognitive-tests', authMiddleware, assessmentModulesController.createCognitiveTestTemplate);

// ============================================
// PROCTORING ROUTES
// ============================================

// Log proctoring event (with auth to capture applicant_id)
router.post('/proctoring/log', authMiddleware, assessmentModulesController.logProctoringEvent);

// Get proctoring logs
router.get('/proctoring/logs', authMiddleware, assessmentModulesController.getProctoringLogs);

// ============================================
// SESSION MANAGEMENT ROUTES
// ============================================

// Start session
router.post('/sessions/start', authMiddleware, assessmentModulesController.startSession);

// Update session progress
router.put('/sessions/:sessionId/progress', assessmentModulesController.updateSessionProgress);

// End session
router.put('/sessions/:sessionId/end', assessmentModulesController.endSession);

module.exports = router;
