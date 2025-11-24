// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, feedbackController.getFeedbacks);

module.exports = router;
