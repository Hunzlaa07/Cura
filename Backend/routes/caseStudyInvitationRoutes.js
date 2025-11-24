const express = require('express');
const router = express.Router();
const db = require('../src/config/database'); 
const caseStudyInvitationController = require('../controllers/caseStudyInvitationController');
const authMiddleware = require('../middlewares/authMiddleware');

// ========================================
// PROTECTED ROUTES (Recruiter Only)
// ========================================

// Send case study invitations to selected applicants
router.post('/send', authMiddleware, caseStudyInvitationController.sendCaseStudyInvitations);

// Get all invitations for a specific job
router.get('/job/:jobId', authMiddleware, caseStudyInvitationController.getInvitationsByJob);

// ========================================
// PUBLIC ROUTES (For Applicants)
// ========================================

// Verify case study access token (from email link)
router.get('/verify', caseStudyInvitationController.verifyCaseStudyToken);

// Login with email + temp password
router.post('/login', caseStudyInvitationController.loginWithTempCredentials);

router.post('/submit', authMiddleware, caseStudyInvitationController.submitCaseStudy);

// Get applicant's invited case studies (for their dashboard)
router.get('/my-invitations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📋 Fetching case study invitations for user ${userId}`);

    // Get all case study invitations for this applicant (handle NULL job_id for assessments)
    const [invitations] = await db.query(
      `SELECT 
        csi.id as invitation_id,
        csi.status as invitation_status,
        csi.created_at as invited_at,
        csi.completed_at,
        csi.expires_at,
        csi.last_accessed_at,
        cs.id as case_study_id,
        cs.title as case_study_title,
        cs.description,
        cs.duration_minutes,
        j.id as job_id,
        j.title as job_title,
        j.location,
        j.employment_type,
        ja.applied_at,
        ja.status as application_status,
        rp.company_name
       FROM case_study_invitations csi
       JOIN job_applications ja ON csi.job_application_id = ja.id
       JOIN case_studies cs ON csi.case_study_id = cs.id
       LEFT JOIN jobs j ON csi.job_id = j.id
       LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id
       WHERE ja.user_id = ?
       ORDER BY csi.created_at DESC`,
      [userId]
    );

    console.log(`✅ Found ${invitations.length} case study invitations`);

    // Format the data to match the frontend expectations
    const formattedInvitations = invitations.map(inv => {
      const now = new Date();
      const expiresAt = new Date(inv.expires_at);
      const invitedAt = new Date(inv.invited_at);
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      // ✅ FIX: Improved status logic with better expiration handling
      let displayStatus = 'active';
      
      // Priority 1: Check if completed/submitted
      if (
        inv.completed_at !== null || 
        inv.invitation_status === 'completed' || 
        inv.invitation_status === 'submitted' ||
        inv.application_status === 'case_study_completed'
      ) {
        displayStatus = 'submitted';
        console.log(`✅ Case study ${inv.invitation_id} is SUBMITTED`);
      } 
      // Priority 2: Check if expired
      // ✅ IMPORTANT: Allow access if they've already started (last_accessed_at is set)
      else if (expiresAt < now) {
        // If they've accessed it before, keep it "active" so they can continue
        if (inv.last_accessed_at !== null) {
          displayStatus = 'active';
          console.log(`🟢 Case study ${inv.invitation_id} is ACTIVE (expired but already accessed)`);
        } else {
          displayStatus = 'expired';
          console.log(`⏰ Case study ${inv.invitation_id} is EXPIRED (never accessed)`);
        }
      }
      // Priority 3: Active/pending
      else {
        displayStatus = 'active';
        console.log(`🟢 Case study ${inv.invitation_id} is ACTIVE`);
      }
      
      return {
        id: inv.job_id || inv.case_study_id, // Use case_study_id if job_id is NULL (for assessments)
        invitation_id: inv.invitation_id,
        case_study_id: inv.case_study_id,
        job_id: inv.job_id, // Include job_id (can be null for assessments)
        title: inv.job_title || inv.case_study_title || 'Case Study Assessment', // Use case study title if no job title
        company: inv.company_name || 'Company',
        location: inv.location || 'Remote',
        employment_type: inv.employment_type || 'Full-time',
        case_study_title: inv.case_study_title,
        duration_minutes: inv.duration_minutes,
        status: displayStatus,
        invited_at: inv.invited_at,
        completed_at: inv.completed_at,
        expires_at: inv.expires_at,
        application_status: inv.application_status,
        invitation_status: inv.invitation_status,
        last_accessed_at: inv.last_accessed_at,
        time_remaining: daysRemaining > 0 ? `${daysRemaining} days` : 'Expired',
        is_expired: expiresAt < now,
        posted_time: invitedAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        start_time: invitedAt.toISOString(),
        end_time: expiresAt.toISOString()
      };
    });

    // Debug log
    formattedInvitations.forEach(inv => {
      console.log(`📊 Invitation ${inv.invitation_id}: status="${inv.status}", app_status="${inv.application_status}", inv_status="${inv.invitation_status}", last_accessed="${inv.last_accessed_at}"`);
    });

    res.json({
      success: true,
      invitations: formattedInvitations
    });

  } catch (err) {
    console.error('❌ Error fetching applicant invitations:', err);
    res.status(500).json({ 
      error: 'Failed to fetch case study invitations',
      details: err.message 
    });
  }
});

module.exports = router;
