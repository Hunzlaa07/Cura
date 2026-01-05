// controllers/caseStudyInvitationController.js
const db = require("../src/config/database");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require("dotenv").config();

// Generate temporary credentials
function generateTempCredentials() {
  const password = crypto.randomBytes(4).toString('hex'); // 8-char password
  const token = crypto.randomBytes(32).toString('hex'); // Secure token
  return { password, token };
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail
    pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
  }
});

// Send Case Study Invitations to Selected Applicants
exports.sendCaseStudyInvitations = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { applicant_ids, job_id, case_study_id } = req.body;

    // Validate input
    if (!applicant_ids || !Array.isArray(applicant_ids) || applicant_ids.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "No applicants selected" });
    }

    if (!case_study_id) {
      await connection.rollback();
      return res.status(400).json({ error: "No case study selected" });
    }

    // Get recruiter profile
    const [recruiterRows] = await connection.query(
      `SELECT rp.*, u.full_name as recruiter_name, u.email as recruiter_email
       FROM recruiter_profiles rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.user_id = ?`,
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiter = recruiterRows[0];

    // Get job details
    const [jobRows] = await connection.query(
      "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
      [job_id, recruiter.id]
    );

    if (!jobRows || jobRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Get case study details
    const [caseStudyRows] = await connection.query(
      "SELECT * FROM case_studies WHERE id = ? AND job_id = ?",
      [case_study_id, job_id]
    );

    if (!caseStudyRows || caseStudyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Case study not found" });
    }

    const caseStudy = caseStudyRows[0];

    // Process each applicant
    const sentInvitations = [];
    const failedInvitations = [];

    for (const applicantId of applicant_ids) {
      try {
        // Get applicant details
        const [applicantRows] = await connection.query(
          `SELECT ja.*, ja.email as applicant_email, ja.full_name as applicant_name
           FROM job_applications ja
           WHERE ja.id = ? AND ja.job_id = ?`,
          [applicantId, job_id]
        );

        if (!applicantRows || applicantRows.length === 0) {
          failedInvitations.push({ applicantId, reason: "Applicant not found" });
          continue;
        }

        const applicant = applicantRows[0];

        // Check if already invited
        const [existingInvite] = await connection.query(
          `SELECT * FROM case_study_invitations 
           WHERE job_application_id = ? AND case_study_id = ?`,
          [applicantId, case_study_id]
        );

        if (existingInvite.length > 0) {
          failedInvitations.push({ 
            applicantId, 
            email: applicant.applicant_email,
            reason: "Already invited" 
          });
          continue;
        }

        // Generate credentials
        const { password, token } = generateTempCredentials();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

        // Hash password for storage
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert invitation
        const [inviteResult] = await connection.query(
          `INSERT INTO case_study_invitations 
            (job_application_id, case_study_id, job_id, temp_password, 
             access_token, expires_at, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
          [applicantId, case_study_id, job_id, hashedPassword, token, expiresAt]
        );

        // Prepare email
        const loginUrl = `${process.env.FRONTEND_URL}/login?token=${token}`;
        
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
    letter-spacing: -0.5px;
  }

  .content {
    padding: 32px 24px;
    background: #ffffff;
  }

  .credentials {
    background: #f9fafb;
    padding: 20px;
    border-left: 4px solid #1DBF73;
    margin: 24px 0;
    border-radius: 8px;
    font-size: 15px;
  }

  .button {
    display: inline-block;
    background: #1DBF73;
    color: white;
    padding: 12px 32px;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .button:hover {
    background: #16a34a;
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3);
  }

  .footer {
    text-align: center;
    color: #64748b;
    font-size: 13px;
    margin: 24px 0;
  }

  .info-box {
    background: #ecfdf5;
    border-left: 4px solid #1DBF73;
    padding: 16px 20px;
    margin: 16px 0;
    border-radius: 8px;
    color: #065f46;
    font-size: 15px;
  }

  /* Subtle animation for modern feel */
  .container,
  .info-box,
  .button {
    transition: all 0.3s ease-in-out;
  }
</style>

</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Case Study Invitation</h1>
      <p>You've been selected for the next round!</p>
    </div>
    
    <div class="content">
      <p>Dear <strong>${applicant.applicant_name}</strong>,</p>
      
      <p>Congratulations! After reviewing your application for the <strong>${job.title}</strong> 
      position at <strong>${recruiter.company_name || 'our company'}</strong>, we're excited 
      to invite you to complete a case study assessment.</p>
      
      <div class="info-box">
        <strong>📋 Case Study Details:</strong><br>
        <strong>Title:</strong> ${caseStudy.title}<br>
        <strong>Duration:</strong> ${caseStudy.duration_minutes} minutes<br>
        <strong>Valid Until:</strong> ${expiresAt.toLocaleDateString()}
      </div>
      
      <div class="credentials">
        <h3>🔐 Your Login Credentials</h3>
        <p><strong>Email:</strong> ${applicant.applicant_email}</p>
        <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${password}</code></p>
        <p style="color: #dc2626; font-size: 14px;">⚠️ This password is valid for 7 days only.</p>
      </div>
      
      <center>
        <a href="${loginUrl}" class="button">Access Case Study →</a>
      </center>
      
      <p style="margin-top: 30px;">Or copy this link to your browser:</p>
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

        // Send email
        await transporter.sendMail({
          from: `"${recruiter.company_name || 'Recruitment Team'}" <${process.env.EMAIL_USER}>`,
          to: applicant.applicant_email,
          subject: `Case Study Invitation: ${job.title}`,
          html: emailHtml
        });

        // Update application status
        await connection.query(
          `UPDATE job_applications 
           SET status = 'case_study_sent', updated_at = NOW()
           WHERE id = ?`,
          [applicantId]
        );

        // Log activity
        await connection.query(
          `INSERT INTO job_activity_log 
            (job_id, recruiter_id, action, details, created_at)
           VALUES (?, ?, 'case_study_sent', ?, NOW())`,
          [job_id, recruiter.id, `Case study sent to ${applicant.applicant_name}`]
        );

        sentInvitations.push({
          applicantId,
          email: applicant.applicant_email,
          name: applicant.applicant_name
        });

      } catch (emailErr) {
        console.error(`Failed to send invitation to applicant ${applicantId}:`, emailErr);
        failedInvitations.push({ 
          applicantId, 
          reason: emailErr.message 
        });
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `✅ Sent ${sentInvitations.length} invitation(s) successfully`,
      sent: sentInvitations,
      failed: failedInvitations,
      total: sentInvitations.length + failedInvitations.length
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error sending invitations:", err);
    res.status(500).json({ 
      error: "Failed to send invitations",
      details: err.message 
    });
  } finally {
    connection.release();
  }
};

exports.verifyCaseStudyToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Access token required" });
    }

    const [invitations] = await db.query(
      `SELECT 
        csi.*,
        cs.title as case_study_title,
        cs.description as case_study_description,
        cs.duration_minutes,
        j.title as job_title,
        ja.full_name as applicant_name,
        ja.email as applicant_email
       FROM case_study_invitations csi
       JOIN case_studies cs ON csi.case_study_id = cs.id
       LEFT JOIN jobs j ON csi.job_id = j.id
       JOIN job_applications ja ON csi.job_application_id = ja.id
       WHERE csi.access_token = ?`,
      [token]
    );

    if (!invitations || invitations.length === 0) {
      return res.status(404).json({ error: "Invalid or expired invitation" });
    }

    const invitation = invitations[0];

    // ✅ FIX: Only check expiration if never accessed before
    // Once they've logged in, let them continue regardless of expiration
    const isExpired = new Date(invitation.expires_at) < new Date();
    const hasBeenAccessed = invitation.last_accessed_at !== null;
    
    if (isExpired && !hasBeenAccessed) {
      return res.status(410).json({ 
        error: "This invitation has expired",
        expired_at: invitation.expires_at
      });
    }

    // Check if already completed
    if (invitation.status === 'completed') {
      return res.status(303).json({ 
        completed: true,
        message: "You have already completed this case study. Please login to access your dashboard.",
        redirectUrl: "/login",
        email: invitation.applicant_email
      });
    }

    // ⚠️ Warn if expired but allow access since already started
    const warning = isExpired && hasBeenAccessed 
      ? "This invitation has expired, but you can continue since you already started."
      : null;

    res.json({
      valid: true,
      warning,
      invitation: {
        id: invitation.id,
        case_study_id: invitation.case_study_id,
        job_id: invitation.job_id,
        case_study_title: invitation.case_study_title,
        job_title: invitation.job_title,
        applicant_name: invitation.applicant_name,
        applicant_email: invitation.applicant_email,
        expires_at: invitation.expires_at,
        status: invitation.status,
        is_expired: isExpired,
        has_been_accessed: hasBeenAccessed
      }
    });

  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Login with Temporary Credentials - FIXED VERSION
exports.loginWithTempCredentials = async (req, res) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find invitation by email and token (handle NULL job_id for assessments)
    const [invitations] = await db.query(
      `SELECT 
        csi.*,
        cs.id as case_study_id,
        cs.title as case_study_title,
        j.id as job_id,
        j.title as job_title,
        ja.id as job_application_id,
        ja.full_name as applicant_name,
        ja.phone as applicant_phone,
        ja.resume_file_path,
        ja.last_job_title
       FROM case_study_invitations csi
       JOIN job_applications ja ON csi.job_application_id = ja.id
       JOIN case_studies cs ON csi.case_study_id = cs.id
       LEFT JOIN jobs j ON csi.job_id = j.id
       WHERE ja.email = ? AND csi.access_token = ?`,
      [email, token]
    );

    if (!invitations || invitations.length === 0) {
      return res.status(404).json({ error: "Invalid credentials or token" });
    }

    const invitation = invitations[0];

    // ✅ FIX: Allow access on first login even if expired
    // Only strictly enforce expiration if they've never accessed it
    const isExpired = new Date(invitation.expires_at) < new Date();
    const hasBeenAccessed = invitation.last_accessed_at !== null;

    if (isExpired && !hasBeenAccessed) {
      return res.status(410).json({ error: "This invitation has expired" });
    }

    // Verify password
    const bcrypt = require('bcrypt');
    const passwordMatch = await bcrypt.compare(password, invitation.temp_password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 🔥 Create user and applicant profile if they don't exist
    const connection = await db.getConnection();
    const path = require('path');
    const fs = require('fs');
    const pdf = require('pdf-parse');
    const mammoth = require('mammoth');
    
    try {
      await connection.beginTransaction();

      // Check if user already exists
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      let userId;
      let applicantProfileId;

      if (existingUsers.length === 0) {
        console.log('📝 Creating new user account for:', email);
        
        // Create new user with placeholder password
        const placeholderPassword = crypto.randomBytes(32).toString('hex');
        const placeholderHash = await bcrypt.hash(placeholderPassword, 10);
        
        const [userResult] = await connection.query(
          `INSERT INTO users (email, full_name, user_type, password_hash, is_active, created_at, updated_at)
           VALUES (?, ?, 'applicant', ?, 1, NOW(), NOW())`,
          [email, invitation.applicant_name, placeholderHash]
        );
        userId = userResult.insertId;

        console.log(`✅ Created user ${userId} for ${email}`);

        // 🔥 Create applicant profile
        const [applicantResult] = await connection.query(
          `INSERT INTO applicant_profiles 
            (user_id, title, location, preferred_language, years_of_experience, 
             availability, created_at, updated_at)
           VALUES (?, ?, ?, 'en', 0, 'full-time', NOW(), NOW())`,
          [
            userId,
            invitation.last_job_title || 'Job Applicant',
            'Not specified'
          ]
        );
        
        applicantProfileId = applicantResult.insertId;
        console.log(`✅ Created applicant profile ${applicantProfileId} for user ${userId}`);

      } else {
        userId = existingUsers[0].id;
        console.log(`✅ User ${userId} already exists for ${email}`);

        // 🔥 Check if applicant profile exists, create if not
        const [existingProfile] = await connection.query(
          'SELECT id FROM applicant_profiles WHERE user_id = ?',
          [userId]
        );

        if (existingProfile.length === 0) {
          const [applicantResult] = await connection.query(
            `INSERT INTO applicant_profiles 
              (user_id, title, location, preferred_language, years_of_experience, 
               availability, created_at, updated_at)
             VALUES (?, ?, ?, 'en', 0, 'full-time', NOW(), NOW())`,
            [
              userId,
              invitation.last_job_title || 'Job Applicant',
              'Not specified'
            ]
          );
          applicantProfileId = applicantResult.insertId;
          console.log(`✅ Created missing applicant profile ${applicantProfileId} for user ${userId}`);
        } else {
          applicantProfileId = existingProfile[0].id;
        }
      }

      // 🔥 NEW: Save CV to cv_documents if it exists in job_applications
      if (invitation.resume_file_path && applicantProfileId) {
        console.log('📄 Processing CV for applicant:', applicantProfileId);
        
        // Check if CV already exists
        const [existingCV] = await connection.query(
          'SELECT id FROM cv_documents WHERE applicant_id = ? AND file_path = ?',
          [applicantProfileId, invitation.resume_file_path]
        );

        if (existingCV.length === 0) {
          const filePath = path.join(__dirname, '..', invitation.resume_file_path);
          
          if (fs.existsSync(filePath)) {
            // Extract text from CV
            let extractedText = '';
            const fileExt = path.extname(filePath).toLowerCase();
            
            try {
              if (fileExt === '.pdf') {
                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdf(dataBuffer);
                extractedText = pdfData.text;
              } else if (fileExt === '.docx') {
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value;
              } else if (fileExt === '.txt') {
                extractedText = fs.readFileSync(filePath, 'utf8');
              } else {
                extractedText = 'Unsupported file format';
              }
            } catch (extractErr) {
              console.error('❌ CV text extraction error:', extractErr);
              extractedText = 'Error extracting text';
            }

            // Get file stats
            const stats = fs.statSync(filePath);
            const fileName = path.basename(invitation.resume_file_path);
            
            // Determine MIME type
            let mimeType = 'application/octet-stream';
            if (fileExt === '.pdf') mimeType = 'application/pdf';
            else if (fileExt === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (fileExt === '.txt') mimeType = 'text/plain';

            // Insert CV document
            await connection.query(
              `INSERT INTO cv_documents 
                (applicant_id, file_name, file_path, file_size, mime_type, 
                 language, parsed_text, is_active, uploaded_at)
               VALUES (?, ?, ?, ?, ?, 'en', ?, 1, NOW())`,
              [
                applicantProfileId,
                fileName,
                invitation.resume_file_path,
                stats.size,
                mimeType,
                extractedText
              ]
            );

            // Update applicant profile
            await connection.query(
              `UPDATE applicant_profiles 
               SET cv_file_path = ?, cv_uploaded_at = NOW(), updated_at = NOW()
               WHERE id = ?`,
              [invitation.resume_file_path, applicantProfileId]
            );

            console.log(`✅ CV saved to cv_documents for applicant ${applicantProfileId}`);
            console.log(`📊 Extracted ${extractedText.length} characters of text`);
          } else {
            console.warn('⚠️ CV file not found at:', filePath);
          }
        } else {
          console.log('✅ CV already exists in cv_documents');
        }
      }

      // ✅ UPDATE last_accessed_at AFTER successful login
      await connection.query(
        `UPDATE case_study_invitations 
         SET last_accessed_at = NOW()
         WHERE id = ?`,
        [invitation.id]
      );

      // Update job application with user_id if not set
      await connection.query(
        `UPDATE job_applications 
         SET user_id = ?
         WHERE id = ? AND user_id IS NULL`,
        [userId, invitation.job_application_id]
      );

      await connection.commit();

      // Generate JWT token for the user
      const jwt = require('jsonwebtoken');
      const jwtToken = jwt.sign(
        { id: userId, email: email, user_type: 'applicant' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // ⚠️ Include expiration warning if applicable
      const warning = isExpired && !hasBeenAccessed 
        ? "This invitation has expired, but you were allowed to access since this is your first login."
        : null;

      // Return session data with JWT token
      res.json({
        success: true,
        message: "Login successful",
        warning,
        session: {
          invitation_id: invitation.id,
          case_study_id: invitation.case_study_id,
          job_id: invitation.job_id,
          job_application_id: invitation.job_application_id, // For proctoring tracking
          case_study_title: invitation.case_study_title,
          job_title: invitation.job_title,
          applicant_name: invitation.applicant_name,
          applicant_email: email,
          user_id: userId,
          access_token: jwtToken,
          case_study_token: invitation.access_token,
          expires_at: invitation.expires_at,
          status: invitation.status
        }
      });

    } catch (dbErr) {
      await connection.rollback();
      console.error("❌ Database error during user creation:", dbErr);
      return res.status(500).json({ error: "Failed to create user account" });
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error("❌ Error logging in:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Invitation Status
exports.getInvitationsByJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    // Verify recruiter owns this job
    const [recruiterRows] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    const [jobRows] = await db.query(
      "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
      [jobId, recruiterId]
    );

    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Get all invitations for this job
    const [invitations] = await db.query(
      `SELECT 
        csi.*,
        ja.full_name as applicant_name,
        ja.email as applicant_email,
        cs.title as case_study_title,
        f.id as feedback_id,
        f.score as submission_score,
        f.rating as submission_rating
       FROM case_study_invitations csi
       JOIN job_applications ja ON csi.job_application_id = ja.id
       JOIN case_studies cs ON csi.case_study_id = cs.id
       LEFT JOIN feedbacks f ON f.applicant_id = ja.id AND f.case_study_id = csi.case_study_id
       WHERE csi.job_id = ?
       ORDER BY csi.created_at DESC`,
      [jobId]
    );

    res.json({
      success: true,
      invitations,
      stats: {
        total: invitations.length,
        pending: invitations.filter(i => i.status === 'pending').length,
        accessed: invitations.filter(i => i.last_accessed_at).length,
        completed: invitations.filter(i => i.status === 'completed').length,
        expired: invitations.filter(i => new Date(i.expires_at) < new Date()).length
      }
    });

  } catch (err) {
    console.error("Error fetching invitations:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Submit Case Study and Complete Assessment
exports.submitCaseStudy = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const { case_study_id, job_id, answers } = req.body;

    // Get applicant ID (should exist now after login)
    const [applicantRows] = await connection.query(
      'SELECT id FROM applicant_profiles WHERE user_id = ?',
      [userId]
    );

    if (!applicantRows || applicantRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Applicant profile not found',
        hint: 'Please try logging in again'
      });
    }

    const applicantId = applicantRows[0].id;

    // Get job application
    const [applicationRows] = await connection.query(
      `SELECT ja.id as job_application_id, ja.full_name
       FROM job_applications ja
       WHERE ja.user_id = ? AND ja.job_id = ?`,
      [userId, job_id]
    );

    if (!applicationRows || applicationRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        error: 'Job application not found for this user'
      });
    }

    const jobApplicationId = applicationRows[0].job_application_id;

    // Get invitation
    const [invitations] = await connection.query(
      `SELECT csi.* 
       FROM case_study_invitations csi
       WHERE csi.job_application_id = ? 
         AND csi.case_study_id = ? 
         AND csi.job_id = ?`,
      [jobApplicationId, case_study_id, job_id]
    );

    if (!invitations || invitations.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Case study invitation not found' });
    }

    const invitation = invitations[0];

    // Check if already completed
    if (invitation.status === 'completed') {
      await connection.rollback();
      return res.status(400).json({ error: 'Case study already submitted' });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await connection.rollback();
      return res.status(410).json({ error: 'Case study invitation has expired' });
    }

    // Store answers in the invitation record
    await connection.query(
      `UPDATE case_study_invitations 
       SET status = 'completed', 
           completed_at = NOW(), 
           updated_at = NOW(),
           submission_data = ?
       WHERE id = ?`,
      [JSON.stringify(answers), invitation.id]
    );

    // Update job application status
    await connection.query(
      `UPDATE job_applications 
       SET status = 'case_study_completed', updated_at = NOW()
       WHERE id = ?`,
      [jobApplicationId]
    );

    // Log activity
    const [jobRows] = await connection.query(
      'SELECT recruiter_id FROM jobs WHERE id = ?',
      [job_id]
    );

    if (jobRows.length > 0) {
      await connection.query(
        `INSERT INTO job_activity_log 
          (job_id, recruiter_id, action, details, created_at)
         VALUES (?, ?, 'case_study_completed', ?, NOW())`,
        [job_id, jobRows[0].recruiter_id, `${applicationRows[0].full_name} completed the case study`]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Case study submitted successfully',
      redirect: '/applicant-dashboard'
    });

  } catch (err) {
    await connection.rollback();
    console.error('Error submitting case study:', err);
    res.status(500).json({ 
      error: 'Failed to submit case study',
      details: err.message 
    });
  } finally {
    connection.release();
  }
};



module.exports = exports;