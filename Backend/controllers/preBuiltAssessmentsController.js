const db = require('../src/config/database');
const crypto = require('crypto');

/**
 * Get all pre-built assessments with optional filters
 */
const getPreBuiltAssessments = async (req, res) => {
  try {
    const { category, difficulty, search, featured, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        id, title, title_ar, description, description_ar, 
        category, sub_category, difficulty_level, duration_minutes, num_questions,
        skills_tested, role_types, industry,
        times_used, avg_score, rating, rating_count,
        is_featured, requires_proctoring,
        created_at
      FROM pre_built_assessments
      WHERE is_active = TRUE
    `;
    
    const params = [];
    
    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    
    if (difficulty) {
      query += ` AND difficulty_level = ?`;
      params.push(difficulty);
    }
    
    if (featured === 'true') {
      query += ` AND is_featured = TRUE`;
    }
    
    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR title_ar LIKE ? OR description_ar LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0]?.total || 0;
    
    // Add ordering and pagination
    query += ` ORDER BY is_featured DESC, times_used DESC, rating DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const [assessments] = await db.query(query, params);
    
    // Parse JSON fields
    const parsed = assessments.map(a => ({
      ...a,
      skills_tested: typeof a.skills_tested === 'string' ? JSON.parse(a.skills_tested) : a.skills_tested,
      role_types: typeof a.role_types === 'string' ? JSON.parse(a.role_types) : a.role_types,
    }));
    
    res.json({
      success: true,
      data: parsed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pre-built assessments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
  }
};

/**
 * Get single pre-built assessment with full details
 */
const getPreBuiltAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [assessments] = await db.query(`
      SELECT * FROM pre_built_assessments WHERE id = ? AND is_active = TRUE
    `, [id]);
    
    if (!assessments.length) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }
    
    const assessment = assessments[0];
    
    // Parse JSON fields
    const parsed = {
      ...assessment,
      skills_tested: typeof assessment.skills_tested === 'string' ? JSON.parse(assessment.skills_tested) : assessment.skills_tested,
      role_types: typeof assessment.role_types === 'string' ? JSON.parse(assessment.role_types) : assessment.role_types,
      questions: typeof assessment.questions === 'string' ? JSON.parse(assessment.questions) : assessment.questions,
      case_study_content: typeof assessment.case_study_content === 'string' ? JSON.parse(assessment.case_study_content) : assessment.case_study_content,
    };
    
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assessment' });
  }
};

/**
 * Get categories with counts
 */
