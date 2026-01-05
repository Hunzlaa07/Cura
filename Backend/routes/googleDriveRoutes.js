const express = require('express');
const router = express.Router();
const db = require('../src/config/database');
const bulkCVService = require('../services/bulkCVMatchingService');
const cvMatchingService = require('../services/cvMatchingService');
const googleDriveService = require('../services/googleDriveService');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middlewares/authMiddleware');

// NOTE: Do NOT apply authMiddleware globally here because Google will call the GET callback without an Authorization header.
// We'll apply authMiddleware to each protected route individually below.

/**
 * GET /api/bulk-cv/google-auth/url
 * Get authorization URL for user to connect Google Drive
 * Includes `state` param set to the recruiter's profile id so the GET callback can associate the tokens.
 */
router.get('/google-auth/url', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: 'Recruiter profile not found' });
    }

    const recruiterId = recruiterRows[0].id;
    const authUrl = googleDriveService.getAuthUrl(recruiterId);
    res.json({ authUrl });
  } catch (err) {
    console.error('❌ Error getting auth URL:', err);
    res.status(500).json({ error: 'Failed to get authorization URL' });
  }
});

/**
 * GET /api/bulk-cv/google-auth/callback
 * Handle OAuth callback from Google (GET redirect). Expects `code` and `state` query params.
 * State contains the recruiter profile id set during /google-auth/url.
 * This endpoint is intentionally public (no Authorization header) because Google will redirect here.
 */
router.get('/google-auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('Authorization code required');
    }
    if (!state) {
      return res.status(400).send('Missing state to identify recruiter');
    }

    // verify recruiter exists
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE id = ?',
      [state]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).send('Recruiter profile not found');
    }

    const recruiterId = recruiterRows[0].id;

    // Exchange code for tokens and store them
    await googleDriveService.handleAuthCallback(code, recruiterId);

    // Redirect to frontend with a success indicator (frontend should handle this)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/bulk-cv?google_drive_connected=1`);
  } catch (err) {
    console.error('❌ Error in GET OAuth callback:', err);
    return res.status(500).send('Failed to authenticate with Google Drive');
  }
});
/**
 * POST /api/bulk-cv/google-auth/callback
 * Handle OAuth callback (POST). This variant is for SPA flow where the frontend posts the code along with the user's Authorization header.
 */
router.post('/google-auth/callback', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const recruiterId = req.user?.id;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    if (!recruiterId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get recruiter ID from user ID
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [recruiterId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: 'Recruiter profile not found' });
    }

    const recruiterProfileId = recruiterRows[0].id;

    // Handle callback and store tokens
    await googleDriveService.handleAuthCallback(code, recruiterProfileId);

    res.json({ success: true, message: 'Google Drive connected successfully!' });

  } catch (err) {
    console.error('❌ Error in OAuth callback:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google Drive' });
  }
});

/**
 * GET /api/bulk-cv/google-auth/status
 * Check if user is authenticated with Google Drive
 */
router.get('/google-auth/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: 'Recruiter profile not found' });
    }

    const recruiterId = recruiterRows[0].id;
    const isAuthenticated = await googleDriveService.isUserAuthenticated(recruiterId);

    res.json({ authenticated: isAuthenticated });

  } catch (err) {
    console.error('❌ Error checking auth status:', err);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

/**
 * GET /api/bulk-cv/google-drive/folders
 * Get user's folders from Google Drive
 */
router.get('/google-drive/folders', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: 'Recruiter profile not found' });
    }

    const recruiterId = recruiterRows[0].id;
    const folders = await googleDriveService.getUserFolders(recruiterId);

    res.json({ folders });

  } catch (err) {
    console.error('❌ Error fetching folders:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch folders' });
  }
});

/**
 * POST /api/bulk-cv/google-drive/import-folder
 * Import CVs from a Google Drive folder
 */
