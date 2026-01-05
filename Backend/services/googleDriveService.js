const { google } = require('googleapis');
const db = require('../src/config/database');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

/**
 * Get authorization URL for user to connect their Google Drive
 * Optional `state` parameter will be preserved and returned on callback (used to associate auth with a recruiter)
 */
function getAuthUrl(state) {
  const scopes = [
    'https://www.googleapis.com/auth/drive.readonly',
  ];

  const opts = {
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  };

  if (state) opts.state = String(state);

  const authUrl = oauth2Client.generateAuthUrl(opts);

  return authUrl;
} 

/**
 * Handle OAuth callback and store tokens
 */
async function handleAuthCallback(code, recruiterId) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in database
    const [existingToken] = await db.query(
      'SELECT id FROM google_drive_tokens WHERE recruiter_id = ?',
      [recruiterId]
    );

    if (existingToken && existingToken.length > 0) {
      // Update existing token
      await db.query(
        `UPDATE google_drive_tokens 
         SET access_token = ?, refresh_token = ?, token_expiry = ?
         WHERE recruiter_id = ?`,
        [
          tokens.access_token,
          tokens.refresh_token || null,
          new Date(tokens.expiry_date),
          recruiterId
        ]
      );
    } else {
      // Insert new token
      await db.query(
        `INSERT INTO google_drive_tokens (recruiter_id, access_token, refresh_token, token_expiry)
         VALUES (?, ?, ?, ?)`,
        [
          recruiterId,
          tokens.access_token,
          tokens.refresh_token || null,
          new Date(tokens.expiry_date)
        ]
      );
    }

    console.log(`✅ Google Drive tokens stored for recruiter ${recruiterId}`);
    return { success: true };

  } catch (err) {
    console.error('❌ Error handling OAuth callback:', err.message);
    throw err;
  }
}

/**
 * Get user's folders from Google Drive
 */
async function getUserFolders(recruiterId) {
  try {
    // Get stored tokens
    const [tokenRows] = await db.query(
      'SELECT access_token, refresh_token, token_expiry FROM google_drive_tokens WHERE recruiter_id = ?',
      [recruiterId]
    );

    if (!tokenRows || tokenRows.length === 0) {
      throw new Error('User not authenticated with Google Drive');
    }

    const tokenData = tokenRows[0];
    
    // Set credentials
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

    // Initialize Drive API
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // List folders
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      spaces: 'drive',
      fields: 'files(id, name, webViewLink)',
      pageSize: 100
    });

    console.log(`📁 Found ${response.data.files.length} folders for recruiter ${recruiterId}`);
    return response.data.files;

  } catch (err) {
    console.error('❌ Error fetching folders:', err.message);
    throw err;
  }
}

/**
 * Get files from a specific folder (recursively)
 * Supports PDFs, DOCX, TXT and Google Docs (will be exported on download).
 */
