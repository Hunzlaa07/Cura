// controllers/jobApplicationController.js
const db = require("../src/config/database");
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cvMatchingService = require('../services/cvMatchingService'); // 🔥 NEW

// Submit Job Application with CV Matching
exports.submitApplication = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { shareLink } = req.params;
    const { full_name, email, phone, last_job_title, additional_info } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Resume is required" });
    }

    // Get job by share link
    const [jobRows] = await connection.query(
      'SELECT id, is_open, application_deadline FROM jobs WHERE share_link = ?',
      [shareLink]
    );

    if (!jobRows || jobRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Check if deadline passed
    if (new Date(job.application_deadline) < new Date()) {
      await connection.rollback();
      return res.status(410).json({ error: "Application deadline has passed" });
    }

    // Check if job is open
    if (!job.is_open) {
      await connection.rollback();
      return res.status(403).json({ error: "This job is no longer accepting applications" });
    }

    // Check for duplicate application for THIS JOB ONLY
    const [existing] = await connection.query(
      'SELECT id FROM job_applications WHERE job_id = ? AND email = ?',
      [job.id, email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: "You have already applied for this position" });
    }

    // Save resume to disk
    const uploadsDir = path.join(__dirname, '../uploads/applications');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, req.file.buffer);

    const relativePath = `/uploads/applications/${uniqueName}`;

    // 🔥 EXTRACT CV TEXT IMMEDIATELY
    let extractedText = '';
    const mimeType = req.file.mimetype;

    try {
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } else if (mimeType === 'text/plain') {
        extractedText = fs.readFileSync(filePath, 'utf8');
      }
      console.log(`📄 Extracted ${extractedText.length} characters from CV`);
    } catch (extractErr) {
      console.error('Text extraction error:', extractErr);
      extractedText = 'Error extracting text from file';
    }

    // Check if user exists, link or create
    const [userRows] = await connection.query(
      'SELECT id, user_type FROM users WHERE email = ?',
      [email]
    );

    let userId = null;
    let isNewUser = false;

    if (userRows.length > 0) {
      userId = userRows[0].id;
      console.log(`✅ User already exists: ${userId} for ${email}`);
    } else {
      // Create new user account
      const crypto = require('crypto');
      const bcrypt = require('bcrypt');
      const temp_password = crypto.randomBytes(8).toString('hex');
      const password_hash = await bcrypt.hash(temp_password, 10);

      const [userResult] = await connection.query(
        `INSERT INTO users 
          (email, password_hash, user_type, full_name, preferred_language, is_active, created_at, updated_at) 
         VALUES (?, ?, 'applicant', ?, 'en', 1, NOW(), NOW())`,
        [email, password_hash, full_name]
      );

      userId = userResult.insertId;
      isNewUser = true;

      // Create applicant profile immediately
      await connection.query(
        `INSERT INTO applicant_profiles 
          (user_id, title, location, preferred_language, years_of_experience, 
           availability, created_at, updated_at)
         VALUES (?, ?, ?, 'en', 0, 'full-time', NOW(), NOW())`,
        [userId, last_job_title || 'Job Applicant', 'Not specified']
      );

      console.log(`✅ Created new user: ${userId} with email ${email}`);
      console.log(`📧 Temp password to send: ${temp_password}`);
    }

    // Insert application
    const [result] = await connection.query(
      `INSERT INTO job_applications 
        (job_id, user_id, full_name, email, phone, last_job_title, 
         resume_file_path, additional_info, status, applied_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [job.id, userId, full_name, email, phone, last_job_title, relativePath, additional_info]
    );

    const applicationId = result.insertId;

    // Get applicant ID and save CV
    let applicantId = null;
    const [applicantRows] = await connection.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [userId]
    );

    if (applicantRows.length > 0) {
      applicantId = applicantRows[0].id;

      // Save CV to cv_documents
      await connection.query(
        `INSERT INTO cv_documents 
          (applicant_id, file_name, file_path, file_size, mime_type, language, parsed_text, is_active, uploaded_at)
         VALUES (?, ?, ?, ?, ?, 'en', ?, 1, NOW())`,
        [
          applicantId,
          req.file.originalname,
          relativePath,
          req.file.size,
          req.file.mimetype,
          extractedText
        ]
      );

      // Update applicant_profiles with latest CV path
      await connection.query(
        `UPDATE applicant_profiles 
         SET cv_file_path = ?, cv_uploaded_at = NOW(), updated_at = NOW()
         WHERE id = ?`,
        [relativePath, applicantId]
      );
    }

    // 🔥 COMMIT TRANSACTION FIRST (so we have the application saved)
    await connection.commit();
    console.log('✅ Application saved successfully');

    // 🔥 RUN CV MATCHING IN BACKGROUND (after commit, so it doesn't block response)
    let matchScore = 0;
    let matchLevel = 'Pending';
    
    if (extractedText && extractedText.length > 50) {
      console.log('🚀 Starting CV-Job matching analysis...');
      
      // Use setTimeout to run async without blocking response
      setImmediate(async () => {
        try {
          const matchAnalysis = await cvMatchingService.matchCVToJob(
            applicationId,
            job.id,
            extractedText
          );
          console.log(`✅ CV Match Complete: ${matchAnalysis.overall_match_score}%`);
        } catch (matchErr) {
          console.error('❌ CV matching error (non-blocking):', matchErr);
        }
      });
      
      matchScore = 'Analyzing...';
      matchLevel = 'In Progress';
    } else {
      console.warn('⚠️ CV text too short for matching');
      matchScore = 0;
      matchLevel = 'Insufficient Data';
    }

    res.status(201).json({
      success: true,
      message: "Application submitted successfully! Your CV is being analyzed.",
      application_id: applicationId,
      user_id: userId,
      is_new_user: isNewUser,
      cv_saved: applicantId !== null,
      cv_match_status: matchLevel
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error submitting application:', err);
    res.status(500).json({ error: "Failed to submit application", details: err.message });
  } finally {
    connection.release();
  }
};

// Application Status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Verify recruiter owns this job
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;

    // Check if application belongs to recruiter's job and get applicant/job info
    const [appCheck] = await db.query(
      `SELECT ja.id, ja.job_id, ja.user_id, ap.id AS applicant_id
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN applicant_profiles ap ON ap.user_id = ja.user_id
       WHERE ja.id = ? AND j.recruiter_id = ?`,
      [id, recruiterId]
    );

    if (!appCheck || appCheck.length === 0) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    const { job_id, applicant_id } = appCheck[0];

    // Update status
    await db.query(
      'UPDATE job_applications SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // If marking as shortlisted, add to shortlists table
    if (status === 'shortlisted') {
      // Check if already shortlisted for this job
      const [existing] = await db.query(
        'SELECT id FROM shortlists WHERE recruiter_id = ? AND applicant_id = ? AND job_id = ?',
        [recruiterId, applicant_id, job_id]
      );

      // Only insert if not already shortlisted
      if (!existing || existing.length === 0) {
        await db.query(
          'INSERT INTO shortlists (recruiter_id, applicant_id, job_id, shortlisted_at) VALUES (?, ?, ?, NOW())',
          [recruiterId, applicant_id, job_id]
        );
      }
    }

    // If marking as rejected or reviewed, remove from shortlists if exists
    if (status === 'rejected' || status === 'reviewed') {
      await db.query(
        'DELETE FROM shortlists WHERE recruiter_id = ? AND applicant_id = ? AND job_id = ?',
        [recruiterId, applicant_id, job_id]
      );
    }

    res.json({
      success: true,
      message: `Application marked as ${status}`
    });

  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ error: "Failed to update application status" });
  }
};

// Download Resume
exports.downloadResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Verify recruiter owns this job
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const recruiterId = recruiterRows[0].id;

    // Get application with ownership check
    const [appRows] = await db.query(
      `SELECT ja.resume_file_path, ja.full_name
       FROM job_applications ja
       JOIN jobs j ON ja.job_id = j.id
       WHERE ja.id = ? AND j.recruiter_id = ?`,
      [id, recruiterId]
    );

    if (!appRows || appRows.length === 0) {
      return res.status(404).json({ error: "Application not found or unauthorized" });
    }

    const application = appRows[0];
    const filePath = path.join(__dirname, '..', application.resume_file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Resume file not found" });
    }

    res.download(filePath, `${application.full_name}_Resume${path.extname(filePath)}`);

  } catch (err) {
    console.error('Error downloading resume:', err);
    res.status(500).json({ error: "Failed to download resume" });
  }
};