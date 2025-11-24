const express = require('express');
const { 
  getJobs, 
  createJob, 
  getRecruiterProfile, 
  updateRecruiterProfile, 
  getJobCandidates, 
  getCVs, 
  getShortlisted, 
  getAllCandidates, 
  shortlistCandidate, 
  removeShortlistedCandidate 
} = require('../controllers/recruiterController');
const authMiddleware = require('../middlewares/authMiddleware');
const languageMiddleware = require('../middlewares/languageMiddleware'); 
const db = require('../src/config/database'); 

const router = express.Router();

// All routes protected by authMiddleware
router.use(authMiddleware);

// LANGUAGE PREFERENCE ENDPOINTS
router.put('/language-preference', async (req, res) => {
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

router.get('/language-preference', async (req, res) => {
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

router.get('/jobs', languageMiddleware, getJobs);
router.post('/jobs', createJob);
router.get('/jobs/:id/candidates', languageMiddleware, getJobCandidates);
router.get('/profile', languageMiddleware, getRecruiterProfile);
router.put('/profile', updateRecruiterProfile); 
router.get('/candidates', languageMiddleware, getAllCandidates);
router.get('/cvs', getCVs);
router.get('/shortlisted', languageMiddleware, getShortlisted);
router.post('/shortlist/:applicantId', shortlistCandidate);
router.delete('/shortlist/:applicantId', removeShortlistedCandidate);

module.exports = router;