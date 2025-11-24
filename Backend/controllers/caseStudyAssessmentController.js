// controllers/caseStudyAssessmentController.js
const db = require("../src/config/database");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
require("dotenv").config();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// Send OTP to email
exports.sendOTP = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { share_link, email, full_name } = req.body;

    if (!share_link || !email || !full_name) {
      await connection.rollback();
      return res.status(400).json({ error: "Share link, email, and full name are required" });
    }

    // Get assessment
    const [assessments] = await connection.query(
      `SELECT * FROM case_study_assessments WHERE share_link = ? AND status = 'active'`,
      [share_link]
    );

    if (!assessments || assessments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Assessment not found or inactive" });
    }

    const assessment = assessments[0];

    // Check if application already exists
    const [existingApps] = await connection.query(
      `SELECT * FROM case_study_assessment_applications 
       WHERE assessment_id = ? AND email = ?`,
      [assessment.id, email]
    );

    let applicationId;
    if (existingApps.length > 0) {
      applicationId = existingApps[0].id;
      
      // Check if OTP was sent recently (within 1 minute)
      if (existingApps[0].otp_code && existingApps[0].otp_expires_at) {
        const lastSent = new Date(existingApps[0].updated_at);
        const now = new Date();
        const timeDiff = (now - lastSent) / 1000; // seconds
        
        if (timeDiff < 60) {
          await connection.rollback();
          return res.status(429).json({ 
            error: "Please wait before requesting another OTP",
            retryAfter: Math.ceil(60 - timeDiff)
          });
        }
      }
    } else {
      // Create new application record
      const [appResult] = await connection.query(
        `INSERT INTO case_study_assessment_applications 
         (assessment_id, email, full_name, status, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
        [assessment.id, email, full_name]
      );
      applicationId = appResult.insertId;
    }

    // Generate and store OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    await connection.query(
      `UPDATE case_study_assessment_applications 
       SET otp_code = ?, otp_expires_at = ?, otp_verified = 0, updated_at = NOW()
       WHERE id = ?`,
      [otpCode, expiresAt, applicationId]
    );

    // Send OTP email
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1DBF73 0%, #16a34a 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
      font-size: 26px;
      font-weight: 700;
    }
    .content {
      padding: 32px 24px;
    }
    .otp-box {
      background: #f9fafb;
      padding: 20px;
      border-left: 4px solid #1DBF73;
      margin: 24px 0;
      border-radius: 8px;
      text-align: center;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      color: #1DBF73;
      letter-spacing: 8px;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 13px;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Verification Code</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${full_name}</strong>,</p>
      <p>Your verification code for the case study assessment is:</p>
      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <p style="color: #dc2626; font-size: 14px;">This code is valid for 10 minutes only.</p>
      </div>
      <p>If you didn't request this code, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"Merit Assessment" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Verification Code - Case Study Assessment`,
      html: emailHtml
    });

    await connection.commit();

    res.json({
      success: true,
      message: "OTP sent successfully",
      expires_in: 600 // 10 minutes in seconds
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error sending OTP:", err);
    res.status(500).json({ 
      error: "Failed to send OTP",
      details: err.message 
    });
  } finally {
    connection.release();
  }
};

