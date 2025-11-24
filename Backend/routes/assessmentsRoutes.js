// routes/assessmentRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const mammoth = require("mammoth");
const pdf = require("pdf-parse");

const authMiddleware = require("../middlewares/authMiddleware");
const assessmentsController = require("../controllers/assessmentsController");

// ============================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================

const uploadDir = path.join(__dirname, "../uploads/assessments");

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed."));
    }
  }
});

// ============================================
// TEXT EXTRACTION HELPER FUNCTION
// ============================================

async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const data = await fs.readFile(filePath);
      const pdfData = await pdf(data);
      return pdfData.text;
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const data = await fs.readFile(filePath);
      const result = await mammoth.extractRawText({ buffer: data });
      return result.value;
    } else if (mimeType === "application/msword") {
      const data = await fs.readFile(filePath);
      return "[Binary DOC file - may require conversion]";
    } else if (mimeType === "text/plain") {
      return await fs.readFile(filePath, "utf-8");
    }
  } catch (err) {
    console.error("Error extracting text from file:", err.message);
    throw new Error("Failed to extract text from document");
  }
}

// ============================================
// ROUTES
// ============================================

// POST /api/assessments/upload-answer
// Upload a document file as an answer to a case study question
router.post(
  "/upload-answer",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { questionIndex } = req.body;

      console.log(`📁 File uploaded: ${req.file.filename}`);
      console.log(`📋 Question Index: ${questionIndex}`);
      console.log(`📄 MIME Type: ${req.file.mimetype}`);

      // Extract text from the uploaded file
      const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

      console.log(`✅ Text extracted: ${extractedText.substring(0, 100)}...`);

      res.json({
        message: "File uploaded successfully",
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        extracted_text: extractedText,
        mime_type: req.file.mimetype,
        uploaded_at: new Date().toISOString()
      });

    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({
        error: err.message || "Failed to upload file"
      });
    }
  }
);

// POST /api/assessments/submit
// Submit case study answers (text or file-based)
router.post("/submit", authMiddleware, assessmentsController.submitAssessment);

// GET /api/assessments/recruiter/submissions
// Get all submissions for a recruiter
router.get(
  "/recruiter/submissions",
  authMiddleware,
  assessmentsController.getRecruiterSubmissions
);

// POST /api/assessments/generate-result/:submissionId
// Generate AI evaluation for a submission
router.post(
  "/generate-result/:submissionId",
  authMiddleware,
  assessmentsController.generateResult
);

// GET /api/assessments/:id/detail
// Get submission details
router.get(
  "/:id/detail",
  authMiddleware,
  assessmentsController.getSubmissionDetail
);

// GET /api/assessments/case-studies/incomplete
// Get incomplete case studies for current user
router.get(
  "/case-studies/incomplete",
  authMiddleware,
  assessmentsController.getIncompleteCaseStudy
);

module.exports = router;