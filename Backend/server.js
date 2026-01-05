require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

// Database connection
require('./src/config/database');

// Import middlewares
const errorHandler = require('./middlewares/errorHandler');
const authMiddleware = require('./middlewares/authMiddleware');

// Import routes
const applicantRoutes = require('./routes/applicantRoutes');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const caseStudyRoutes = require('./routes/caseStudyRoutes');
const assessmentsRoutes = require("./routes/assessmentsRoutes");
const caseStudyInvitationRoutes = require('./routes/caseStudyInvitationRoutes');
const caseStudyAssessmentRoutes = require('./routes/caseStudyAssessmentRoutes');
const bulkCVRoutes = require('./routes/bulkCVRoutes');
const googleDriveRoutes = require('./routes/googleDriveRoutes');
const linkedinRoutes = require('./routes/linkedinRoutes');

// New assessment feature routes
const customQuestionsRoutes = require('./routes/customQuestionsRoutes');
const assessmentModulesRoutes = require('./routes/assessmentModulesRoutes');
const candidateResponsesRoutes = require('./routes/candidateResponsesRoutes');
const preBuiltAssessmentsRoutes = require('./routes/preBuiltAssessmentsRoutes');

const app = express();

// CORS Configuration - MUST be before helmet and other middleware
const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://merit.ideationtec.live'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  maxAge: 86400,
  optionsSuccessStatus: 200 // For legacy browsers
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options(/.*/, cors(corsOptions));

// Security headers
app.use(helmet());

// Logging
app.use(morgan('dev'));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (for uploads) with CORP header to allow same-site embedding when needed
const corpPolicy = process.env.CROSS_ORIGIN_RESOURCE_POLICY || 'same-site';
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Ensure video/image/static responses explicitly allow same-site embedding by default
    res.setHeader('Cross-Origin-Resource-Policy', corpPolicy);
  }
}));

// Cache control
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// API routes
app.use('/api/applicants', applicantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/feedbacks', feedbackRoutes);
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/assessments', assessmentsRoutes);
app.use('/api/case-study-invitations', caseStudyInvitationRoutes);
app.use('/api/case-study-assessments', caseStudyAssessmentRoutes);

// New assessment feature routes
app.use('/api/custom-questions', customQuestionsRoutes);
app.use('/api/assessment-modules', assessmentModulesRoutes);
app.use('/api/candidate-responses', candidateResponsesRoutes);
app.use('/api/pre-built-assessments', preBuiltAssessmentsRoutes);

// Bulk CV routes (upload, status, export, import-from-link, google-drive)
app.use('/api/bulk-cv', bulkCVRoutes);
app.use('/api/bulk-cv', googleDriveRoutes);

// LinkedIn integration routes
app.use('/api/integrations', linkedinRoutes);
// LinkedIn debug routes (protected)
const linkedinRoutesDebug = require('./routes/linkedinRoutesDebug');
app.use('/api/integrations', linkedinRoutesDebug);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`âœ… Server running on port ${PORT}`);
  console.log(`âœ… CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log(`âœ… Environment: ${process.env.NODE_ENV || 'development'}`);
});