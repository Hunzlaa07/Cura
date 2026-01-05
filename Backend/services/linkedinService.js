const db = require('../src/config/database');
const querystring = require('querystring');

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_CALLBACK_URL = process.env.LINKEDIN_CALLBACK_URL;

function getAuthUrl(state) {
  const base = 'https://www.linkedin.com/oauth/v2/authorization';
  const params = {
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_CALLBACK_URL,
    // Use OpenID Connect scopes; prefer 'openid profile' and rely on id_token for user identity. Omit r_liteprofile to avoid unauthorized_scope errors.
    scope: 'openid profile w_member_social',
  };
  if (state) params.state = String(state);
  return `${base}?${querystring.stringify(params)}`;
}

async function handleAuthCallback(code, userId) {
  // Exchange code for access token
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const body = querystring.stringify({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINKEDIN_CALLBACK_URL,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch linkedin token: ${err}`);
  }

  const data = await res.json();
  // Log available token response fields for debugging, but DO NOT log tokens themselves
  try { console.log('🔐 LinkedIn token response includes keys:', Object.keys(data)); } catch(e) { /* ignore */ }
  const accessToken = data.access_token;
  const expiresIn = data.expires_in;
  const expiryDate = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
  const idToken = data.id_token || null;

  // Store token, include id_token if present (OIDC)
  const [existing] = await db.query('SELECT id FROM linkedin_tokens WHERE user_id = ?', [userId]);
  if (existing && existing.length > 0) {
    await db.query(
      `UPDATE linkedin_tokens SET access_token = ?, refresh_token = ?, token_expiry = ?, id_token = ? WHERE user_id = ?`,
      [accessToken, null, expiryDate, idToken, userId]
    );
  } else {
    await db.query(
      `INSERT INTO linkedin_tokens (user_id, access_token, refresh_token, token_expiry, id_token) VALUES (?, ?, ?, ?, ?)`,
      [userId, accessToken, null, expiryDate, idToken]
    );
  }

  return { success: true };
}

async function isUserAuthenticated(userId) {
  const [rows] = await db.query('SELECT id FROM linkedin_tokens WHERE user_id = ?', [userId]);
  return rows && rows.length > 0;
}

async function getAccessTokenForUser(userId) {
  const [rows] = await db.query('SELECT access_token, token_expiry FROM linkedin_tokens WHERE user_id = ?', [userId]);
  if (!rows || rows.length === 0) return null;
  return rows[0].access_token;
}

async function getPersonUrn(accessToken, userId) {
  try {
    if (!accessToken) throw new Error('No access token provided');

    // LinkedIn requires X-Restli-Protocol-Version for some endpoints
    const res = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => 'Unable to read response');
      // If we get a 403 permission error, attempt to fallback to id_token (OIDC) if available
      if (res.status === 403 && userId) {
        console.warn('LinkedIn /me returned 403 — attempting id_token fallback');
        const [rows] = await db.query('SELECT id_token FROM linkedin_tokens WHERE user_id = ?', [userId]);
        const idToken = rows && rows.length ? rows[0].id_token : null;
        if (idToken) {
          try {
            // id_token is a JWT - decode payload
            const parts = idToken.split('.');
            if (parts.length >= 2) {
              const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
              const payloadJson = JSON.parse(payload);
              if (payloadJson && payloadJson.sub) {
                return `urn:li:person:${payloadJson.sub}`;
              }
            }
          } catch (parseErr) {
            console.warn('Failed to parse id_token payload:', parseErr.message);
          }
        }
      }
      throw new Error(`Failed to fetch LinkedIn profile: ${res.status} ${res.statusText} - ${text}`);
    }

    const data = await res.json();
    if (!data || !data.id) throw new Error('LinkedIn profile response missing id');
    return `urn:li:person:${data.id}`;
  } catch (err) {
    console.error('❌ Error in getPersonUrn:', err.message || err);
    throw err;
  }
}

async function shareJob(userId, job) {
  const accessToken = await getAccessTokenForUser(userId);
  if (!accessToken) throw new Error('User not authenticated with LinkedIn');

  const author = await getPersonUrn(accessToken, userId);

  const postBody = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: `${job.title} - ${job.company_name}\n${job.description?.slice(0, 250)}...\nApply: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/${job.share_link}`
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            description: { text: job.description?.slice(0, 200) },
            originalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/apply/${job.share_link}`,
            title: { text: job.title }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    },
    body: JSON.stringify(postBody)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LinkedIn post failed: ${text}`);
  }

  const data = await res.json();
  return data;
}

module.exports = {
  getAuthUrl,
  handleAuthCallback,
  isUserAuthenticated,
  shareJob
};