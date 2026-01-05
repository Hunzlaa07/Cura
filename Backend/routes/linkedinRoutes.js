const express = require('express');
const router = express.Router();
const db = require('../src/config/database');
const linkedinService = require('../services/linkedinService');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * GET /api/integrations/linkedin/auth-url
 * Return LinkedIn auth URL (includes state=userId)
 */
router.get('/linkedin/auth-url', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const authUrl = linkedinService.getAuthUrl(userId);
    res.json({ authUrl });
  } catch (err) {
    console.error('❌ Error getting LinkedIn auth URL:', err);
    res.status(500).json({ error: 'Failed to get LinkedIn auth URL' });
  }
});

/**
 * GET /api/integrations/linkedin/callback
 * Public callback from LinkedIn. Expects `code` and `state` (userId)
 */
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // If LinkedIn returned an error (e.g., unauthorized_scope), redirect with a friendly error
    if (error) {
      console.warn('LinkedIn callback error:', error, error_description);
      const redirectUrl = `${frontendUrl}/recruiter-dashboard/my-jobs?linkedin_error=${encodeURIComponent(error)}&linkedin_error_description=${encodeURIComponent(error_description || '')}&state=${encodeURIComponent(state || '')}`;
      return res.redirect(redirectUrl);
    }

    if (!code) return res.status(400).send('Authorization code required');
    if (!state) return res.status(400).send('Missing state');

    // state contains userId
    const userId = parseInt(state, 10);
    if (!userId) return res.status(400).send('Invalid state');

    await linkedinService.handleAuthCallback(code, userId);
    return res.redirect(`${frontendUrl}/recruiter-dashboard/my-jobs?linkedin_connected=1`);
  } catch (err) {
    console.error('❌ Error in LinkedIn GET callback:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/recruiter-dashboard/my-jobs?linkedin_error=server_error&linkedin_error_description=${encodeURIComponent(err.message || 'Failed to authenticate with LinkedIn')}`);
  }
});

/**
 * POST /api/integrations/linkedin/callback
 * SPA flow: frontend posts the code with user's Authorization header
 */
router.post('/linkedin/callback', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user?.id;
    if (!code) return res.status(400).json({ error: 'Authorization code required' });
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    await linkedinService.handleAuthCallback(code, userId);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in LinkedIn POST callback:', err);
    res.status(500).json({ error: 'Failed to authenticate with LinkedIn' });
  }
});

/**
 * GET /api/integrations/linkedin/status
 */
router.get('/linkedin/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const authenticated = await linkedinService.isUserAuthenticated(userId);
    res.json({ authenticated });
  } catch (err) {
    console.error('❌ Error checking LinkedIn status:', err);
    res.status(500).json({ error: 'Failed to check LinkedIn status' });
  }
});

/**
 * POST /api/integrations/linkedin/share-job
 * Body: { jobId }
 */
router.post('/linkedin/share-job', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { jobId } = req.body;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    if (!jobId) return res.status(400).json({ error: 'jobId required' });

    // Fetch job
    const [rows] = await db.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Job not found' });
    const job = rows[0];

    // Only allow the recruiter who owns the job to share it (validate recruiter_profiles)
    const [recRows] = await db.query('SELECT r.id FROM recruiter_profiles r JOIN jobs j ON j.recruiter_id = r.id WHERE j.id = ?', [jobId]);
    const recruiterId = recRows && recRows.length > 0 ? recRows[0].id : null;
    // Ensure req.user.id matches recruiter_profiles.user_id
    const [userRecruiter] = await db.query('SELECT id FROM recruiter_profiles WHERE user_id = ?', [userId]);
    if (!userRecruiter || userRecruiter.length === 0 || userRecruiter[0].id !== recruiterId) {
      return res.status(403).json({ error: 'Not authorized to share this job' });
    }

    // Check LinkedIn auth
    const authenticated = await linkedinService.isUserAuthenticated(userId);
    if (!authenticated) return res.status(403).json({ error: 'LinkedIn not connected' });

    const response = await linkedinService.shareJob(userId, job);
    res.json({ success: true, result: response });
  } catch (err) {
    console.error('❌ Error sharing job to LinkedIn:', err);
    // Detect permission error when fetching profile and provide actionable guidance
    if (err.message && err.message.includes('Failed to fetch LinkedIn profile') && err.message.includes('403')) {
      return res.status(403).json({ error: 'LinkedIn profile access denied. Please reconnect your LinkedIn account ensuring OpenID Connect / Sign in with LinkedIn is enabled (re-authorize the app).' });
    }
    res.status(500).json({ error: err.message || 'Failed to share job' });
  }
});

module.exports = router;