const getCategories = async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(CASE WHEN is_featured THEN 1 ELSE 0 END) as featured_count
      FROM pre_built_assessments
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY count DESC
    `);
    
    const categoryLabels = {
      administrative: { en: 'Administrative', ar: 'إداري' },
      analytical: { en: 'Analytical', ar: 'تحليلي' },
      excel: { en: 'Excel/Spreadsheet', ar: 'Excel/جداول البيانات' },
      coding: { en: 'Coding', ar: 'البرمجة' },
      customer_service: { en: 'Customer Service', ar: 'خدمة العملاء' },
      communication: { en: 'Communication', ar: 'التواصل' },
      behavioral: { en: 'Behavioral', ar: 'السلوكي' },
      personality: { en: 'Personality', ar: 'الشخصية' },
      situational_judgment: { en: 'Situational Judgment', ar: 'الحكم الموقفي' },
      job_simulation: { en: 'Job Simulation', ar: 'محاكاة العمل' },
    };
    
    const enriched = categories.map(c => ({
      ...c,
      label: categoryLabels[c.category] || { en: c.category, ar: c.category }
    }));
    
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

/**
 * Publish/use a pre-built case study
 * This copies the pre-built case study into the case_studies table
 * and creates a case_study_assessment entry to follow the normal flow
 */
const publishPreBuiltAssessment = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const { id } = req.params;
    const {
      job_id,
      custom_title,
      custom_duration_minutes,
      custom_instructions,
      antiCheating = {}
    } = req.body;
    
    console.log(`📦 Publishing pre-built assessment ${id} with job_id: ${job_id}`);
    console.log(`📦 Anti-cheating settings:`, JSON.stringify(antiCheating));
    
    // Verify pre-built assessment exists
    const [assessments] = await connection.query(
      'SELECT * FROM pre_built_assessments WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    if (!assessments.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Pre-built case study not found' });
    }
    
    const preBuilt = assessments[0];
    
    // Parse JSON fields
    const questions = typeof preBuilt.questions === 'string' 
      ? JSON.parse(preBuilt.questions) 
      : preBuilt.questions || [];
    const caseStudyContent = typeof preBuilt.case_study_content === 'string'
      ? JSON.parse(preBuilt.case_study_content)
      : preBuilt.case_study_content || {};
    
    // Get recruiter profile ID
    const [recruiterRows] = await connection.query(
      `SELECT id FROM recruiter_profiles WHERE user_id = ?`,
      [userId]
    );
    
    if (!recruiterRows || recruiterRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Recruiter profile not found' });
    }
    
    const recruiterId = recruiterRows[0].id;
    
    // Map difficulty level to case_studies format
    const difficultyMap = {
      'easy': 'beginner',
      'medium': 'intermediate', 
      'hard': 'advanced'
    };
    const mappedDifficulty = difficultyMap[preBuilt.difficulty_level] || 'intermediate';
    
    // 1. Insert into case_studies table (copying pre-built content)
    const title = custom_title || preBuilt.title;
    const titleAr = preBuilt.title_ar || title;
    const description = caseStudyContent.background || caseStudyContent.description || preBuilt.description;
    const descriptionAr = caseStudyContent.background_ar || preBuilt.description_ar || description;
    const instructions = custom_instructions || caseStudyContent.instructions || preBuilt.description;
    const instructionsAr = caseStudyContent.instructions_ar || preBuilt.description_ar || instructions;
    const durationMinutes = custom_duration_minutes || preBuilt.duration_minutes || 30;
    
    const [caseStudyResult] = await connection.query(
      `INSERT INTO case_studies 
        (job_id, user_id, title, title_ar, description, description_ar,
         instructions, instructions_ar, duration_minutes,
         is_selected, is_active, status, difficulty_level, num_questions,
         pre_built_assessment_id,
         enable_fullscreen, enable_tab_switch, enable_copy_paste, max_tab_switches,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 'published', ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        job_id || null,
        userId,
        title,
        titleAr,
        description,
        descriptionAr,
        instructions,
        instructionsAr,
        durationMinutes,
        mappedDifficulty,
        preBuilt.num_questions || questions.length,
        id, // Store reference to original pre-built assessment
        antiCheating.enableFullscreen ? 1 : 0,
        antiCheating.enableTabSwitch ? 1 : 0,
        antiCheating.enableCopyPaste ? 1 : 0,
        antiCheating.maxTabSwitches || 3
      ]
    );
    
    const caseStudyId = caseStudyResult.insertId;
    console.log(`📝 Created case study from pre-built template, ID: ${caseStudyId}`);
    
    // Store anti-cheating settings in dedicated table
    if (Object.keys(antiCheating).length > 0) {
      await connection.query(
        `INSERT INTO anti_cheating_settings 
         (case_study_id, prevent_tab_switch, disable_copy_paste, 
          webcam_snapshots_interval, require_webcam, require_fullscreen, tab_switch_limit, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          caseStudyId,
          antiCheating.enableTabSwitch ? 1 : 0,
          antiCheating.enableCopyPaste ? 1 : 0,
          (typeof antiCheating.webcam_snapshots_interval !== 'undefined' ? antiCheating.webcam_snapshots_interval : (antiCheating.enableWebcamProctoring ? 30 : 0)),
          antiCheating.enableWebcamProctoring ? 1 : 0,
          antiCheating.enableFullscreen ? 1 : 0,
          antiCheating.maxTabSwitches || 3
        ]
      );
      console.log(`🔒 Stored anti-cheating settings for case study ${caseStudyId}`);
    }
    
    // 2. Insert questions into case_study_questions or custom_questions table depending on type
    if (questions && questions.length > 0) {
      let insertedSimple = 0;
      let insertedCustom = 0;

      for (const q of questions) {
        // If this is a simple string or does not have a question_type, treat it as a simple case study question
        if (typeof q === 'string' || !q.question_type) {
          const questionText = typeof q === 'string' ? q : (q.question || q.text || q.question_en || '');
          const questionTextAr = typeof q === 'string' ? q : (q.question_ar || q.text_ar || questionText);

          if (questionText) {
            await connection.query(
              `INSERT INTO case_study_questions (case_study_id, question, question_ar, weight)
               VALUES (?, ?, ?, ?)`,
              [caseStudyId, questionText, questionTextAr, q.weight || 1.0]
            );
            insertedSimple++;
          }
        } else {
          // Insert as a custom question (assessment module)
          try {
            await connection.query(
              `INSERT INTO custom_questions
                (case_study_id, question_type, question_text, question_text_ar, options, correct_answers, keywords, rubric, time_limit, weight, question_order, test_cases, starter_code, spreadsheet_template, spreadsheet_solution, expected_response, skill_tags, is_active, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
              [
                caseStudyId,
                q.question_type,
                q.question || '',
                q.question_ar || q.question || '',
                q.options ? JSON.stringify(q.options) : null,
                q.correct_answers ? JSON.stringify(q.correct_answers) : null,
                q.keywords ? JSON.stringify(q.keywords) : null,
                q.rubric ? JSON.stringify(q.rubric) : null,
                q.time_limit || null,
                q.weight || 1,
                q.question_order || null,
                q.test_cases ? JSON.stringify(q.test_cases) : null,
                q.starter_code ? JSON.stringify(q.starter_code) : null,
                q.spreadsheet_template ? JSON.stringify(q.spreadsheet_template) : null,
                q.spreadsheet_solution ? JSON.stringify(q.spreadsheet_solution) : null,
                q.expected_response ? JSON.stringify(q.expected_response) : null,
                q.skill_tags ? JSON.stringify(q.skill_tags) : null
              ]
            );
            insertedCustom++;
          } catch (err) {
            console.error('Error inserting custom question:', err.message || err);
            // continue with other questions
          }
        }
      }

      console.log(`❓ Inserted ${insertedSimple} simple questions and ${insertedCustom} custom modules for case study`);
    }
    
    // 3. Insert tables if any (create both EN and AR language rows when translations are available)
    if (caseStudyContent.tables && caseStudyContent.tables.length > 0) {
      for (const table of caseStudyContent.tables) {
        const tableId = table.table_id || crypto.randomBytes(8).toString('hex');
        const rowsData = table.rows || [];
        const cols = table.columns || [];

        // Defensive: ensure columns are objects with language-specific labels
        const columnsEn = cols.map(c => ({
          ...c,
          // Prefer explicit English label, then generic label, then Arabic
          label: c.label_en || c.label || c.label_ar || ''
        }));
        const columnsAr = cols.map(c => ({
          ...c,
          // Prefer Arabic label first, then fallbacks
          label: c.label_ar || c.label || c.label_en || ''
        }));

        const titleEn = table.title_en || table.title || '';
        const titleAr = table.title_ar || table.title || table.title_en || '';

        // Insert English row
        await connection.query(
          `INSERT INTO case_study_tables 
           (case_study_id, table_id, table_title, table_title_ar, column_definitions, rows_data, language)
           VALUES (?, ?, ?, ?, ?, ?, 'en')`,
          [
            caseStudyId,
            tableId,
            titleEn,
            titleAr,
            JSON.stringify(columnsEn),
            JSON.stringify(rowsData)
          ]
        );

        // Insert Arabic row (use Arabic titles/labels when available)
        await connection.query(
          `INSERT INTO case_study_tables 
           (case_study_id, table_id, table_title, table_title_ar, column_definitions, rows_data, language)
           VALUES (?, ?, ?, ?, ?, ?, 'ar')`,
          [
            caseStudyId,
            tableId,
            titleAr,
            titleAr,
            JSON.stringify(columnsAr),
            JSON.stringify(rowsData)
          ]
        );
      }
      console.log(`📊 Inserted ${caseStudyContent.tables.length} tables (EN + AR rows)`);
    }
    
    // 4. Create case_study_assessments entry with share link (follows normal flow)
    const shareLink = crypto.randomBytes(16).toString('hex');
    
    // Build job description text from pre-built content for the assessment
    // Parse skills_tested safely (may be string or already parsed)
    let skillsTestedArray = [];
    if (preBuilt.skills_tested) {
      skillsTestedArray = typeof preBuilt.skills_tested === 'string' 
        ? JSON.parse(preBuilt.skills_tested) 
        : preBuilt.skills_tested;
    }
    const jobDescriptionText = `Pre-built Case Study: ${title}\n\n${description}\n\nSkills Tested: ${skillsTestedArray.length > 0 ? skillsTestedArray.join(', ') : 'N/A'}`;
    
    await connection.query(
      `INSERT INTO case_study_assessments 
       (recruiter_id, user_id, case_study_id, job_description_text, share_link, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
      [recruiterId, userId, caseStudyId, jobDescriptionText, shareLink]
    );
    console.log(`🔗 Created assessment with share link: ${shareLink}`);
    
    // 5. Increment times_used counter on pre-built assessment
    await connection.query(
      'UPDATE pre_built_assessments SET times_used = times_used + 1 WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    // Generate share URL (same format as normal case study flow)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/case-study-assessment/${shareLink}`;
    
    res.json({
      success: true,
      data: {
        case_study_id: caseStudyId,
        share_link: shareLink,
        share_url: shareUrl,
        title: title
      },
      message: 'Case study published successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error publishing pre-built case study:', error);
    res.status(500).json({ success: false, error: 'Failed to publish case study', details: error.message });
  } finally {
    connection.release();
  }
};