// Verify OTP and send case study invitation
exports.verifyOTP = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { share_link, email, otp } = req.body;

    if (!share_link || !email || !otp) {
      await connection.rollback();
      return res.status(400).json({ error: "Share link, email, and OTP are required" });
    }

    // Get assessment
    const [assessments] = await connection.query(
      `SELECT csa.*, cs.id as case_study_id, cs.title as case_study_title, cs.duration_minutes
       FROM case_study_assessments csa
       LEFT JOIN case_studies cs ON csa.case_study_id = cs.id
       WHERE csa.share_link = ? AND csa.status = 'active'`,
      [share_link]
    );

    if (!assessments || assessments.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Assessment not found or inactive" });
    }

    const assessment = assessments[0];

    if (!assessment.case_study_id) {
      await connection.rollback();
      return res.status(400).json({ error: "Case study not yet created for this assessment" });
    }

    // Get application
    const [applications] = await connection.query(
      `SELECT * FROM case_study_assessment_applications 
       WHERE assessment_id = ? AND email = ?`,
      [assessment.id, email]
    );

    if (!applications || applications.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Application not found. Please request OTP first." });
    }

    const application = applications[0];

    // Verify OTP
    if (application.otp_code !== otp) {
      await connection.rollback();
      return res.status(401).json({ error: "Invalid OTP code" });
    }

    // Check if OTP expired
    if (new Date(application.otp_expires_at) < new Date()) {
      await connection.rollback();
      return res.status(410).json({ error: "OTP code has expired. Please request a new one." });
    }

    // Check if already verified and invited
    if (application.otp_verified && application.invitation_sent) {
      await connection.rollback();
      return res.status(400).json({ error: "You have already been invited. Please check your email." });
    }

    // Mark OTP as verified
    await connection.query(
      `UPDATE case_study_assessment_applications 
       SET otp_verified = 1, updated_at = NOW()
       WHERE id = ?`,
      [application.id]
    );

    // Get recruiter info
    const [recruiterRows] = await connection.query(
      `SELECT rp.*, u.full_name as recruiter_name, u.email as recruiter_email
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.id = ?`,
      [assessment.recruiter_id]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Recruiter not found" });
    }

    const recruiter = recruiterRows[0];

    // Create user account if doesn't exist
    let userId;
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length === 0) {
      // Create user with placeholder password
      const placeholderPassword = crypto.randomBytes(32).toString('hex');
      const placeholderHash = await bcrypt.hash(placeholderPassword, 10);
      
      const [userResult] = await connection.query(
        `INSERT INTO users (email, full_name, user_type, password_hash, is_active, created_at, updated_at)
         VALUES (?, ?, 'applicant', ?, 1, NOW(), NOW())`,
        [email, application.full_name, placeholderHash]
      );
      userId = userResult.insertId;
    } else {
      userId = existingUsers[0].id;
    }

    // Create applicant profile if doesn't exist
    const [existingProfiles] = await connection.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [userId]
    );

    if (existingProfiles.length === 0) {
      await connection.query(
        `INSERT INTO applicant_profiles 
         (user_id, title, location, preferred_language, years_of_experience, 
          availability, created_at, updated_at)
         VALUES (?, ?, ?, 'en', 0, 'full-time', NOW(), NOW())`,
        [userId, 'Job Applicant', 'Not specified']
      );
    }

    // Create a virtual job application for this assessment
    // We'll use a placeholder job_id (NULL) and link it to the assessment
    const [jobAppResult] = await connection.query(
      `INSERT INTO job_applications 
       (user_id, job_id, email, full_name, status, applied_at, updated_at)
       VALUES (?, NULL, ?, ?, 'pending', NOW(), NOW())`,
      [userId, email, application.full_name]
    );

    const jobApplicationId = jobAppResult.insertId;

    // Generate temporary credentials for case study access
    const tempPassword = crypto.randomBytes(4).toString('hex');
    const accessToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    // Create case study invitation (similar to job-based invitations)
    // Since we don't have a job_id, we'll create a special invitation record
    await connection.query(
      `INSERT INTO case_study_invitations 
       (job_application_id, case_study_id, job_id, temp_password, 
        access_token, expires_at, status, created_at)
       VALUES (?, ?, NULL, ?, ?, ?, 'pending', NOW())`,
      [jobApplicationId, assessment.case_study_id, hashedPassword, accessToken, expiresAt]
    );

    // Update application status
    await connection.query(
      `UPDATE case_study_assessment_applications 
       SET invitation_sent = 1, invitation_sent_at = NOW(), status = 'invited', updated_at = NOW()
       WHERE id = ?`,
      [application.id]
    );

    // Send invitation email
    const loginUrl = `${process.env.FRONTEND_URL}/case-study/login?token=${accessToken}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1DBF73 0%, #16a34a 100%);
      color: white;
      padding: 32px 24px;
      text-align: center;
      font-size: 26px;
      font-weight: 700;
    }
    .content {
      padding: 32px 24px;
    }
    .credentials {
      background: #f9fafb;
      padding: 20px;
      border-left: 4px solid #1DBF73;
      margin: 24px 0;
      border-radius: 8px;
    }
    .button {
      display: inline-block;
      background: #1DBF73;
      color: white;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 13px;
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Case Study Assessment Invitation</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${application.full_name}</strong>,</p>
      <p>Congratulations! Your email has been verified. You have been invited to complete a case study assessment.</p>
      <div class="credentials">
        <h3>🔐 Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${tempPassword}</code></p>
        <p style="color: #dc2626; font-size: 14px;">⚠️ This password is valid for 7 days only.</p>
      </div>
      <center>
        <a href="${loginUrl}" class="button">Access Case Study →</a>
      </center>
      <p>Or copy this link to your browser:</p>
      <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
        ${loginUrl}
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p><strong>What to expect:</strong></p>
        <ul>
          <li>Log in using the credentials above</li>
          <li>Read the case study scenario carefully</li>
          <li>Answer all questions thoughtfully</li>
          <li>Submit before the deadline</li>
        </ul>
      </div>
      <p>Good luck! We look forward to reviewing your submission.</p>
      <p>Best regards,<br>
      <strong>${recruiter.recruiter_name}</strong><br>
      ${recruiter.company_name || 'Recruitment Team'}</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply directly to this message.</p>
      <p>If you have questions, contact us at ${recruiter.recruiter_email}</p>
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"${recruiter.company_name || 'Recruitment Team'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Case Study Assessment Invitation`,
      html: emailHtml
    });

    await connection.commit();

    res.json({
      success: true,
      message: "OTP verified and invitation sent successfully",
      email: email
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error verifying OTP:", err);
    res.status(500).json({ 
      error: "Failed to verify OTP",
      details: err.message 
    });
  } finally {
    connection.release();
  }
};

