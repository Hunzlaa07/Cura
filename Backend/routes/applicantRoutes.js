const express = require("express");
const router = express.Router();
const applicantController = require("../controllers/applicantController"); 
const db = require('../src/config/database'); 
const authMiddleware = require("../middlewares/authMiddleware");
const languageMiddleware = require("../middlewares/languageMiddleware");
const multer = require("multer");
const bcrypt = require('bcryptjs');

// Multer setup
const storage = multer.memoryStorage();
const parser = multer({ storage });
const upload = multer({ storage });

// Test route
router.get("/", (req, res) => {
  res.json({ message: "Applicant route working!" });
});

// LANGUAGE PREFERENCE ENDPOINTS (before authMiddleware routes)
router.put('/language-preference', authMiddleware, async (req, res) => {
  try {
    const { language } = req.body;
    
    if (!['en', 'ar'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language. Must be "en" or "ar"' });
    }
    
    await db.query(
      'UPDATE users SET preferred_language = ?, updated_at = NOW() WHERE id = ?',
      [language, req.user.id]
    );
    
    res.json({ 
      success: true, 
      message: 'Language preference updated',
      language 
    });
  } catch (err) {
    console.error('Error updating language preference:', err);
    res.status(500).json({ error: 'Failed to update language preference' });
  }
});

router.get('/language-preference', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT preferred_language FROM users WHERE id = ?',
      [req.user.id]
    );
    
    res.json({ 
      language: rows[0]?.preferred_language || 'en' 
    });
  } catch (err) {
    console.error('Error fetching language preference:', err);
    res.status(500).json({ error: 'Failed to fetch language preference' });
  }
});

// Profile routes with language support
router.get("/profile", authMiddleware, languageMiddleware, applicantController.getProfile);
router.put("/profile", authMiddleware, applicantController.updateProfile);

// Upload profile photo
router.post(
  "/profile/photo",
  authMiddleware,
  parser.single("photo"),
  applicantController.uploadProfilePicture
);

router.post(
  "/upload-cv",
  authMiddleware,
  upload.single("cv"),
  applicantController.uploadCV
);

router.get("/all-skills", authMiddleware, applicantController.getAllSkills);
router.get("/skills", authMiddleware, applicantController.getSkills);
router.put("/skills", authMiddleware, applicantController.updateSkills);

router.post('/set-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    console.log(`🔐 Password reset request for user ${userId}`);

    // Get user's current password hash
    const [users] = await db.query(
      'SELECT password_hash, email FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // If currentPassword provided, verify it first
    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isValid) {
        // Maybe it's a temp password
        const [invitations] = await db.query(
          `SELECT temp_password FROM case_study_invitations csi
           JOIN job_applications ja ON csi.job_application_id = ja.id
           WHERE ja.email = ?
           ORDER BY csi.created_at DESC LIMIT 1`,
          [user.email]
        );

        if (invitations.length > 0) {
          const isTempValid = await bcrypt.compare(currentPassword, invitations[0].temp_password);
          if (!isTempValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
          }
        } else {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    console.log(`✅ Password updated successfully for user ${userId}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Error setting password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;