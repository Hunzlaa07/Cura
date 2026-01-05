const express = require('express');
const router = express.Router();
const db = require('../src/config/database');
const linkedinService = require('../services/linkedinService');
const authMiddleware = require('../middlewares/authMiddleware');

// Debug endpoint - protected
router.get('/linkedin/debug', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query('SELECT access_token, token_expiry, id_token FROM linkedin_tokens WHERE user_id = ?', [userId]);
    if (!rows || rows.length === 0) return res.json({ connected: false });

    const { access_token: accessToken, token_expiry: tokenExpiry, id_token: idToken } = rows[0];

    // Try calling /v2/me with the stored access token to check if it returns 200
    let meStatus = null;
    try {
      const meResp = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          Accept: 'application/json'
        }
      });
      meStatus = meResp.status;
    } catch (err) {
      meStatus = 'error';
    }

    res.json({
      connected: true,
      hasIdToken: !!idToken,
      tokenExpiry: tokenExpiry ? new Date(tokenExpiry).toISOString() : null,
      meEndpointStatus: meStatus
    });
  } catch (err) {
    console.error('❌ Error in linkedIn debug endpoint:', err);
    res.status(500).json({ error: 'Failed to run debug' });
  }
});

module.exports = router;