// Get applications for an assessment
exports.getApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assessmentId } = req.params;

    // Verify recruiter owns this assessment
    const [recruiterRows] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    const [assessments] = await db.query(
      "SELECT * FROM case_study_assessments WHERE id = ? AND recruiter_id = ?",
      [assessmentId, recruiterId]
    );

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    // Get applications
    const [applications] = await db.query(
      `SELECT * FROM case_study_assessment_applications 
       WHERE assessment_id = ?
       ORDER BY created_at DESC`,
      [assessmentId]
    );

    res.json({
      success: true,
      applications: applications || []
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications", details: err.message });
  }
};

// Get applications for an assessment
exports.getApplications = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const user = req.user;
    const { assessmentId } = req.params;
    const lang = req.language || 'en';

    if (user.user_type !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can view applications' });
    }

    // Get recruiter profile
    const [recruiterRows] = await connection.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [user.id]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    // Check ownership of assessment
    const [assessmentRows] = await connection.query(
      `SELECT 
        csa.*,
        ${lang === 'ar' ? 'COALESCE(cs.title_ar, cs.title)' : 'cs.title'} as case_study_title
      FROM case_study_assessments csa
      LEFT JOIN case_studies cs ON csa.case_study_id = cs.id
      WHERE csa.id = ? AND csa.recruiter_id = ?`,
      [assessmentId, recruiterId]
    );

    if (!assessmentRows || assessmentRows.length === 0) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const assessment = assessmentRows[0];

    // Get applicants for this assessment (job_applications with NULL job_id linked to this assessment)
    const [applicants] = await connection.query(
      `SELECT 
        ja.*,
        CASE 
          WHEN ja.status = 'case_study_completed' THEN 'case_study_completed'
          WHEN ja.status = 'case_study_sent' THEN 'case_study_sent'
          ELSE ja.status
        END as display_status,
        'Pending' as match_category
      FROM job_applications ja
      JOIN case_study_invitations csi ON ja.id = csi.job_application_id
      WHERE ja.job_id IS NULL 
        AND csi.case_study_id = ?
      ORDER BY ja.applied_at DESC`,
      [assessment.case_study_id]
    );

    // Parse cv_match_details JSON for frontend
    applicants.forEach(app => {
      if (app.cv_match_details && typeof app.cv_match_details === 'string') {
        try {
          app.cv_match_details = JSON.parse(app.cv_match_details);
        } catch (e) {
          console.error('Error parsing cv_match_details:', e);
          app.cv_match_details = null;
        }
      }
    });

    res.json({
      success: true,
      job_title: assessment.case_study_title || 'Case Study Assessment',
      applicants,
      total: applicants.length,
      match_stats: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        pending: applicants.length,
        average_score: 0
      },
      language: lang,
      is_assessment: true,
      assessment_id: assessmentId
    });

  } catch (err) {
    console.error("Error fetching assessment applications:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    connection.release();
  }
};

module.exports = exports;

// Close an assessment (set status to 'closed')
exports.closeAssessment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const user = req.user;
    const { assessmentId } = req.params;

    if (user.user_type !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can close assessments' });
    }

    const [recruiterRows] = await connection.query('SELECT id FROM recruiter_profiles WHERE user_id = ?', [user.id]);
    if (!recruiterRows?.length) return res.status(404).json({ error: 'Recruiter profile not found' });
    const recruiterId = recruiterRows[0].id;

    const [checkRows] = await connection.query('SELECT id FROM case_study_assessments WHERE id = ? AND recruiter_id = ?', [assessmentId, recruiterId]);
    if (!checkRows?.length) return res.status(404).json({ error: 'Assessment not found' });

    await connection.query('UPDATE case_study_assessments SET status = "closed", updated_at = NOW() WHERE id = ?', [assessmentId]);
    res.json({ success: true, message: 'Assessment closed' });
  } catch (err) {
    console.error('Error closing assessment:', err);
    res.status(500).json({ error: 'Failed to close assessment' });
  } finally {
    connection.release();
  }
};

// Delete an assessment (hard delete)
exports.deleteAssessment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const user = req.user;
    const { assessmentId } = req.params;

    if (user.user_type !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can delete assessments' });
    }

    const [recruiterRows] = await connection.query('SELECT id FROM recruiter_profiles WHERE user_id = ?', [user.id]);
    if (!recruiterRows?.length) return res.status(404).json({ error: 'Recruiter profile not found' });
    const recruiterId = recruiterRows[0].id;

    const [checkRows] = await connection.query('SELECT id FROM case_study_assessments WHERE id = ? AND recruiter_id = ?', [assessmentId, recruiterId]);
    if (!checkRows?.length) return res.status(404).json({ error: 'Assessment not found' });

    await connection.query('DELETE FROM case_study_assessments WHERE id = ?', [assessmentId]);
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    res.status(500).json({ error: 'Failed to delete assessment' });
  } finally {
    connection.release();
  }
};

