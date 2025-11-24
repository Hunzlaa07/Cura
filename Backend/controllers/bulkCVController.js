// ============================================
// controllers/bulkCVController.js
// ============================================

const bulkCVService = require('../services/bulkCVMatchingService');
const db = require("../src/config/database");
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extract text from CV file
 */
async function extractCVText(filePath, mimeType) {
  try {
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf8');
    }
    return '';
  } catch (err) {
    console.error('CV extraction error:', err);
    throw err;
  }
}

/**
 * Upload CVs from local files
 */
exports.uploadCVsLocal = async (req, res) => {
  try {
    const { jd } = req.body;
    const userId = req.user?.id;

    console.log('📤 Upload request received. User:', userId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - No user found" });
    }

    if (!jd || jd.trim().length < 50) {
      return res.status(400).json({ error: "Job description must be at least 50 characters" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`📄 Files received: ${req.files.length}`);

    // Get recruiter ID
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized as recruiter" });
    }

    const recruiterId = recruiterRows[0].id;
    console.log('👤 Recruiter ID:', recruiterId);

    // Create bulk job
    const bulkJob = await bulkCVService.createBulkJob(recruiterId, jd);
    console.log('📋 Bulk job created:', bulkJob.bulk_job_id);

    // Update file count
    await db.query(
      `UPDATE bulk_cv_jobs SET total_files = ? WHERE id = ?`,
      [req.files.length, bulkJob.bulk_job_id]
    );

    // Extract text from all CVs
    const cvFiles = [];
    for (const file of req.files) {
      try {
        const uploadsDir = path.join(__dirname, '../uploads/bulk_cvs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
        const filePath = path.join(uploadsDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);

        console.log(`📖 Extracting text from: ${file.originalname}`);
        const extractedText = await extractCVText(filePath, file.mimetype);

        cvFiles.push({
          name: file.originalname,
          text: extractedText,
          file_path: `/uploads/bulk_cvs/${uniqueName}`,
          size: file.size
        });

        console.log(`✅ Extracted: ${file.originalname} (${extractedText.length} chars)`);
      } catch (err) {
        console.error(`❌ Error processing ${file.originalname}:`, err);
      }
    }

    console.log(`🎯 Ready to process ${cvFiles.length} CVs`);

    // Process CVs in background (don't block response)
    setImmediate(async () => {
      try {
        console.log('🚀 Starting background CV processing...');
        const results = await bulkCVService.processBulkCVs(
          bulkJob.bulk_job_id,
          cvFiles,
          jd
        );
        console.log('✅ Background processing completed');
      } catch (err) {
        console.error('❌ Background processing error:', err);
        // Update bulk job with error status
        await db.query(
          `UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`,
          [err.message, bulkJob.bulk_job_id]
        );
      }
    });

    res.status(202).json({
      success: true,
      message: "CVs uploaded and analysis started",
      bulk_job_id: bulkJob.bulk_job_id,
      files_uploaded: cvFiles.length,
      status: "processing"
    });

  } catch (err) {
    console.error('❌ Error uploading CVs:', err);
    res.status(500).json({ error: "Failed to upload CVs", details: err.message });
  }
};

/**
 * Get bulk job status & results
 */
exports.getBulkJobStatus = async (req, res) => {
  try {
    const { bulkJobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`📊 Status check for bulk job ${bulkJobId}`);

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;

    const results = await bulkCVService.getBulkJobResults(bulkJobId, recruiterId);

    res.json(results);

  } catch (err) {
    console.error('❌ Error fetching bulk job status:', err);
    res.status(500).json({ error: "Failed to fetch status", details: err.message });
  }
};

/**
 * Export results as CSV
 */
exports.exportResults = async (req, res) => {
  try {
    const { bulkJobId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log(`📥 Export requested for bulk job ${bulkJobId}`);

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;
    const jobData = await bulkCVService.getBulkJobResults(bulkJobId, recruiterId);

    // Convert to CSV
    let csv = 'Rank,File Name,Match Score,Match Level,Recommendation,Summary\n';
    jobData.results.forEach((result, idx) => {
      const row = [
        idx + 1,
        `"${result.file_name}"`,
        result.match_score || 0,
        result.match_level || 'N/A',
        result.recommendation || 'Review Manually',
        `"${(result.summary || '').replace(/"/g, '""')}"`
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bulk-cv-results-${bulkJobId}.csv"`);
    res.send(csv);

    console.log('✅ CSV exported successfully');

  } catch (err) {
    console.error('❌ Error exporting results:', err);
    res.status(500).json({ error: "Failed to export results", details: err.message });
  }
};