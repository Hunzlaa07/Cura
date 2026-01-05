// controllers/jobsController.js 
const pool = require("../src/config/database");
const db = require("../src/config/database"); 
const crypto = require('crypto');
const translationService = require('../services/translationService');
const aiService = require('../services/aiService'); // ✅ Import AI Service

function getLocalizedField(fieldName, language) {
  if (language === 'ar') {
    return `COALESCE(${fieldName}_ar, ${fieldName}) as ${fieldName}`;
  }
  return `${fieldName}`;
}
function formatResponsibilities(responsibilities) {
  if (Array.isArray(responsibilities)) {
    return responsibilities
      .map(r => r.trim())
      .filter(r => r.length > 0)
      .join('\n');
  }
  return responsibilities || '';
}
async function ensureArabicFields(data) {
  const fields = ['title', 'description', 'key_responsibilities', 'department', 'location'];
  
  for (const field of fields) {
    const arField = `${field}_ar`;
    
    // If Arabic field is missing or empty, translate the English version
    if (!data[arField] && data[field]) {
      console.log(`🔄 Translating ${field} to Arabic...`);
      data[arField] = await translationService.translateToArabic(data[field]);
    }
  }
  
  return data;
}

exports.getJobs = async (req, res) => {
  try {
    const lang = req.language || 'en'; // Set by languageMiddleware
    const userId = req.user?.id; // Get logged-in user ID
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Get the recruiter ID from the recruiters table using user_id
    const [recruiterRows] = await pool.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = ?',
      [userId]
    );
    
    if (!recruiterRows.length) {
      return res.status(200).json({ jobs: [], language: lang, total: 0 });
    }
    
    const recruiterId = recruiterRows[0].id;
    console.log('getJobs - userId:', userId, 'recruiterId:', recruiterId);
    
    const [rows] = await pool.query(
      `SELECT 
        j.id,
        j.recruiter_id,
        ${lang === 'ar' ? 'COALESCE(j.title_ar, j.title)' : 'j.title'} as title,
        ${lang === 'ar' ? 'COALESCE(j.description_ar, j.description)' : 'j.description'} as description,
        ${lang === 'ar' ? 'COALESCE(j.key_responsibilities_ar, j.key_responsibilities)' : 'j.key_responsibilities'} as key_responsibilities,
        ${lang === 'ar' ? 'COALESCE(j.department_ar, j.department)' : 'j.department'} as department,
        ${lang === 'ar' ? 'COALESCE(j.location_ar, j.location)' : 'j.location'} as location,
        j.employment_type,
        j.experience_level,
        j.min_experience_years,
        j.max_experience_years,
        j.status,
        j.is_open,
        j.share_link,
        j.application_deadline,
        j.created_at,
        j.updated_at,
        CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END as has_case_study
      FROM jobs j
      LEFT JOIN case_studies cs ON j.id = cs.job_id AND cs.is_active = 1
      WHERE j.recruiter_id = ?
      ORDER BY j.created_at DESC`,
      [recruiterId]
    );
    
    console.log('getJobs - found jobs:', rows.length);
    
    // Convert has_case_study to boolean
    const jobsWithBoolean = rows.map(job => ({
      ...job,
      has_case_study: Boolean(job.has_case_study)
    }));
    
    res.status(200).json({ 
      jobs: jobsWithBoolean, 
      language: lang,
      total: jobsWithBoolean.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = req.language || 'en';
    
    const [rows] = await pool.query(
      `SELECT 
        id,
        recruiter_id,
        ${lang === 'ar' ? 'COALESCE(title_ar, title)' : 'title'} as title,
        ${lang === 'ar' ? 'COALESCE(description_ar, description)' : 'description'} as description,
        ${lang === 'ar' ? 'COALESCE(key_responsibilities_ar, key_responsibilities)' : 'key_responsibilities'} as key_responsibilities,
        ${lang === 'ar' ? 'COALESCE(department_ar, department)' : 'department'} as department,
        ${lang === 'ar' ? 'COALESCE(location_ar, location)' : 'location'} as location,
        employment_type,
        experience_level,
        min_experience_years,
        max_experience_years,
        status,
        is_open,
        application_deadline,
        created_at,
        updated_at
      FROM jobs 
      WHERE id = ?`,
      [id]
    );
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Get required skills for this job
    const [skills] = await pool.query(
      `SELECT s.id, s.name, s.category, js.is_required, js.minimum_proficiency
       FROM job_skills js
       JOIN skills s ON s.id = js.skill_id
       WHERE js.job_id = ?`,
      [id]
    );

    res.status(200).json({
      ...rows[0],
      required_skills: skills,
      language: lang
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// middleware function to automatically close expired jobs
async function checkAndCloseExpiredJobs(jobId = null) {
  try {
    const query = jobId 
      ? `UPDATE jobs 
         SET is_open = 0, updated_at = NOW() 
         WHERE id = ? AND application_deadline < NOW() AND is_open = 1`
      : `UPDATE jobs 
         SET is_open = 0, updated_at = NOW() 
         WHERE application_deadline < NOW() AND is_open = 1`;

    const params = jobId ? [jobId] : [];
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows > 0) {
      console.log(`✅ Auto-closed ${result.affectedRows} expired job(s)`);
    }
    
    return result.affectedRows;
  } catch (err) {
    console.error("Error auto-closing expired jobs:", err);
    return 0;
  }
}

// Fixed getMyJobs - explicitly select ALL fields including _ar columns
// Add this BEFORE the main query to debug
exports.getMyJobs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [recruiterRows] = await pool.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ message: "No recruiter profile found for this user" });
    }

    const recruiterId = recruiterRows[0].id;

    // 🔥 AUTO-CLOSE EXPIRED JOBS before fetching
    await checkAndCloseExpiredJobs();

    // 🔍 DEBUG: Check raw job data with Arabic fields
    console.log("🔍 DEBUG: Checking for Arabic fields in database...");
    const [rawJobs] = await pool.query(
      `SELECT id, title, title_ar, department, department_ar FROM jobs WHERE recruiter_id = ? LIMIT 1`,
      [recruiterId]
    );
    
    if (rawJobs.length > 0) {
      console.log("🔍 Raw job from DB:", rawJobs[0]);
      console.log(`   - title_ar value: ${rawJobs[0].title_ar}`);
      console.log(`   - title_ar is null: ${rawJobs[0].title_ar === null}`);
      console.log(`   - title_ar is undefined: ${rawJobs[0].title_ar === undefined}`);
    }

    // ✅ MAIN QUERY - select all fields
    const [jobs] = await pool.query(
      `SELECT 
        j.id,
        j.recruiter_id,
        j.title,
        j.title_ar,
        j.description,
        j.description_ar,
        j.key_responsibilities,
        j.key_responsibilities_ar,
        j.department,
        j.department_ar,
        j.location,
        j.location_ar,
        j.employment_type,
        j.experience_level,
        j.min_experience_years,
        j.max_experience_years,
        j.status,
        j.is_open,
        j.share_link,
        j.application_deadline,
        j.created_at,
        j.updated_at,
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END) as pending_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'reviewed' THEN ja.id END) as reviewed_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'shortlisted' THEN ja.id END) as shortlisted_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'case_study_sent' THEN ja.id END) as case_study_sent_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'case_study_completed' THEN ja.id END) as case_study_completed_count,
        MAX(cs.id) as case_study_id,
        MAX(cs.title) as case_study_title,
        MAX(cs.status) as case_study_status,
        COUNT(DISTINCT csi.id) as case_study_invitations_sent,
        CASE 
          WHEN j.application_deadline < NOW() THEN 'expired'
          WHEN j.is_open = 1 THEN 'open'
          ELSE 'closed'
        END as job_status
      FROM jobs j
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      LEFT JOIN case_studies cs ON j.id = cs.job_id AND cs.status = 'published'
      LEFT JOIN case_study_invitations csi ON j.id = csi.job_id
      WHERE j.recruiter_id = ?
      GROUP BY j.id
      ORDER BY j.created_at DESC`,
      [recruiterId]
    );

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found for this recruiter" });
    }

    // 🔍 DEBUG: Log the returned fields
    console.log(`✅ Found ${jobs.length} jobs`);
    console.log("🔍 First job returned fields:", Object.keys(jobs[0]));
    console.log("🔍 First job title_ar:", jobs[0].title_ar);
    console.log("🔍 First job full object:", JSON.stringify(jobs[0], null, 2).substring(0, 500));

    res.status(200).json({ jobs });
  } catch (err) {
    console.error("Error fetching recruiter jobs:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
// ✅ Extract skills from job description using AI Service
async function extractSkillsFromDescription(title, description, keyResponsibilities) {
  try {
    const prompt = `
You are an expert HR analyst. Extract the key technical and soft skills required for this job.

JOB TITLE: ${title}
DESCRIPTION: ${description}
KEY RESPONSIBILITIES: ${keyResponsibilities}

Extract 5-8 most important skills. For each skill, determine:
1. The skill name (e.g., "JavaScript", "Problem Solving", "Communication")
2. Whether it's REQUIRED or PREFERRED
3. Minimum proficiency level needed: beginner, intermediate, advanced, or expert

Return ONLY a JSON array, no other text:
[
  {
    "skill_name": "JavaScript",
    "is_required": true,
    "minimum_proficiency": "intermediate",
    "category": "Technical"
  },
  {
    "skill_name": "Problem Solving",
    "is_required": true,
    "minimum_proficiency": "advanced",
    "category": "Soft Skill"
  }
]

CRITICAL: Return ONLY the JSON array, no markdown, no extra text.
    `.trim();

    // ✅ Use AI Service instead of direct Gemini call
    const response = await aiService.generateContent(prompt);
    const extractedSkills = JSON.parse(response);
    return extractedSkills;
  } catch (err) {
    console.error("Skill extraction error:", err);
    return [];
  }
}

// Match or create skills in database
async function matchOrCreateSkills(extractedSkills) {
  const skillMappings = [];

  for (const extracted of extractedSkills) {
    try {
      // Try to find existing skill
      const [existing] = await pool.query(
        "SELECT id FROM skills WHERE LOWER(name) = LOWER(?)",
        [extracted.skill_name]
      );

      let skillId;

      if (existing.length > 0) {
        // Use existing skill
        skillId = existing[0].id;
      } else {
        // Create new skill
        const [result] = await pool.query(
          "INSERT INTO skills (name, category, created_at) VALUES (?, ?, NOW())",
          [extracted.skill_name, extracted.category || 'General']
        );
        skillId = result.insertId;
      }

      skillMappings.push({
        skill_id: skillId,
        is_required: extracted.is_required ? 1 : 0,
        minimum_proficiency: extracted.minimum_proficiency || 'intermediate'
      });
    } catch (err) {
      console.error(`Error processing skill ${extracted.skill_name}:`, err);
    }
  }

  return skillMappings;
}

// ✅ Generate AI Job Description with Custom Instructions - IMPROVED
exports.generateJobDescription = async (req, res) => {
  try {
    const { 
      title, 
      skills, 
      experience_level, 
      department, 
      location,
      custom_instructions // 🆕 NEW: Custom instructions from user
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // 🆕 Build instructions section with user input
    let instructionsSection = `
COMPANY CONTEXT & PREFERENCES:
${custom_instructions || 'Standard job description'}

ADDITIONAL DETAILS:
- Required Skills: ${skills || 'Not specified'}
- Experience Level: ${experience_level || 'Any'}
- Department: ${department || 'Not specified'}
- Location: ${location || 'Remote/Hybrid'}
`;

    // BILINGUAL PROMPT - Generate in both languages
    const prompt = `
You are an expert HR analyst and job description writer. Create a professional, engaging, and detailed job description.

${instructionsSection}

ROLE DETAILS:
Job Title: ${title}
Department: ${department || "Not specified"}
Location: ${location || "Remote/Hybrid"}
Experience Level: ${experience_level || "Any"}
Required Skills: ${skills || "Not specified"}

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST provide content in BOTH languages (English and Arabic)
2. "about_role" should be 2-3 paragraphs separated by \\n\\n
3. "key_responsibilities" MUST be formatted as bullet points with \\n between each
4. Each responsibility should start with • or - symbol
5. Provide 5-8 specific, actionable responsibilities
6. "required_skills" should list skills with \\n between each
7. Make the content engaging, specific, and tailored to the company context if provided

Return this EXACT JSON structure (no markdown, no code blocks):
{
  "en": {
    "about_role": "2-3 paragraph description about the role, tailored to the company context",
    "key_responsibilities": "• First responsibility\\n• Second responsibility\\n• Third responsibility\\n• Fourth responsibility\\n• Fifth responsibility",
    "required_skills": "• Skill 1 with proficiency level\\n• Skill 2 with proficiency level\\n• Skill 3 with proficiency level"
  },
  "ar": {
    "about_role": "وصف من 2-3 فقرات عن الدور باللغة العربية",
    "key_responsibilities": "• المسؤولية الأولى\\n• المسؤولية الثانية\\n• المسؤولية الثالثة\\n• المسؤولية الرابعة\\n• المسؤولية الخامسة",
    "required_skills": "• المهارة الأولى مع مستوى الكفاءة\\n• المهارة الثانية مع مستوى الكفاءة\\n• المهارة الثالثة مع مستوى الكفاءة"
  }
}

IMPORTANT RULES:
- Use actual escaped newlines (\\n) in the JSON, NOT literal newlines
- Do NOT include any markdown code blocks or backticks
- Do NOT include any additional text before or after the JSON
- Return ONLY the JSON object
- Do NOT use actual line breaks inside JSON strings
- Make sure responsibilities are specific and actionable
- Include both technical and soft skills as appropriate
    `.trim();

    console.log("🤖 Requesting AI-generated job description with instructions...");
    
    // ✅ Use AI Service instead of direct Gemini call
    let aiContent = await aiService.generateContent(prompt);
    
    // ✅ Clean the response
    aiContent = aiContent.trim();
    
    // Remove markdown code blocks if present
    if (aiContent.startsWith('```json')) {
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (aiContent.startsWith('```')) {
      aiContent = aiContent.replace(/```\n?/g, '');
    }
    
    aiContent = aiContent.trim();
    
    console.log("📝 Raw AI Response (first 500 chars):", aiContent.substring(0, 500));
    
    // ✅ CRITICAL FIX: Handle actual newlines in string values
    let processedContent = aiContent;
    
    // More robust approach: Parse character by character
    let inString = false;
    let escapeNext = false;
    let result = '';
    
    for (let i = 0; i < processedContent.length; i++) {
      const char = processedContent[i];
      const nextChar = processedContent[i + 1];
      
      if (escapeNext) {
        result += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        result += char;
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        result += char;
        continue;
      }
      
      // If we're inside a string and encounter a real newline, escape it
      if (inString && (char === '\n' || char === '\r')) {
        if (char === '\r' && nextChar === '\n') {
          result += '\\n';
          i++;
        } else {
          result += '\\n';
        }
        continue;
      }
      
      result += char;
    }
    
    processedContent = result;
    
    console.log("✅ After cleaning newlines (first 500 chars):", processedContent.substring(0, 500));
    
    // ✅ Parse JSON with better error handling
    let bilingualContent;
    try {
      console.log("✅ Attempting to parse cleaned JSON...");
      bilingualContent = JSON.parse(processedContent);
      console.log("✅ JSON parsed successfully!");
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError.message);
      console.error("❌ Problem at position:", parseError.message.match(/position \d+/)?.[0]);
      console.error("📋 Cleaned content sample:", processedContent.substring(0, 500));
      
      // Last resort: try to extract valid JSON structure
      const jsonStart = processedContent.indexOf('{');
      const jsonEnd = processedContent.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        console.log("🔍 Attempting final extraction...");
        try {
          const extracted = processedContent.substring(jsonStart, jsonEnd + 1);
          bilingualContent = JSON.parse(extracted);
          console.log("✅ Successfully extracted and parsed JSON!");
        } catch (finalError) {
          console.error("❌ Final extraction failed:", finalError.message);
          throw new Error(`Failed to parse AI response. Error: ${parseError.message}`);
        }
      } else {
        throw new Error(`Failed to parse AI response. Content: ${processedContent.substring(0, 200)}...`);
      }
    }

    // ✅ Validate required structure
    if (!bilingualContent.en || !bilingualContent.ar) {
      throw new Error("AI response missing required 'en' or 'ar' fields");
    }

    if (!bilingualContent.en.about_role || !bilingualContent.en.key_responsibilities) {
      throw new Error("AI response missing required content fields (about_role, key_responsibilities)");
    }

    console.log("✅ Successfully parsed bilingual content");

    // Extract skills (existing function works on English)
    const extractedSkills = await extractSkillsFromDescription(
      title,
      bilingualContent.en.about_role,
      bilingualContent.en.key_responsibilities
    );

    res.status(200).json({
      // English fields
      description: bilingualContent.en.about_role,
      key_responsibilities: bilingualContent.en.key_responsibilities,
      required_skills: bilingualContent.en.required_skills || '',
      
      // Arabic fields
      description_ar: bilingualContent.ar.about_role,
      key_responsibilities_ar: bilingualContent.ar.key_responsibilities,
      required_skills_ar: bilingualContent.ar.required_skills || '',
      
      extracted_skills: extractedSkills
    });

  } catch (err) {
    console.error("❌ AI Generation Error:", err.message);
    console.error("Full error:", err);
    
    res.status(500).json({
      error: "Failed to generate job description",
      details: err.message,
      type: err.constructor.name
    });
  }
};


//  Create Job with English + Arabic fields
exports.createJob = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;
    const [recruiterRows] = await connection.query(
      "SELECT id, plan_type FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows?.length) {
      await connection.rollback();
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;
    const planType = recruiterRows[0].plan_type || 'full';

    if (planType === 'case_only') {
      await connection.rollback();
      return res.status(403).json({ error: "Your plan does not allow job creation. Please upgrade to enable job postings." });
    }

    const {
      title,
      title_ar,
      description,
      description_ar,
      key_responsibilities,
      key_responsibilities_ar,
      department,
      department_ar,
      location,
      location_ar,
      employment_type,
      experience_level,
      min_experience_years = null,
      max_experience_years = null,
      status = "active",
      expires_at
    } = req.body;

    // 1️⃣ Insert bilingual job fields
    const [result] = await connection.query(
      `INSERT INTO jobs 
        (recruiter_id, title, title_ar, description, description_ar, 
         key_responsibilities, key_responsibilities_ar, department, department_ar, 
         location, location_ar, employment_type, experience_level, 
         min_experience_years, max_experience_years, status, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        recruiterId,
        title,
        title_ar,
        description,
        description_ar,
        key_responsibilities,
        key_responsibilities_ar,
        department,
        department_ar,
        location,
        location_ar,
        employment_type,
        experience_level,
        min_experience_years,
        max_experience_years,
        status,
        expires_at
      ]
    );

    const jobId = result.insertId;

    // 2️⃣ Extract and link skills
    const extractedSkills = await extractSkillsFromDescription(
      title,
      description,
      key_responsibilities
    );

    if (extractedSkills.length) {
      const skillMappings = await matchOrCreateSkills(extractedSkills);
      if (skillMappings.length) {
        const values = skillMappings.map(mapping => [
          jobId,
          mapping.skill_id,
          mapping.is_required,
          mapping.minimum_proficiency
        ]);

        await connection.query(
          `INSERT INTO job_skills (job_id, skill_id, is_required, minimum_proficiency)
           VALUES ?`,
          [values]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      jobId,
      message: `Job created successfully with bilingual fields.`,
      extractedSkills: extractedSkills.length
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error creating job:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  } finally {
    connection.release();
  }
};

// Generate unique share link
function generateShareLink() {
  return crypto.randomBytes(6).toString('hex'); // e.g., 'a3f9c2b1d4e5'
}

// Create Job with Share Link & Application Deadline
// Create Job with Deadline - FIXED
exports.createJobWithDeadline = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const userId = req.user.id;

    const [recruiterRows] = await connection.query(
      "SELECT id, plan_type FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;
    const planType = recruiterRows[0].plan_type || 'full';

    if (planType === 'case_only') {
      await connection.rollback();
      return res.status(403).json({ error: "Your plan does not allow job creation. Please upgrade to enable job postings." });
    }

    let {
      title,
      description,
      key_responsibilities,
      department,
      location,
      employment_type,
      experience_level,
      min_experience_years = null,
      max_experience_years = null,
      application_deadline,
      status = "active",
      title_ar,
      description_ar,
      key_responsibilities_ar,
      department_ar,
      location_ar
    } = req.body;

    if (!application_deadline) {
      await connection.rollback();
      return res.status(400).json({ error: "Application deadline is required" });
    }

    // ✅ CRITICAL FIX: Convert arrays to strings
    key_responsibilities = formatResponsibilities(key_responsibilities);
    key_responsibilities_ar = formatResponsibilities(key_responsibilities_ar);

    // Ensure Arabic fields are translated if missing
    const jobData = await ensureArabicFields({
      title, 
      description, 
      key_responsibilities, 
      department, 
      location,
      title_ar, 
      description_ar, 
      key_responsibilities_ar, 
      department_ar, 
      location_ar
    });

    title_ar = jobData.title_ar;
    description_ar = jobData.description_ar;
    key_responsibilities_ar = jobData.key_responsibilities_ar;
    department_ar = jobData.department_ar;
    location_ar = jobData.location_ar;

    // Format deadline
    let formattedDeadline;
    try {
      const date = new Date(application_deadline);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      formattedDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (dateErr) {
      await connection.rollback();
      return res.status(400).json({ 
        error: "Invalid date format",
        details: dateErr.message 
      });
    }

    const shareLink = crypto.randomBytes(6).toString('hex');

    console.log("📝 Job Payload Summary:");
    console.log(`  Title: ${title}`);
    console.log(`  Title AR: ${title_ar}`);
    console.log(`  Description Length: ${description.length} chars`);
    console.log(`  Responsibilities (EN): ${key_responsibilities.length} chars`);
    console.log(`  Responsibilities (AR): ${key_responsibilities_ar.length} chars`);
    console.log(`  Department: ${department} / ${department_ar}`);
    console.log(`  Location: ${location} / ${location_ar}`);

    // ✅ FIXED: Proper INSERT with all 21 columns
    const [result] = await connection.query(
      `INSERT INTO jobs 
        (recruiter_id, title, title_ar, description, description_ar, 
         key_responsibilities, key_responsibilities_ar, department, department_ar, 
         location, location_ar, employment_type, experience_level, 
         min_experience_years, max_experience_years, status, is_open, 
         share_link, application_deadline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        recruiterId,                  // 1
        title,                        // 2
        title_ar,                     // 3
        description,                  // 4
        description_ar,               // 5
        key_responsibilities,         // 6
        key_responsibilities_ar,      // 7
        department,                   // 8
        department_ar,                // 9
        location,                     // 10
        location_ar,                  // 11
        employment_type,              // 12
        experience_level,             // 13
        min_experience_years,         // 14
        max_experience_years,         // 15
        status,                       // 16
        1,                            // 17 - is_open
        shareLink,                    // 18
        formattedDeadline             // 19
        // created_at and updated_at are handled by NOW()
      ]
    );

    const jobId = result.insertId;

    console.log("🤖 Extracting skills using AI...");
    const extractedSkills = await extractSkillsFromDescription(
      title,
      description,
      key_responsibilities
    );

    if (extractedSkills.length > 0) {
      const skillMappings = await matchOrCreateSkills(extractedSkills);

      if (skillMappings.length > 0) {
        const values = skillMappings.map(mapping => [
          jobId,
          mapping.skill_id,
          mapping.is_required,
          mapping.minimum_proficiency
        ]);

        await connection.query(
          `INSERT INTO job_skills (job_id, skill_id, is_required, minimum_proficiency)
           VALUES ?`,
          [values]
        );
      }
    }

    await connection.query(
      `INSERT INTO job_activity_log (job_id, recruiter_id, action, details, created_at)
       VALUES (?, ?, 'created', ?, NOW())`,
      [jobId, recruiterId, `Job created with deadline: ${formattedDeadline}`]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      jobId,
      shareLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${shareLink}`,
      application_deadline: formattedDeadline,
      extractedSkills: extractedSkills.length,
      message: "Job created successfully in both languages"
    });

  } catch (err) {
    await connection.rollback();
    console.error("Error creating job:", err);
    res.status(500).json({ 
      error: "Server error", 
      details: err.message,
      sql: err.sql 
    });
  } finally {
    connection.release();
  }
};

// Updated getMyJobsWithStats - NOW returns BOTH English and Arabic fields
exports.getMyJobsWithStats = async (req, res) => {
  try {
    const user = req.user;
    const lang = req.language || 'en';

    if (user.user_type !== "recruiter") {
      return res.status(403).json({ error: "Only recruiters can view their jobs" });
    }

    const [recruiterProfile] = await db.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [user.id]
    );

    if (!recruiterProfile || recruiterProfile.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterProfile[0].id;

    // Auto-close expired jobs
    await checkAndCloseExpiredJobs();

    // ✅ UPDATED: Explicitly select ALL fields including both EN and AR versions
    const [jobs] = await db.query(
      `SELECT 
        j.id,
        j.recruiter_id,
        j.title,
        j.title_ar,
        j.description,
        j.description_ar,
        j.key_responsibilities,
        j.key_responsibilities_ar,
        j.department,
        j.department_ar,
        j.location,
        j.location_ar,
        j.employment_type,
        j.experience_level,
        j.min_experience_years,
        j.max_experience_years,
        j.status,
        j.is_open,
        j.share_link,
        j.application_deadline,
        j.created_at,
        j.updated_at,
        r.company_name,
        r.company_name_ar,
        COUNT(DISTINCT ja.id) as total_applications,
        COUNT(DISTINCT CASE WHEN ja.status = 'pending' THEN ja.id END) as pending_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'reviewed' THEN ja.id END) as reviewed_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'shortlisted' THEN ja.id END) as shortlisted_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'case_study_sent' THEN ja.id END) as case_study_sent_count,
        COUNT(DISTINCT CASE WHEN ja.status = 'case_study_completed' THEN ja.id END) as case_study_completed_count,
        MAX(cs.id) as case_study_id,
        MAX(cs.title) as case_study_title,
        MAX(cs.status) as case_study_status,
        COUNT(DISTINCT csi.id) as case_study_invitations_sent,
        CASE 
          WHEN j.application_deadline < NOW() THEN 'expired'
          WHEN j.is_open = 1 THEN 'open'
          ELSE 'closed'
        END as job_status
      FROM jobs j
      JOIN recruiter_profiles r ON j.recruiter_id = r.id
      LEFT JOIN job_applications ja ON j.id = ja.job_id
      LEFT JOIN case_studies cs ON j.id = cs.job_id AND cs.status = 'published'
      LEFT JOIN case_study_invitations csi ON j.id = csi.job_id
      WHERE j.recruiter_id = ?
      GROUP BY j.id, r.company_name, r.company_name_ar
      ORDER BY j.created_at DESC`,
      [recruiterId]
    );

    console.log(`✅ Found ${jobs.length} jobs for recruiter ${user.email}`);

    // 🔍 DEBUG: Log the returned fields
    if (jobs.length > 0) {
      console.log("🔍 First job returned fields:", Object.keys(jobs[0]));
      console.log("🔍 First job (EN):", {
        title: jobs[0].title,
        department: jobs[0].department,
        location: jobs[0].location
      });
      console.log("🔍 First job (AR):", {
        title_ar: jobs[0].title_ar,
        department_ar: jobs[0].department_ar,
        location_ar: jobs[0].location_ar
      });
    }

    res.json({ 
      jobs,
      language: lang 
    });
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ error: "Failed to fetch jobs", details: err.message });
  }
};

// Toggle Job Open/Closed
exports.toggleJobStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [recruiterRows] = await pool.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    // Check ownership
    const [jobRows] = await pool.query(
      "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
      [id, recruiterId]
    );

    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];
    const newStatus = job.is_open ? 0 : 1;

    // Update status
    await pool.query(
      "UPDATE jobs SET is_open = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO job_activity_log (job_id, recruiter_id, action, details, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [id, recruiterId, newStatus ? 'opened' : 'closed', `Job ${newStatus ? 'opened' : 'closed'} manually`]
    );

    res.json({
      success: true,
      message: `Job ${newStatus ? 'opened' : 'closed'} successfully`,
      is_open: newStatus
    });

  } catch (err) {
    console.error("Error toggling job status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Extend Application Deadline
exports.extendDeadline = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { new_deadline } = req.body;

    if (!new_deadline) {
      return res.status(400).json({ error: "New deadline is required" });
    }

    // Parse and format the deadline to MySQL DATETIME format
    let formattedDeadline;
    try {
      const date = new Date(new_deadline);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      // Format: YYYY-MM-DD HH:MM:SS
      formattedDeadline = date.toISOString().slice(0, 19).replace('T', ' ');
    } catch (dateErr) {
      return res.status(400).json({ 
        error: "Invalid date format. Please use ISO format (YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SS)" 
      });
    }

    const [recruiterRows] = await pool.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    // Check ownership
    const [jobRows] = await pool.query(
      "SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?",
      [id, recruiterId]
    );

    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const oldDeadline = jobRows[0].application_deadline;

    // Update deadline
    await pool.query(
      "UPDATE jobs SET application_deadline = ?, updated_at = NOW() WHERE id = ?",
      [formattedDeadline, id]
    );

    // Log activity
    await pool.query(
      `INSERT INTO job_activity_log (job_id, recruiter_id, action, details, created_at)
       VALUES (?, ?, 'deadline_extended', ?, NOW())`,
      [id, recruiterId, `Deadline extended from ${oldDeadline} to ${formattedDeadline}`]
    );

    res.json({
      success: true,
      message: "Application deadline extended successfully",
      new_deadline: formattedDeadline
    });

  } catch (err) {
    console.error("Error extending deadline:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const lang = req.language || 'en';

    const [recruiterRows] = await pool.query(
      "SELECT id FROM recruiter_profiles WHERE user_id = ?",
      [userId]
    );

    if (!recruiterRows || recruiterRows.length === 0) {
      return res.status(404).json({ error: "Recruiter profile not found" });
    }

    const recruiterId = recruiterRows[0].id;

    // Check ownership
    const [jobRows] = await pool.query(
      `SELECT 
        ${lang === 'ar' ? 'COALESCE(title_ar, title)' : 'title'} as title
      FROM jobs 
      WHERE id = ? AND recruiter_id = ?`,
      [id, recruiterId]
    );

    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 🔥 Get applicants with CV match scores and sort by match score (highest first)
    const [applicants] = await pool.query(
      `SELECT 
        ja.*,
        ja.cv_match_score,
        ja.cv_match_level,
        ja.cv_match_details,
        CASE 
          WHEN j.application_deadline < NOW() THEN 'expired'
          ELSE ja.status
        END as display_status,
        CASE 
          WHEN ja.cv_match_score >= 80 THEN 'Excellent'
          WHEN ja.cv_match_score >= 60 THEN 'Good'
          WHEN ja.cv_match_score >= 40 THEN 'Fair'
          WHEN ja.cv_match_score > 0 THEN 'Poor'
          ELSE 'Pending'
        END as match_category
      FROM job_applications ja
      JOIN jobs j ON j.id = ja.job_id
      WHERE ja.job_id = ?
      ORDER BY 
        CASE 
          WHEN ja.cv_match_score IS NULL THEN 0
          ELSE ja.cv_match_score 
        END DESC,
        ja.applied_at DESC`,
      [id]
    );

    // 🔥 Parse cv_match_details JSON for frontend
    applicants.forEach(app => {
      if (app.cv_match_details && typeof app.cv_match_details === 'string') {
        try {
          app.cv_match_details = JSON.parse(app.cv_match_details);
        } catch (e) {
          console.error('Error parsing cv_match_details:', e);
          app.cv_match_details = null;
        }
      }
    });

    // 🔥 Calculate match statistics
    const matchStats = {
      excellent: applicants.filter(a => a.cv_match_score >= 80).length,
      good: applicants.filter(a => a.cv_match_score >= 60 && a.cv_match_score < 80).length,
      fair: applicants.filter(a => a.cv_match_score >= 40 && a.cv_match_score < 60).length,
      poor: applicants.filter(a => a.cv_match_score > 0 && a.cv_match_score < 40).length,
      pending: applicants.filter(a => !a.cv_match_score || a.cv_match_score === 0).length,
      average_score: applicants.length > 0 
        ? Math.round(applicants.reduce((sum, a) => sum + (a.cv_match_score || 0), 0) / applicants.length)
        : 0
    };

    console.log(`✅ Fetched ${applicants.length} applicants with CV match scores`);
    console.log(`📊 Match Stats:`, matchStats);

    res.json({
      success: true,
      job_title: jobRows[0].title,
      applicants,
      total: applicants.length,
      match_stats: matchStats,
      language: lang
    });

  } catch (err) {
    console.error("Error fetching applicants:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getPublicJobDetails = async (req, res) => {
  try {
    const { shareLink } = req.params;
    const lang = req.language || 'en';

    // Check and close this specific job if expired
    const [jobCheck] = await pool.query(
      "SELECT id FROM jobs WHERE share_link = ?",
      [shareLink]
    );

    if (jobCheck.length > 0) {
      await checkAndCloseExpiredJobs(jobCheck[0].id);
    }

    const [jobRows] = await pool.query(
      `SELECT 
        j.id,
        ${lang === 'ar' ? 'COALESCE(j.title_ar, j.title)' : 'j.title'} as title,
        ${lang === 'ar' ? 'COALESCE(j.description_ar, j.description)' : 'j.description'} as description,
        ${lang === 'ar' ? 'COALESCE(j.key_responsibilities_ar, j.key_responsibilities)' : 'j.key_responsibilities'} as key_responsibilities,
        ${lang === 'ar' ? 'COALESCE(j.department_ar, j.department)' : 'j.department'} as department,
        ${lang === 'ar' ? 'COALESCE(j.location_ar, j.location)' : 'j.location'} as location,
        j.employment_type,
        j.experience_level,
        j.application_deadline,
        j.is_open,
        ${lang === 'ar' ? 'COALESCE(r.company_name_ar, r.company_name)' : 'r.company_name'} as company_name,
        u.full_name as recruiter_name
      FROM jobs j
      JOIN recruiter_profiles r ON j.recruiter_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE j.share_link = ?`,
      [shareLink]
    );

    if (!jobRows || jobRows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const job = jobRows[0];

    // Check if deadline has passed
    if (new Date(job.application_deadline) < new Date()) {
      return res.status(410).json({ 
        error: "Application deadline has passed",
        deadline: job.application_deadline 
      });
    }

    // Check if job is open
    if (!job.is_open) {
      return res.status(403).json({ error: "This job is no longer accepting applications" });
    }

    // Get required skills
    const [skills] = await pool.query(
      `SELECT s.name, js.minimum_proficiency, js.is_required
       FROM job_skills js
       JOIN skills s ON s.id = js.skill_id
       WHERE js.job_id = ?`,
      [job.id]
    );

    res.json({
      success: true,
      job: {
        ...job,
        required_skills: skills
      },
      language: lang
    });

  } catch (err) {
    console.error("Error fetching public job:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.checkAndCloseExpiredJobs = checkAndCloseExpiredJobs;