router.post('/google-drive/import-folder', authMiddleware, async (req, res) => {
  try {
    const { jd, folderId, folder_id } = req.body;
    const resolvedFolderId = folderId || folder_id;
    const userId = req.user?.id;

    console.log(`📥 Import request: user=${userId}, folder=${resolvedFolderId}, jd_length=${jd ? jd.length : 0}`);

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!jd || jd.trim().length < 50) {
      return res.status(400).json({ error: 'Job description must be at least 50 characters' });
    }

    if (!resolvedFolderId) {
      return res.status(400).json({ error: 'Folder ID required' });
    }

    // Get recruiter ID
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(403).json({ error: 'Recruiter profile not found' });
    }

    const recruiterId = recruiterRows[0].id;

    // Create bulk job
    const bulkJob = await bulkCVService.createBulkJob(recruiterId, jd);
    console.log('📋 Bulk job created:', bulkJob.bulk_job_id);

    // Process in background
    setImmediate(async () => {
      try {
        console.log(`🚀 Starting Google Drive folder import for job ${bulkJob.bulk_job_id}...`);

        // Get files from folder
        const files = await googleDriveService.getFolderFiles(recruiterId, resolvedFolderId);

        if (files.length === 0) {
          await db.query(
            `UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`,
            ['No PDF, DOCX, or TXT files found in the selected folder', bulkJob.bulk_job_id]
          );
          return;
        }

        console.log(`📄 Found ${files.length} files to download`);

        // Download and extract CVs
        const cvFiles = [];
        const uploadsDir = path.join(__dirname, '../uploads/bulk_cvs');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const extractCVText = require('../controllers/bulkCVController').extractCVText || (async (filePath, mimetype) => {
          const pdfParse = require('pdf-parse');
          const mammoth = require('mammoth');

          if (mimetype.includes('pdf')) {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
          } else if (mimetype.includes('word')) {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
          } else {
            return fs.readFileSync(filePath, 'utf8');
          }
        });

        for (const file of files) {
          try {
            console.log(`⬇️  Downloading: ${file.name}`);
            const buffer = await googleDriveService.downloadFile(recruiterId, file.id);

            const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
            const filePath = path.join(uploadsDir, uniqueName);
            fs.writeFileSync(filePath, buffer);

            const mimetype = file.mimeType;
            let extractedText = '';

            try {
              extractedText = await extractCVText(filePath, mimetype);
            } catch (extractErr) {
              console.error(`❌ Failed to extract text from ${file.name}:`, extractErr.message);
              extractedText = '';
            }

            if (!extractedText || extractedText.trim().length === 0) {
              console.warn(`⚠️  No text extracted from ${file.name}, skipping`);
              continue;
            }

            cvFiles.push({
              name: file.name,
              text: extractedText,
              file_path: `/uploads/bulk_cvs/${uniqueName}`,
              size: file.size
            });

            console.log(`✅ Downloaded and extracted: ${file.name} (${extractedText.length} chars)`);

          } catch (fileErr) {
            console.error(`❌ Error processing file ${file.name}:`, fileErr.message);
          }
        }

        if (cvFiles.length === 0) {
          await db.query(
            `UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`,
            ['Could not extract text from any files in the folder', bulkJob.bulk_job_id]
          );
          return;
        }

        console.log(`🎯 Downloaded and extracted ${cvFiles.length} files from Google Drive`);

        // Update file count
        await db.query(
          `UPDATE bulk_cv_jobs SET total_files = ? WHERE id = ?`,
          [cvFiles.length, bulkJob.bulk_job_id]
        );

        // Process CVs
        const results = await bulkCVService.processBulkCVs(bulkJob.bulk_job_id, cvFiles, jd);
        console.log('✅ Google Drive import completed');

      } catch (err) {
        console.error('❌ Error in Google Drive import:', err);
        await db.query(
          `UPDATE bulk_cv_jobs SET status = 'error', error_message = ? WHERE id = ?`,
          [err.message, bulkJob.bulk_job_id]
        );
      }
    });

    res.status(202).json({
      success: true,
      bulk_job_id: bulkJob.bulk_job_id,
      status: 'processing'
    });

  } catch (err) {
    console.error('❌ Error starting import:', err);
    res.status(500).json({ error: 'Failed to start import' });
  }
});

module.exports = router;
