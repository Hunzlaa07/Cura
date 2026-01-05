// controllers/assessmentModulesController.js
// Controller for managing assessment modules, templates, and anti-cheating settings

const db = require("../src/config/database");
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../src/config/cloudinary');

// ============================================
// ASSESSMENT TEMPLATES
// ============================================

/**
 * Create a new assessment template
 */
const createTemplate = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const {
      title,
      title_ar,
      description,
      description_ar,
      category,
      industry,
      difficulty_level,
      estimated_duration,
      is_public
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    const [result] = await db.query(`
      INSERT INTO assessment_templates (
        recruiter_id, title, title_ar, description, description_ar,
        category, industry, difficulty_level, estimated_duration, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recruiterId,
      title,
      title_ar || null,
      description || null,
      description_ar || null,
      category,
      industry || null,
      difficulty_level || 'medium',
      estimated_duration || 30,
      is_public || false
    ]);

    res.status(201).json({
      success: true,
      message: 'Assessment template created successfully',
      data: { id: result.insertId, title, category }
    });

  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create template',
      error: error.message
    });
  }
};

/**
 * Get all templates for a recruiter
 */
const getTemplates = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const { category, includePublic } = req.query;

    let query = `
      SELECT at.*, 
             COUNT(DISTINCT cq.id) as question_count,
             COUNT(DISTINCT am.id) as module_count
      FROM assessment_templates at
      LEFT JOIN custom_questions cq ON at.id = cq.template_id AND cq.is_active = TRUE
      LEFT JOIN assessment_modules am ON at.id = am.template_id AND am.is_active = TRUE
      WHERE at.is_active = TRUE AND (at.recruiter_id = ?
    `;
    const params = [recruiterId];

    if (includePublic === 'true') {
      query += ' OR at.is_public = TRUE)';
    } else {
      query += ')';
    }

    if (category) {
      query += ' AND at.category = ?';
      params.push(category);
    }

    query += ' GROUP BY at.id ORDER BY at.created_at DESC';

    const [templates] = await db.query(query, params);

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch templates',
      error: error.message
    });
  }
};

/**
 * Get a single template with all its questions and modules
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    const [templates] = await db.query(
      'SELECT * FROM assessment_templates WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (!templates.length) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get questions
    const [questions] = await db.query(`
      SELECT * FROM custom_questions 
      WHERE template_id = ? AND is_active = TRUE
      ORDER BY question_order ASC
    `, [id]);

    // Get modules
    const [modules] = await db.query(`
      SELECT * FROM assessment_modules 
      WHERE template_id = ? AND is_active = TRUE
      ORDER BY module_order ASC
    `, [id]);

    // Get anti-cheating settings
    const [antiCheating] = await db.query(
      'SELECT * FROM anti_cheating_settings WHERE template_id = ?',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...templates[0],
        questions: questions.map(parseJSON),
        modules: modules.map(parseJSON),
        antiCheatingSettings: antiCheating[0] || null
      }
    });

  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
      error: error.message
    });
  }
};

/**
 * Update a template
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      title_ar,
      description,
      description_ar,
      category,
      industry,
      difficulty_level,
      estimated_duration,
      is_public
    } = req.body;

    await db.query(`
      UPDATE assessment_templates SET
        title = COALESCE(?, title),
        title_ar = COALESCE(?, title_ar),
        description = COALESCE(?, description),
        description_ar = COALESCE(?, description_ar),
        category = COALESCE(?, category),
        industry = COALESCE(?, industry),
        difficulty_level = COALESCE(?, difficulty_level),
        estimated_duration = COALESCE(?, estimated_duration),
        is_public = COALESCE(?, is_public)
      WHERE id = ?
    `, [
      title, title_ar, description, description_ar,
      category, industry, difficulty_level, estimated_duration, is_public, id
    ]);

    res.json({
      success: true,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update template',
      error: error.message
    });
  }
};

/**
 * Delete a template
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE assessment_templates SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete template',
      error: error.message
    });
  }
};

/**
 * Duplicate a template with all its questions and modules
 */
const duplicateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user?.id;

    // Get original template
    const [templates] = await db.query(
      'SELECT * FROM assessment_templates WHERE id = ?',
      [id]
    );

    if (!templates.length) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const original = templates[0];

    // Create new template
    const [templateResult] = await db.query(`
      INSERT INTO assessment_templates (
        recruiter_id, title, title_ar, description, description_ar,
        category, industry, difficulty_level, estimated_duration, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
    `, [
      recruiterId,
      `${original.title} (Copy)`,
      original.title_ar,
      original.description,
      original.description_ar,
      original.category,
      original.industry,
      original.difficulty_level,
      original.estimated_duration
    ]);

    const newTemplateId = templateResult.insertId;

    // Duplicate questions
    await db.query(`
      INSERT INTO custom_questions (
        template_id, question_type, question_text, question_text_ar,
        question_order, media_url, media_type, options, correct_answers,
        expected_response, expected_response_ar, keywords, rubric,
        max_score, weight, partial_credit, time_limit,
        min_word_count, max_word_count, programming_language,
        test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
        skill_tags, is_required
      )
      SELECT 
        ?, question_type, question_text, question_text_ar,
        question_order, media_url, media_type, options, correct_answers,
        expected_response, expected_response_ar, keywords, rubric,
        max_score, weight, partial_credit, time_limit,
        min_word_count, max_word_count, programming_language,
        test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
        skill_tags, is_required
      FROM custom_questions WHERE template_id = ? AND is_active = TRUE
    `, [newTemplateId, id]);

    // Duplicate modules
    await db.query(`
      INSERT INTO assessment_modules (
        template_id, module_type, title, title_ar, description, description_ar,
        instructions, instructions_ar, module_order, time_limit, passing_score,
        weight, content_data, resources, skill_domain, skill_level, is_required
      )
      SELECT 
        ?, module_type, title, title_ar, description, description_ar,
        instructions, instructions_ar, module_order, time_limit, passing_score,
        weight, content_data, resources, skill_domain, skill_level, is_required
      FROM assessment_modules WHERE template_id = ? AND is_active = TRUE
    `, [newTemplateId, id]);

    // Duplicate anti-cheating settings
    const [antiCheating] = await db.query(
      'SELECT * FROM anti_cheating_settings WHERE template_id = ?',
      [id]
    );

    if (antiCheating.length) {
      const ac = antiCheating[0];
      await db.query(`
        INSERT INTO anti_cheating_settings (
          template_id, prevent_tab_switch, tab_switch_limit, tab_switch_action,
          disable_copy_paste, disable_right_click, require_webcam,
          webcam_snapshots_interval, require_screen_share, record_screen,
          require_id_verification, require_face_match, strict_time_limit,
          no_pause_allowed, random_question_order, random_option_order,
          ai_content_detection, ai_detection_threshold, plagiarism_check,
          single_attempt, ip_restriction, allowed_ips, lockdown_browser
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newTemplateId, ac.prevent_tab_switch, ac.tab_switch_limit, ac.tab_switch_action,
        ac.disable_copy_paste, ac.disable_right_click, ac.require_webcam,
        ac.webcam_snapshots_interval, ac.require_screen_share, ac.record_screen,
        ac.require_id_verification, ac.require_face_match, ac.strict_time_limit,
        ac.no_pause_allowed, ac.random_question_order, ac.random_option_order,
        ac.ai_content_detection, ac.ai_detection_threshold, ac.plagiarism_check,
        ac.single_attempt, ac.ip_restriction, ac.allowed_ips, ac.lockdown_browser
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Template duplicated successfully',
      data: { id: newTemplateId }
    });

  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate template',
      error: error.message
    });
  }
};