async function getFolderFiles(recruiterId, folderId) {
  try {
    const [tokenRows] = await db.query(
      'SELECT access_token, refresh_token FROM google_drive_tokens WHERE recruiter_id = ?',
      [recruiterId]
    );

    if (!tokenRows || tokenRows.length === 0) {
      throw new Error('User not authenticated with Google Drive');
    }

    const tokenData = tokenRows[0];
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const resultFiles = [];
    const folderQueue = [folderId];

    // Allowed mime types to include directly
    const directMimeTypes = new Set([
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]);

    // We'll also accept Google Docs and export them later
    const googleDocsMime = 'application/vnd.google-apps.document';

    while (folderQueue.length > 0) {
      const currentFolder = folderQueue.shift();
      let pageToken = null;

      do {
        const response = await drive.files.list({
          q: `'${currentFolder}' in parents and trashed=false`,
          spaces: 'drive',
          fields: 'nextPageToken, files(id, name, mimeType, size, webViewLink, shortcutDetails)',
          pageSize: 1000,
          pageToken
        });

        const files = response.data.files || [];

        for (const f of files) {
          if (f.mimeType === 'application/vnd.google-apps.folder') {
            // Queue subfolder for traversal
            folderQueue.push(f.id);

          } else if (f.mimeType === 'application/vnd.google-apps.shortcut') {
            // Resolve shortcut to its target
            const targetId = f.shortcutDetails?.targetId;
            if (targetId) {
              try {
                const targetMetaResp = await drive.files.get({ fileId: targetId, fields: 'id, name, mimeType, size, webViewLink' });
                const tf = targetMetaResp.data;
                // Use the shortcut's original name when available to keep user-friendly labels
                tf.name = f.name || tf.name;

                if (tf.mimeType === 'application/vnd.google-apps.folder') {
                  folderQueue.push(tf.id);
                } else if (directMimeTypes.has(tf.mimeType) || tf.mimeType === googleDocsMime) {
                  resultFiles.push(tf);
                } else {
                  console.debug(`Skipping unsupported target mimeType ${tf.mimeType} for shortcut ${f.name}`);
                }

              } catch (resolveErr) {
                console.warn(`⚠️ Failed to resolve shortcut target for ${f.name}: ${resolveErr.message}`);
              }
            } else {
              console.debug(`Skipping shortcut with no target for file ${f.name}`);
            }

          } else if (directMimeTypes.has(f.mimeType) || f.mimeType === googleDocsMime) {
            resultFiles.push(f);
          } else {
            // non-supported file type: skip but log for debugging
            console.debug(`Skipping unsupported mimeType ${f.mimeType} for file ${f.name}`);
          }
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);
    }

    // Log summary for debugging
    const counts = resultFiles.reduce((acc, f) => {
      acc[f.mimeType] = (acc[f.mimeType] || 0) + 1;
      return acc;
    }, {});
    console.log(`📄 Found ${resultFiles.length} documents in folder ${folderId} (recursive)`, counts);

    // Log first few file names for quick debug
    const sampleNames = resultFiles.slice(0, 10).map(f => `${f.name} (${f.mimeType})`);
    if (sampleNames.length) console.log('🧾 Sample files:', sampleNames.join(', '));

    return resultFiles;

  } catch (err) {
    console.error('❌ Error fetching folder files:', err.message);
    throw err;
  }
}

/**
 * Download file from Google Drive
 * Handles native Google Docs by exporting them as plain text (or PDF if needed).
 */
async function downloadFile(recruiterId, fileId) {
  try {
    const [tokenRows] = await db.query(
      'SELECT access_token, refresh_token FROM google_drive_tokens WHERE recruiter_id = ?',
      [recruiterId]
    );

    if (!tokenRows || tokenRows.length === 0) {
      throw new Error('User not authenticated');
    }

    const tokenData = tokenRows[0];
    oauth2Client.setCredentials({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // First fetch metadata to determine mime type
    const meta = await drive.files.get({ fileId, fields: 'id, name, mimeType' });
    const mimeType = meta.data.mimeType;

    // If it's a Google Doc, export as plain text (more robust than trying to convert on client)
    if (mimeType === 'application/vnd.google-apps.document') {
      try {
        const resp = await drive.files.export({ fileId, mimeType: 'text/plain' }, { responseType: 'arraybuffer' });
        return Buffer.from(resp.data);
      } catch (exportErr) {
        // Fallback: try exporting as PDF
        console.warn(`⚠️ Failed to export Google Doc as text, falling back to PDF: ${exportErr.message}`);
        const pdfResp = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'arraybuffer' });
        return Buffer.from(pdfResp.data);
      }
    }

    // Other files: download media
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data);

  } catch (err) {
    console.error('❌ Error downloading file:', err.message);
    throw err;
  }
}

/**
 * Check if user is authenticated with Google Drive
 */
async function isUserAuthenticated(recruiterId) {
  try {
    const [rows] = await db.query(
      'SELECT id FROM google_drive_tokens WHERE recruiter_id = ?',
      [recruiterId]
    );
    return rows && rows.length > 0;
  } catch (err) {
    return false;
  }
}

module.exports = {
  getAuthUrl,
  handleAuthCallback,
  getUserFolders,
  getFolderFiles,
  downloadFile,
  isUserAuthenticated
};