/**
 * Get recruiter's published pre-built assessments
 */
const getMyPublishedAssessments = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    const [published] = await db.query(`
      SELECT 
        ppa.*,
        pba.title as original_title,
        pba.title_ar as original_title_ar,
        pba.category,
        pba.difficulty_level,
        pba.duration_minutes as original_duration,
        j.title as job_title
      FROM published_pre_built_assessments ppa
      JOIN pre_built_assessments pba ON ppa.pre_built_assessment_id = pba.id
      LEFT JOIN jobs j ON ppa.job_id = j.id
      WHERE ppa.recruiter_id = ?
      ORDER BY ppa.created_at DESC
    `, [recruiterId]);
    
    res.json({ success: true, data: published });
  } catch (error) {
    console.error('Error fetching published assessments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch published assessments' });
  }
};

/**
 * Save/favorite a pre-built assessment
 */
const saveAssessment = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { id } = req.params;
    
    await db.query(`
      INSERT IGNORE INTO recruiter_saved_assessments (recruiter_id, pre_built_assessment_id)
      VALUES (?, ?)
    `, [recruiterId, id]);
    
    res.json({ success: true, message: 'Assessment saved' });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to save assessment' });
  }
};

/**
 * Remove saved assessment
 */
const unsaveAssessment = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { id } = req.params;
    
    await db.query(`
      DELETE FROM recruiter_saved_assessments 
      WHERE recruiter_id = ? AND pre_built_assessment_id = ?
    `, [recruiterId, id]);
    
    res.json({ success: true, message: 'Assessment removed from saved' });
  } catch (error) {
    console.error('Error unsaving assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to unsave assessment' });
  }
};