// ============================================
// ASSESSMENT MODULES
// ============================================

/**
 * Create an assessment module
 */
const createModule = async (req, res) => {
  try {
    const {
      template_id,
      module_type,
      title,
      title_ar,
      description,
      description_ar,
      instructions,
      instructions_ar,
      module_order,
      time_limit,
      passing_score,
      weight,
      content_data,
      resources,
      skill_domain,
      skill_level,
      is_required
    } = req.body;

    if (!template_id || !module_type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Template ID, module type, and title are required'
      });
    }

    const [result] = await db.query(`
      INSERT INTO assessment_modules (
        template_id, module_type, title, title_ar, description, description_ar,
        instructions, instructions_ar, module_order, time_limit, passing_score,
        weight, content_data, resources, skill_domain, skill_level, is_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template_id,
      module_type,
      title,
      title_ar || null,
      description || null,
      description_ar || null,
      instructions || null,
      instructions_ar || null,
      module_order || 0,
      time_limit || null,
      passing_score || 60,
      weight || 1.0,
      content_data ? JSON.stringify(content_data) : null,
      resources ? JSON.stringify(resources) : null,
      skill_domain || null,
      skill_level || 'intermediate',
      is_required !== false
    ]);

    res.status(201).json({
      success: true,
      message: 'Assessment module created successfully',
      data: { id: result.insertId, title, module_type }
    });

  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create module',
      error: error.message
    });
  }
};

/**
 * Get modules for a template
 */
const getModulesByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const [modules] = await db.query(`
      SELECT * FROM assessment_modules 
      WHERE template_id = ? AND is_active = TRUE
      ORDER BY module_order ASC
    `, [templateId]);

    res.json({
      success: true,
      data: modules.map(parseJSON)
    });

  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch modules',
      error: error.message
    });
  }
};

/**
 * Update a module
 */
const updateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'module_type', 'title', 'title_ar', 'description', 'description_ar',
      'instructions', 'instructions_ar', 'module_order', 'time_limit',
      'passing_score', 'weight', 'content_data', 'resources',
      'skill_domain', 'skill_level', 'is_required', 'is_active'
    ];

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        
        if (['content_data', 'resources'].includes(field) && updates[field] !== null) {
          values.push(JSON.stringify(updates[field]));
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (!setClauses.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await db.query(
      `UPDATE assessment_modules SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Module updated successfully'
    });

  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update module',
      error: error.message
    });
  }
};

