// controllers/recruiterController.js
const db = require('../src/config/database');
const translationService = require('../services/translationService');

// Helper function to ensure Arabic fields exist
async function ensureProfileArabicFields(data) {
  const fields = ['company_name', 'department', 'position'];
  
  for (const field of fields) {
    const arField = `${field}_ar`;
    
    // If Arabic field is missing but English exists, translate
    if (!data[arField] && data[field]) {
      console.log(`🔄 Translating ${field} to Arabic...`);
      data[arField] = await translationService.translateToArabic(data[field]);
    }
  }
  
  return data;
}

// Get all jobs for this recruiter
const getJobs = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const lang = req.language || 'en';
    
    const [rows] = await db.query(
      `SELECT 
        id,
        recruiter_id,
        ${lang === 'ar' ? 'COALESCE(title_ar, title)' : 'title'} as title,
        ${lang === 'ar' ? 'COALESCE(description_ar, description)' : 'description'} as description,
        ${lang === 'ar' ? 'COALESCE(department_ar, department)' : 'department'} as department,
        ${lang === 'ar' ? 'COALESCE(location_ar, location)' : 'location'} as location,
        employment_type,
        experience_level,
        status,
        created_at,
        updated_at
      FROM jobs 
      WHERE recruiter_id = ?
      ORDER BY created_at DESC`,
      [recruiterId]
    );
    
    res.json({ jobs: rows, language: lang });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch jobs', details: err });
  }
};

const getRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT 
         u.full_name,
         u.email,
         u.profile_picture,
         u.user_type,
         r.company_name,
         r.department,
         r.position
       FROM users u
       LEFT JOIN recruiter_profiles r ON r.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const profile = rows[0];

    res.json({
      full_name: profile.full_name,
      email: profile.email,
      profile_picture: profile.profile_picture,
      user_type: profile.user_type,
      company_name: profile.company_name,
      department: profile.department,
      position: profile.position,
      language: 'en'
    });
  } catch (err) {
    console.error("Error fetching recruiter profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};


//  Update Recruiter Profile (Bilingual)
const updateRecruiterProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let { 
      company_name, 
      department, 
      position,
      company_name_ar, 
      department_ar, 
      position_ar 
    } = req.body;

    // 🔥 Ensure Arabic fields exist
    const profileData = await ensureProfileArabicFields({
      company_name, 
      department, 
      position,
      company_name_ar, 
      department_ar, 
      position_ar
    });

    // Check if profile exists
    const [existing] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Create profile if it doesn't exist
      await db.query(
        `INSERT INTO recruiter_profiles 
          (user_id, company_name, company_name_ar, department, department_ar, position, position_ar, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          profileData.company_name,
          profileData.company_name_ar,
          profileData.department,
          profileData.department_ar,
          profileData.position,
          profileData.position_ar
        ]
      );
    } else {
      // Update existing profile
      await db.query(
        `UPDATE recruiter_profiles 
         SET company_name = ?, company_name_ar = ?, 
             department = ?, department_ar = ?, 
             position = ?, position_ar = ?, 
             updated_at = NOW()
         WHERE user_id = ?`,
        [
          profileData.company_name,
          profileData.company_name_ar,
          profileData.department,
          profileData.department_ar,
          profileData.position,
          profileData.position_ar,
          userId
        ]
      );
    }

    res.json({ 
      success: true, 
      message: "Profile updated in both languages" 
    });

  } catch (err) {
    console.error("Error updating recruiter profile:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a new job old
const createJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ error: 'No recruiter profile found for this user' });
    }

    const recruiterId = recruiterRows[0].id;

    const {
      title,
      description,
      key_responsibilities,
      department,
      location,
      employment_type,
      experience_level,
      min_experience_years,
      max_experience_years,
      status,
      ai_generated_description,
      expires_at,
    } = req.body;

    const formattedExpiresAt = expires_at ? new Date(expires_at).toISOString().slice(0, 19).replace('T', ' ') : null;

    const [result] = await db.query(
      `INSERT INTO jobs
      (recruiter_id, title, description, key_responsibilities, department, location, employment_type, experience_level, min_experience_years, max_experience_years, status, ai_generated_description, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recruiterId,
        title,
        description,
        key_responsibilities,
        department,
        location,
        employment_type,
        experience_level,
        min_experience_years,
        max_experience_years,
        status,
        ai_generated_description,
        formattedExpiresAt,
      ]
    );

    res.status(201).json({
      id: result.insertId,
      recruiter_id: recruiterId,
      title,
      description,
      key_responsibilities,
      department,
      location,
      employment_type,
      experience_level,
      min_experience_years,
      max_experience_years,
      status,
      ai_generated_description,
      expires_at: formattedExpiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create job', details: err });
  }
};

// Get candidates for a specific job
const getJobCandidates = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const jobId = req.params.id;

    const [jobCheck] = await db.query('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (jobCheck.length === 0) return res.status(403).json({ error: 'Not authorized for this job' });

    const [rows] = await db.query(
      `SELECT a.* 
       FROM applicants a 
       JOIN applications ap ON a.id = ap.applicant_id 
       WHERE ap.job_id = ?`,
      [jobId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch candidates', details: err });
  }
};

const getAllCandidates = async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.language || 'en';

    // Get recruiter profile ID
    const [recruiterRows] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ success: false, error: "No recruiter profile found" });
    }

    const recruiterProfileId = recruiterRows[0].id;

    // 🔥 CORRECTED QUERY: Using job_applications table directly
    const [candidates] = await db.query(`
      SELECT DISTINCT
        ap.id,
        ap.user_id,
        u.full_name,
        u.email,
        u.profile_picture,
        ${lang === 'ar' ? 'COALESCE(ap.title_ar, ap.title)' : 'ap.title'} as title,
        ${lang === 'ar' ? 'COALESCE(ap.bio_ar, ap.bio)' : 'ap.bio'} as bio,
        ap.location,
        ap.preferred_language,
        ap.years_of_experience,
        ap.availability,
        ap.cv_file_path,
        ap.cv_uploaded_at,
        ja.job_id,
        ja.full_name as applicant_full_name,
        ja.email as applicant_email,
        ja.phone,
        ja.last_job_title,
        ja.status,
        ja.applied_at,
        ja.cv_match_score,
        ja.cv_match_level,
        ja.cv_match_details,
        ${lang === 'ar' ? 'COALESCE(j.title_ar, j.title)' : 'j.title'} as job_title,
        COALESCE(f.score, 0) AS ai_score,
        f.rating AS ai_rating
      FROM applicant_profiles ap
      JOIN users u ON u.id = ap.user_id
      JOIN job_applications ja ON ja.user_id = ap.user_id
      JOIN jobs j ON j.id = ja.job_id AND j.recruiter_id = ?
      LEFT JOIN feedbacks f ON f.id = (
        SELECT ff.id 
        FROM feedbacks ff
        WHERE ff.applicant_id = ap.id
        AND ff.job_id = ja.job_id
        ORDER BY ff.submitted_time DESC
        LIMIT 1
      )
      WHERE ap.id NOT IN (
        SELECT applicant_id FROM shortlists WHERE recruiter_id = ?
      )
      ORDER BY ja.applied_at DESC
    `, [recruiterProfileId, recruiterProfileId]);

    // Get skills for each candidate
    const candidatesWithSkills = await Promise.all(
      candidates.map(async (candidate) => {
        const [skills] = await db.query(
          `SELECT s.name, s.category, aks.proficiency_level, aks.years_of_experience
           FROM applicant_skills aks
           JOIN skills s ON aks.skill_id = s.id
           WHERE aks.applicant_id = ?
           ORDER BY s.name`,
          [candidate.id]
        );

        return {
          ...candidate,
          skills: skills.map(s => s.name),
          status: candidate.status // Status from job_applications table
        };
      })
    );

    res.json({ 
      success: true, 
      data: candidatesWithSkills,
      language: lang 
    });
  } catch (err) {
    console.error("Error in getAllCandidates:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// 🔥 FIXED: Get CVs (Only for candidates who applied to this recruiter's jobs)
const getCVs = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recruiter profile ID
    const [recruiterRows] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ success: false, error: "No recruiter profile found" });
    }

    const recruiterProfileId = recruiterRows[0].id;

    // 🔥 FIXED QUERY: Only get CVs from candidates who applied to THIS recruiter's jobs
    const [cvs] = await db.query(`
      SELECT DISTINCT
        cv.id, 
        cv.applicant_id, 
        cv.file_name, 
        cv.file_path, 
        cv.language, 
        cv.uploaded_at
      FROM cv_documents cv
      JOIN applicant_profiles ap ON ap.id = cv.applicant_id
      JOIN job_applications ja ON ja.user_id = ap.user_id
      JOIN jobs j ON j.id = ja.job_id
      WHERE j.recruiter_id = ?
        AND cv.is_active = 1
      ORDER BY cv.uploaded_at DESC
    `, [recruiterProfileId]);

    res.json({ success: true, data: cvs });
  } catch (err) {
    console.error("❌ Error in getCVs:", err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

//  Get Shortlisted (Language-Aware)
const getShortlisted = async (req, res) => {
  try {
    const userId = req.user.id;
    const lang = req.language || 'en';

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No recruiter profile found' });
    }

    const recruiterProfileId = recruiterRows[0].id;

    const [shortlisted] = await db.query(`
      SELECT 
        s.id AS shortlist_id,
        s.notes,
        s.shortlisted_at,
        s.job_id,
        ap.id AS applicant_id,
        u.full_name AS applicant_name,
        u.profile_picture,
        ${lang === 'ar' ? 'COALESCE(ap.title_ar, ap.title)' : 'ap.title'} as title,
        ${lang === 'ar' ? 'COALESCE(j.title_ar, j.title)' : 'j.title'} as job_title,
        f.score AS ai_score,
        f.cv_match_score
      FROM shortlists s
      JOIN applicant_profiles ap ON ap.id = s.applicant_id
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN jobs j ON j.id = s.job_id
      LEFT JOIN feedbacks f ON f.applicant_id = ap.id AND f.job_id = s.job_id
      WHERE s.recruiter_id = ?
      ORDER BY s.shortlisted_at DESC
    `, [recruiterProfileId]);

    res.json({ 
      success: true, 
      data: shortlisted,
      language: lang 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

const shortlistCandidate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicantId } = req.params;
    const { job_id, notes } = req.body;

    const [recruiterRows] = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ success: false, error: 'No recruiter profile found' });
    }

    const recruiterProfileId = recruiterRows[0].id;

    const [applicantRows] = await db.query(
      'SELECT id FROM applicant_profiles WHERE id = ?',
      [applicantId]
    );

    if (applicantRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Applicant not found' });
    }

    if (job_id) {
      const [jobRows] = await db.query(
        'SELECT id FROM jobs WHERE id = ?',
        [job_id]
      );

      if (jobRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found' });
      }
    }

    const [existing] = await db.query(
      'SELECT id FROM shortlists WHERE recruiter_id = ? AND applicant_id = ? AND job_id = ?',
      [recruiterProfileId, applicantId, job_id || null]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Candidate already shortlisted for this job' });
    }

    const [result] = await db.query(
      'INSERT INTO shortlists (recruiter_id, applicant_id, job_id, notes, shortlisted_at) VALUES (?, ?, ?, ?, NOW())',
      [recruiterProfileId, applicantId, job_id || null, notes || null]
    );

    const [newShortlist] = await db.query(`
      SELECT 
        s.id AS shortlist_id,
        s.shortlisted_at,
        s.job_id,
        s.notes,
        ap.id AS applicant_id,
        u.full_name AS applicant_name,
        u.profile_picture,
        ap.title,
        j.title AS job_title,
        f.score AS ai_score,
        f.cv_match_score
      FROM shortlists s
      JOIN applicant_profiles ap ON ap.id = s.applicant_id
      JOIN users u ON u.id = ap.user_id
      LEFT JOIN jobs j ON j.id = s.job_id
      LEFT JOIN feedbacks f ON f.applicant_id = ap.id AND f.job_id = s.job_id
      WHERE s.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      success: true, 
      message: 'Candidate shortlisted successfully',
      data: newShortlist[0] 
    });

  } catch (err) {
    console.error('❌ shortlistCandidate Error:', err);
    
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid job_id or applicant_id - referenced record does not exist' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to shortlist candidate', 
      details: err.message 
    });
  }
};

const removeShortlistedCandidate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { applicantId } = req.params;

    console.log("🗑 Removing from shortlist:", { userId, applicantId });

    const [recruiterRows] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (recruiterRows.length === 0) {
      return res.status(400).json({ error: "Recruiter profile not found" });
    }

    const recruiterProfileId = recruiterRows[0].id;

    const [result] = await db.query(
      "DELETE FROM shortlists WHERE recruiter_id = ? AND applicant_id = ?",
      [recruiterProfileId, applicantId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Shortlisted candidate not found" });
    }

    res.json({ message: "Candidate removed from shortlist successfully" });
  } catch (err) {
    console.error("❌ removeShortlistedCandidate Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getJobs,
  createJob,
  getJobCandidates,
  getAllCandidates,
  getCVs,
  getShortlisted,
  shortlistCandidate,
  getRecruiterProfile,
  updateRecruiterProfile,
  removeShortlistedCandidate
};