/**
 * Get recruiter's saved assessments
 */
const getSavedAssessments = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    
    const [saved] = await db.query(`
      SELECT 
        pba.*,
        rsa.saved_at
      FROM recruiter_saved_assessments rsa
      JOIN pre_built_assessments pba ON rsa.pre_built_assessment_id = pba.id
      WHERE rsa.recruiter_id = ? AND pba.is_active = TRUE
      ORDER BY rsa.saved_at DESC
    `, [recruiterId]);
    
    // Parse JSON fields
    const parsed = saved.map(a => ({
      ...a,
      skills_tested: typeof a.skills_tested === 'string' ? JSON.parse(a.skills_tested) : a.skills_tested,
      role_types: typeof a.role_types === 'string' ? JSON.parse(a.role_types) : a.role_types,
    }));
    
    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Error fetching saved assessments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch saved assessments' });
  }
};

/**
 * Get published assessment by share token (for candidates)
 */
const getAssessmentByShareToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const [published] = await db.query(`
      SELECT 
        ppa.*,
        pba.title, pba.title_ar, pba.description, pba.description_ar,
        pba.category, pba.difficulty_level, pba.duration_minutes,
        pba.num_questions, pba.questions, pba.case_study_content,
        pba.skills_tested, pba.requires_proctoring
      FROM published_pre_built_assessments ppa
      JOIN pre_built_assessments pba ON ppa.pre_built_assessment_id = pba.id
      WHERE ppa.share_token = ? AND ppa.status = 'active'
    `, [token]);
    
    if (!published.length) {
      return res.status(404).json({ success: false, error: 'Assessment not found or expired' });
    }
    
    const assessment = published[0];
    
    // Check expiration
    if (assessment.expires_at && new Date(assessment.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'Assessment has expired' });
    }
    
    // Merge custom settings with original
    const result = {
      id: assessment.id,
      title: assessment.custom_title || assessment.title,
      title_ar: assessment.title_ar,
      description: assessment.description,
      description_ar: assessment.description_ar,
      category: assessment.category,
      difficulty_level: assessment.difficulty_level,
      duration_minutes: assessment.custom_duration_minutes || assessment.duration_minutes,
      num_questions: assessment.num_questions,
      questions: assessment.custom_questions 
        ? (typeof assessment.custom_questions === 'string' ? JSON.parse(assessment.custom_questions) : assessment.custom_questions)
        : (typeof assessment.questions === 'string' ? JSON.parse(assessment.questions) : assessment.questions),
      case_study_content: typeof assessment.case_study_content === 'string' 
        ? JSON.parse(assessment.case_study_content) 
        : assessment.case_study_content,
      skills_tested: typeof assessment.skills_tested === 'string' 
        ? JSON.parse(assessment.skills_tested) 
        : assessment.skills_tested,
      custom_instructions: assessment.custom_instructions,
      antiCheating: {
        enableFullscreen: !!assessment.enable_fullscreen,
        enableTabSwitch: !!assessment.enable_tab_switch,
        enableCopyPaste: !!assessment.enable_copy_paste,
        webcam_snapshots_interval: assessment.webcam_snapshots_interval || (assessment.enable_webcam_proctoring ? 30 : 0),
        enableWebcamProctoring: !!assessment.enable_webcam_proctoring,
        maxTabSwitches: assessment.max_tab_switches
      }
    };
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching assessment by token:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assessment' });
  }
};

/**
 * Update published assessment status
 */
const updatePublishedStatus = async (req, res) => {
  try {
    const recruiterId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'paused', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    await db.query(`
      UPDATE published_pre_built_assessments 
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND recruiter_id = ?
    `, [status, id, recruiterId]);
    
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

module.exports = {
  getPreBuiltAssessments,
  getPreBuiltAssessmentById,
  getCategories,
  publishPreBuiltAssessment,
  getMyPublishedAssessments,
  saveAssessment,
  unsaveAssessment,
  getSavedAssessments,
  getAssessmentByShareToken,
  updatePublishedStatus
};