/**
 * Delete a module
 */
const deleteModule = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE assessment_modules SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Module deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete module',
      error: error.message
    });
  }
};

/**
 * Reorder modules
 */
const reorderModules = async (req, res) => {
  try {
    const { moduleOrders } = req.body;

    if (!moduleOrders || !Array.isArray(moduleOrders)) {
      return res.status(400).json({
        success: false,
        message: 'moduleOrders array is required'
      });
    }

    for (const item of moduleOrders) {
      await db.query(
        'UPDATE assessment_modules SET module_order = ? WHERE id = ?',
        [item.order, item.id]
      );
    }

    res.json({
      success: true,
      message: 'Modules reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering modules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder modules',
      error: error.message
    });
  }
};

// ============================================
// ANTI-CHEATING SETTINGS
// ============================================

/**
 * Create or update anti-cheating settings
 */
const saveAntiCheatingSettings = async (req, res) => {
  try {
    const {
      template_id,
      case_study_id,
      assessment_id,
      prevent_tab_switch,
      tab_switch_limit,
      tab_switch_action,
      disable_copy_paste,
      disable_right_click,
      require_webcam,
      webcam_snapshots_interval,
      require_screen_share,
      record_screen,
      require_id_verification,
      require_face_match,
      strict_time_limit,
      no_pause_allowed,
      random_question_order,
      random_option_order,
      ai_content_detection,
      ai_detection_threshold,
      plagiarism_check,
      single_attempt,
      ip_restriction,
      allowed_ips,
      lockdown_browser
    } = req.body;

    // Check if settings exist
    let existingId = null;
    if (template_id) {
      const [existing] = await db.query(
        'SELECT id FROM anti_cheating_settings WHERE template_id = ?',
        [template_id]
      );
      if (existing.length) existingId = existing[0].id;
    } else if (case_study_id) {
      const [existing] = await db.query(
        'SELECT id FROM anti_cheating_settings WHERE case_study_id = ?',
        [case_study_id]
      );
      if (existing.length) existingId = existing[0].id;
    } else if (assessment_id) {
      const [existing] = await db.query(
        'SELECT id FROM anti_cheating_settings WHERE assessment_id = ?',
        [assessment_id]
      );
      if (existing.length) existingId = existing[0].id;
    }

    if (existingId) {
      // Update existing
      await db.query(`
        UPDATE anti_cheating_settings SET
          prevent_tab_switch = COALESCE(?, prevent_tab_switch),
          tab_switch_limit = COALESCE(?, tab_switch_limit),
          tab_switch_action = COALESCE(?, tab_switch_action),
          disable_copy_paste = COALESCE(?, disable_copy_paste),
          disable_right_click = COALESCE(?, disable_right_click),
          require_webcam = COALESCE(?, require_webcam),
          webcam_snapshots_interval = COALESCE(?, webcam_snapshots_interval),
          require_screen_share = COALESCE(?, require_screen_share),
          record_screen = COALESCE(?, record_screen),
          require_id_verification = COALESCE(?, require_id_verification),
          require_face_match = COALESCE(?, require_face_match),
          strict_time_limit = COALESCE(?, strict_time_limit),
          no_pause_allowed = COALESCE(?, no_pause_allowed),
          random_question_order = COALESCE(?, random_question_order),
          random_option_order = COALESCE(?, random_option_order),
          ai_content_detection = COALESCE(?, ai_content_detection),
          ai_detection_threshold = COALESCE(?, ai_detection_threshold),
          plagiarism_check = COALESCE(?, plagiarism_check),
          single_attempt = COALESCE(?, single_attempt),
          ip_restriction = COALESCE(?, ip_restriction),
          allowed_ips = COALESCE(?, allowed_ips),
          lockdown_browser = COALESCE(?, lockdown_browser)
        WHERE id = ?
      `, [
        prevent_tab_switch, tab_switch_limit, tab_switch_action,
        disable_copy_paste, disable_right_click, require_webcam,
        webcam_snapshots_interval, require_screen_share, record_screen,
        require_id_verification, require_face_match, strict_time_limit,
        no_pause_allowed, random_question_order, random_option_order,
        ai_content_detection, ai_detection_threshold, plagiarism_check,
        single_attempt, ip_restriction, 
        allowed_ips ? JSON.stringify(allowed_ips) : null,
        lockdown_browser, existingId
      ]);

      res.json({
        success: true,
        message: 'Anti-cheating settings updated successfully',
        data: { id: existingId }
      });
    } else {
      // Create new
      const [result] = await db.query(`
        INSERT INTO anti_cheating_settings (
          template_id, case_study_id, assessment_id,
          prevent_tab_switch, tab_switch_limit, tab_switch_action,
          disable_copy_paste, disable_right_click, require_webcam,
          webcam_snapshots_interval, require_screen_share, record_screen,
          require_id_verification, require_face_match, strict_time_limit,
          no_pause_allowed, random_question_order, random_option_order,
          ai_content_detection, ai_detection_threshold, plagiarism_check,
          single_attempt, ip_restriction, allowed_ips, lockdown_browser
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        template_id || null, case_study_id || null, assessment_id || null,
        prevent_tab_switch ?? true, tab_switch_limit ?? 3, tab_switch_action ?? 'flag',
        disable_copy_paste ?? false, disable_right_click ?? false, require_webcam ?? false,
        webcam_snapshots_interval ?? 60, require_screen_share ?? false, record_screen ?? false,
        require_id_verification ?? false, require_face_match ?? false, strict_time_limit ?? true,
        no_pause_allowed ?? true, random_question_order ?? true, random_option_order ?? true,
        ai_content_detection ?? true, ai_detection_threshold ?? 70, plagiarism_check ?? true,
        single_attempt ?? true, ip_restriction ?? false,
        allowed_ips ? JSON.stringify(allowed_ips) : null,
        lockdown_browser ?? false
      ]);

      res.status(201).json({
        success: true,
        message: 'Anti-cheating settings created successfully',
        data: { id: result.insertId }
      });
    }

  } catch (error) {
    console.error('Error saving anti-cheating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save anti-cheating settings',
      error: error.message
    });
  }
};

/**
 * Get anti-cheating settings
 */
const getAntiCheatingSettings = async (req, res) => {
  try {
    const { template_id, case_study_id, assessment_id } = req.query;

    let query = 'SELECT * FROM anti_cheating_settings WHERE 1=1';
    const params = [];

    if (template_id) {
      query += ' AND template_id = ?';
      params.push(template_id);
    }
    if (case_study_id) {
      query += ' AND case_study_id = ?';
      params.push(case_study_id);
    }
    if (assessment_id) {
      query += ' AND assessment_id = ?';
      params.push(assessment_id);
    }

    const [settings] = await db.query(query, params);

    if (!settings.length) {
      // Return default settings
      return res.json({
        success: true,
        data: getDefaultAntiCheatingSettings()
      });
    }

    res.json({
      success: true,
      data: {
        ...settings[0],
        allowed_ips: settings[0].allowed_ips ? JSON.parse(settings[0].allowed_ips) : []
      }
    });

  } catch (error) {
    console.error('Error fetching anti-cheating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anti-cheating settings',
      error: error.message
    });
  }
};

// ============================================
// COGNITIVE TEST TEMPLATES
// ============================================

/**
 * Get available cognitive test templates
 */
const getCognitiveTestTemplates = async (req, res) => {
  try {
    const { test_type, difficulty } = req.query;

    let query = 'SELECT * FROM cognitive_test_templates WHERE is_active = TRUE';
    const params = [];

    if (test_type) {
      query += ' AND test_type = ?';
      params.push(test_type);
    }
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY test_type, difficulty';

    const [templates] = await db.query(query, params);

    res.json({
      success: true,
      data: templates.map(t => ({
        ...t,
        norm_data: t.norm_data ? JSON.parse(t.norm_data) : null
      }))
    });

  } catch (error) {
    console.error('Error fetching cognitive test templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cognitive test templates',
      error: error.message
    });
  }
};

/**
 * Create a cognitive test template
 */
const createCognitiveTestTemplate = async (req, res) => {
  try {
    const {
      test_type,
      title,
      title_ar,
      description,
      description_ar,
      instructions,
      instructions_ar,
      time_limit,
      question_count,
      difficulty,
      scoring_method,
      norm_data,
      is_adaptive
    } = req.body;

    if (!test_type || !title || !time_limit || !question_count) {
      return res.status(400).json({
        success: false,
        message: 'Test type, title, time limit, and question count are required'
      });
    }

    const [result] = await db.query(`
      INSERT INTO cognitive_test_templates (
        test_type, title, title_ar, description, description_ar,
        instructions, instructions_ar, time_limit, question_count,
        difficulty, scoring_method, norm_data, is_adaptive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      test_type,
      title,
      title_ar || null,
      description || null,
      description_ar || null,
      instructions || null,
      instructions_ar || null,
      time_limit,
      question_count,
      difficulty || 'medium',
      scoring_method || 'correct_only',
      norm_data ? JSON.stringify(norm_data) : null,
      is_adaptive || false
    ]);

    res.status(201).json({
      success: true,
      message: 'Cognitive test template created successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error creating cognitive test template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create cognitive test template',
      error: error.message
    });
  }
};

// ============================================
// PROCTORING & SESSION MANAGEMENT
// ============================================

/**
 * Log a proctoring event with optional Cloudinary upload for screenshots
 */
const logProctoringEvent = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      session_id,
      event_type,
      event_data,
      screenshot_url,
      screenshot_base64, // New: accept base64 for server-side upload
      debug_screenshot_base64, // Annotated debug screenshot from client
      severity,
      client_timestamp,
      face_detection, // New: face detection metadata
      applicant_id // Track which applicant this belongs to
    } = req.body;

    // Resolve applicant_id from request body or authenticated user
    const resolvedApplicantId = applicant_id || req.user?.applicantId || null;

    console.log(`📋 Proctoring event received: ${event_type}, applicant: ${resolvedApplicantId}, app_id: ${application_id || assessment_application_id}, session_id: ${session_id}, severity: ${severity}`);

    // Ignore transient single tab switches to reduce noise and avoid penalizing accidental switches.
    // Only 'tab_switch_limit_exceeded' events should be recorded and penalized.
    if (event_type === 'tab_switch') {
      console.log('ℹ️ Ignoring transient tab_switch event (not recording)');
      return res.json({ success: true, message: 'Tab switch event ignored (not recorded) - only limit-exceeded events are recorded' });
    }

    let finalScreenshotUrl = screenshot_url || null;
    let screenshotPublicId = null;
    let debugScreenshotUrl = null;
    let debugScreenshotPublicId = null;

    // If base64 screenshot provided, upload to Cloudinary
    if (screenshot_base64 && screenshot_base64.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinary.uploader.upload(screenshot_base64, {
          folder: `proctoring/${resolvedApplicantId || assessment_application_id || application_id || 'unknown'}`,
          resource_type: 'image',
          quality: 'auto:low',
          fetch_format: 'auto',
          transformation: [
            { width: 640, height: 480, crop: 'limit' },
            { quality: 'auto:low' }
          ]
        });
        finalScreenshotUrl = uploadResult.secure_url;
        screenshotPublicId = uploadResult.public_id;
        console.log(`📸 Screenshot uploaded to Cloudinary: ${uploadResult.public_id}`);
      } catch (uploadErr) {
        console.error('Cloudinary upload failed:', uploadErr.message);
        // Fall back to storing base64 if upload fails (not recommended for production)
        finalScreenshotUrl = screenshot_base64.substring(0, 500) + '...truncated';
      }
    }

    // If debug screenshot (annotated) provided, upload it too
    if (debug_screenshot_base64 && debug_screenshot_base64.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinary.uploader.upload(debug_screenshot_base64, {
          folder: `proctoring/${resolvedApplicantId || assessment_application_id || application_id || 'unknown'}/debug`,
          resource_type: 'image',
          quality: 'auto:low',
          fetch_format: 'auto',
          transformation: [
            { width: 640, height: 480, crop: 'limit' },
            { quality: 'auto:low' }
          ]
        });
        debugScreenshotUrl = uploadResult.secure_url;
        debugScreenshotPublicId = uploadResult.public_id;
        console.log(`🧾 Debug screenshot uploaded to Cloudinary: ${uploadResult.public_id}`);
      } catch (uploadErr) {
        console.error('Cloudinary debug upload failed:', uploadErr.message);
        debugScreenshotUrl = debug_screenshot_base64.substring(0, 500) + '...truncated';
      }
    }

    // Determine severity based on face detection if provided
    let finalSeverity = severity || 'low';
    let finalEventType = event_type;
    
    if (face_detection) {
      // Use face detection results to set event type and severity
      if (face_detection.eventType) {
        finalEventType = face_detection.eventType;
      }
      if (face_detection.severity) {
        // Escalate severity if face detection indicates issues
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const detectedIndex = severityOrder.indexOf(face_detection.severity);
        const currentIndex = severityOrder.indexOf(finalSeverity);
        if (detectedIndex > currentIndex) {
          finalSeverity = face_detection.severity;
        }
      }
    }

    // Special handling for tab switch limit exceeded events
    if (event_type === 'tab_switch_limit_exceeded') {
      // Ensure severity reflects repeated tab switching
      const minSeverityOrder = ['low', 'medium', 'high', 'critical'];
      const idx = Math.max(minSeverityOrder.indexOf(finalSeverity), minSeverityOrder.indexOf('medium'));
      finalSeverity = minSeverityOrder[idx];

      // Use a normalized event type for downstream analytics if needed
      finalEventType = 'tab_switch_limit_exceeded';

      console.log(`⚠️ Tab switch limit exceeded for applicant: ${resolvedApplicantId}, session: ${session_id}`);
    }

    // Merge face detection data into event_data
    const finalEventData = {
      ...(event_data || {}),
      ...(face_detection ? {
        face_detection: {
          faceCount: face_detection.faceCount,
          confidence: face_detection.confidence,
          message: face_detection.message,
          faces: face_detection.faces?.map(f => ({
            boundingBox: f.boundingBox,
            confidence: f.confidence
          })),
          // Preserve rawDetections if provided (useful for debugging model outputs)
          rawDetections: face_detection.rawDetections || null,
          debugScreenshotUrl: debugScreenshotUrl || null
        }
      } : {})
    };

    // Convert ISO timestamp to MySQL-compatible format
    let mysqlTimestamp = null;
    if (client_timestamp) {
      try {
        const date = new Date(client_timestamp);
        mysqlTimestamp = date.toISOString().slice(0, 19).replace('T', ' ');
      } catch (e) {
        console.warn('Invalid client_timestamp:', client_timestamp);
      }
    }

    const [result] = await db.query(`
      INSERT INTO proctoring_logs (
        applicant_id, application_id, assessment_application_id, case_study_id, session_id, event_type,
        event_data, screenshot_url, screenshot_public_id, severity, client_timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resolvedApplicantId,
      application_id || null,
      assessment_application_id || null,
      assessment_application_id || null, // case_study_id is same as assessment_application_id for case study assessments
      session_id || null,
      finalEventType,
      Object.keys(finalEventData).length > 0 ? JSON.stringify(finalEventData) : null,
      finalScreenshotUrl,
      screenshotPublicId,
      finalSeverity,
      mysqlTimestamp
    ]);

    // Update session integrity score for ALL proctoring events (not just high/critical)
    // Pass applicant_id for precise session matching
    // Use event_data.excessIncrement (if provided) to apply multiple penalties for repeated excess switches
    const excessCount = (event_data && event_data.excessIncrement) ? parseInt(event_data.excessIncrement, 10) : 1;
    await updateSessionIntegrity(resolvedApplicantId, session_id, assessment_application_id, finalEventType, excessCount);

    // Log face detection violations for monitoring (include rawDetections if available)
    if (face_detection && (face_detection.eventType === 'no_face_detected' || face_detection.eventType === 'multiple_faces')) {
      console.log(`⚠️ Proctoring violation: ${face_detection.eventType} - ${face_detection.message}`, {
        faceCount: face_detection.faceCount,
        confidence: face_detection.confidence,
        rawDetections: face_detection.rawDetections || null
      });
    }

    res.json({
      success: true,
      message: 'Event logged',
      data: {
        id: result.insertId,
        severity: finalSeverity,
        event_type: finalEventType,
        screenshot_url: finalScreenshotUrl
      }
    });

  } catch (error) {
    console.error('Error logging proctoring event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log event',
      error: error.message
    });
  }
};

/**
 * Get proctoring logs for an application
 */
const getProctoringLogs = async (req, res) => {
  try {
    const { applicationId, assessmentApplicationId, caseStudyId, sessionId, severity, applicantId } = req.query;

    let query = 'SELECT * FROM proctoring_logs WHERE 1=1';
    const params = [];

    // Build filters - use AND logic to be strict and avoid mixing logs from different applicants
    // When applicantId is provided, we MUST filter by it first, then narrow down by other identifiers
    if (applicantId) {
      query += ' AND applicant_id = ?';
      params.push(applicantId);
      
      // Additionally filter by case_study_id or assessment_application_id if provided
      // Use AND to be more specific, not OR which can pull in unrelated logs
      if (assessmentApplicationId) {
        query += ' AND (assessment_application_id = ? OR case_study_id = ?)';
        params.push(assessmentApplicationId, assessmentApplicationId);
      } else if (caseStudyId) {
        query += ' AND case_study_id = ?';
        params.push(caseStudyId);
      }
      
      if (sessionId) {
        query += ' AND session_id = ?';
        params.push(sessionId);
      }
    } else {
      // No applicantId - use other identifiers with AND logic for strictness
      if (assessmentApplicationId) {
        query += ' AND (assessment_application_id = ? OR case_study_id = ?)';
        params.push(assessmentApplicationId, assessmentApplicationId);
      } else if (caseStudyId) {
        query += ' AND case_study_id = ?';
        params.push(caseStudyId);
      }
      
      if (sessionId) {
        query += ' AND session_id = ?';
        params.push(sessionId);
      }
      
      if (applicationId) {
        query += ' AND application_id = ?';
        params.push(applicationId);
      }
    }
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY server_timestamp DESC';
    
    console.log('📋 Proctoring logs query:', query);
    console.log('📋 Proctoring logs params:', params);

    let [logs] = await db.query(query, params);

    // Fallback: If applicantId was provided but no logs found, try without applicantId requirement
    // This handles legacy logs that were created before applicant_id was being tracked
    if (logs.length === 0 && applicantId && sessionId) {
      console.log('📋 No logs found with applicant_id, trying fallback query by session_id only...');
      let fallbackQuery = 'SELECT * FROM proctoring_logs WHERE 1=1 AND session_id = ?';
      const fallbackParams = [sessionId];
      
      fallbackQuery += ' ORDER BY server_timestamp DESC';
      console.log('📋 Fallback query:', fallbackQuery, 'params:', fallbackParams);
      
      [logs] = await db.query(fallbackQuery, fallbackParams);
      console.log('📋 Fallback found', logs.length, 'logs');
    }

    res.json({
      success: true,
      data: logs.map(log => {
        let eventData = log.event_data;
        // Only parse if it's a string, otherwise use as-is
        if (typeof eventData === 'string') {
          try {
            eventData = JSON.parse(eventData);
          } catch (e) {
            eventData = null;
          }
        }
        return {
          ...log,
          event_data: eventData
        };
      })
    });

  } catch (error) {
    console.error('Error fetching proctoring logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch proctoring logs',
      error: error.message
    });
  }
};

/**
 * Start an assessment session
 */
const startSession = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      case_study_id,
      template_id,
      questions_total,
      modules_total,
      time_remaining,
      applicant_id
    } = req.body;

    // Also try to get applicant_id from authenticated user
    const resolvedApplicantId = applicant_id || req.user?.applicantId || null;

    console.log('🎯 StartSession: Received applicant_id:', applicant_id, 'From auth:', req.user?.applicantId, 'Resolved:', resolvedApplicantId);

    const [result] = await db.query(`
      INSERT INTO assessment_sessions (
        applicant_id, application_id, assessment_application_id, case_study_id, template_id,
        status, started_at, last_activity_at, questions_total, modules_total, time_remaining,
        ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, 'in_progress', NOW(), NOW(), ?, ?, ?, ?, ?)
    `, [
      resolvedApplicantId,
      application_id || null,
      assessment_application_id || null,
      case_study_id || null,
      template_id || null,
      questions_total || 0,
      modules_total || 0,
      time_remaining || null,
      req.ip,
      req.headers['user-agent']
    ]);

    console.log('✅ Session created with ID:', result.insertId, 'Applicant:', resolvedApplicantId);

    res.status(201).json({
      success: true,
      message: 'Session started',
      data: { sessionId: result.insertId }
    });

  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session',
      error: error.message
    });
  }
};

/**
 * Update session progress
 */
const updateSessionProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      current_question_id,
      current_module_id,
      questions_answered,
      modules_completed,
      time_remaining,
      time_spent
    } = req.body;

    await db.query(`
      UPDATE assessment_sessions SET
        current_question_id = COALESCE(?, current_question_id),
        current_module_id = COALESCE(?, current_module_id),
        questions_answered = COALESCE(?, questions_answered),
        modules_completed = COALESCE(?, modules_completed),
        time_remaining = COALESCE(?, time_remaining),
        total_time_spent = COALESCE(?, total_time_spent),
        last_activity_at = NOW()
      WHERE id = ?
    `, [
      current_question_id,
      current_module_id,
      questions_answered,
      modules_completed,
      time_remaining,
      time_spent,
      sessionId
    ]);

    res.json({
      success: true,
      message: 'Session updated'
    });

  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session',
      error: error.message
    });
  }
};

/**
 * End session
 */
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.body; // 'completed', 'timed_out', 'abandoned', 'disqualified'

    await db.query(`
      UPDATE assessment_sessions SET
        status = ?,
        completed_at = NOW()
      WHERE id = ?
    `, [status || 'completed', sessionId]);

    res.json({
      success: true,
      message: 'Session ended'
    });

  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseJSON(item) {
  if (!item) return null;
  
  const jsonFields = ['content_data', 'resources', 'event_data', 'flags_raised'];
  const parsed = { ...item };
  
  for (const field of jsonFields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch {}
    }
  }
  
  return parsed;
}

function getDefaultAntiCheatingSettings() {
  return {
    prevent_tab_switch: true,
    tab_switch_limit: 3,
    tab_switch_action: 'flag',
    disable_copy_paste: false,
    disable_right_click: false,
    require_webcam: false,
    webcam_snapshots_interval: 60,
    require_screen_share: false,
    record_screen: false,
    require_id_verification: false,
    require_face_match: false,
    strict_time_limit: true,
    no_pause_allowed: true,
    random_question_order: true,
    random_option_order: true,
    ai_content_detection: true,
    ai_detection_threshold: 70,
    plagiarism_check: true,
    single_attempt: true,
    ip_restriction: false,
    allowed_ips: [],
    lockdown_browser: false
  };
}

async function updateSessionIntegrity(applicantId, sessionId, assessmentApplicationId, eventType, count = 1) {
  if (!applicantId && !sessionId && !assessmentApplicationId) return;
  
  const penaltyMap = {
    'tab_switch': 0, // No penalty for single tab switch events (handled client-side)
    'tab_switch_limit_exceeded': 15, // Heavier penalty when the candidate exceeds the configured limit
    'paste_attempt': 10,
    'cut_attempt': 10,
    'multiple_faces': 20,
    'no_face_detected': 10, // Reduced from 15 due to false positives
    'fullscreen_exit': 5,
    'webcam_denied': 30,  // Severe penalty for denying webcam when required
    'webcam_disconnected': 20,  // Camera disconnected during assessment
    'face_too_far': 3,  // Reduced from 5
    'periodic_screenshot': 0  // No penalty for periodic screenshots
  };
  
  const basePenalty = penaltyMap[eventType] || 2;
  const penalty = basePenalty * Math.max(1, parseInt(count, 10) || 1);
  
  // Skip update if no penalty
  if (penalty === 0) return;
  
  try {
    // First, find the correct session ID to update
    let findSessionQuery = `SELECT id FROM assessment_sessions WHERE `;
    const findParams = [];
    
    if (sessionId) {
      // Direct session ID lookup is most precise
      findSessionQuery += 'id = ?';
      findParams.push(sessionId);
    } else if (applicantId && assessmentApplicationId) {
      // Match by applicant AND assessment
      findSessionQuery += '(applicant_id = ? AND (case_study_id = ? OR assessment_application_id = ?))';
      findParams.push(applicantId, assessmentApplicationId, assessmentApplicationId);
    } else if (applicantId) {
      findSessionQuery += 'applicant_id = ?';
      findParams.push(applicantId);
    } else if (assessmentApplicationId) {
      findSessionQuery += '(assessment_application_id = ? OR case_study_id = ?)';
      findParams.push(assessmentApplicationId, assessmentApplicationId);
    } else {
      console.log('🔒 Cannot update integrity: no valid identifiers');
      return;
    }
    
    findSessionQuery += ' ORDER BY created_at DESC LIMIT 1';
    
    const [sessions] = await db.query(findSessionQuery, findParams);
    
    if (!sessions || sessions.length === 0) {
      console.log(`🔒 No session found to update integrity for applicant: ${applicantId}, assessment: ${assessmentApplicationId}`);
      return;
    }
    
    const targetSessionId = sessions[0].id;
    
    // Now update that specific session
    const [result] = await db.query(`
      UPDATE assessment_sessions 
      SET integrity_score = GREATEST(0, integrity_score - ?),
          warnings_issued = warnings_issued + 1
      WHERE id = ?
    `, [penalty, targetSessionId]);
    
    console.log(`🔒 Integrity updated: ${eventType} (-${penalty}pts), session: ${targetSessionId}, applicant: ${applicantId}, rows affected: ${result.affectedRows}`);
  } catch (err) {
    console.error('Error updating session integrity:', err);
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Templates
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  
  // Modules
  createModule,
  getModulesByTemplate,
  updateModule,
  deleteModule,
  reorderModules,
  
  // Anti-cheating
  saveAntiCheatingSettings,
  getAntiCheatingSettings,
  
  // Cognitive Tests
  getCognitiveTestTemplates,
  createCognitiveTestTemplate,
  
  // Proctoring
  logProctoringEvent,
  getProctoringLogs,
  
  // Sessions
  startSession,
  updateSessionProgress,
  endSession
};
