// controllers/customQuestionsController.js
// Controller for managing custom questions with MCQ, open-ended, video, coding, SQL, and Excel tasks

const db = require("../src/config/database");
const { v4: uuidv4 } = require('uuid');

// ============================================
// CUSTOM QUESTIONS CRUD
// ============================================

/**
 * Create a new custom question
 */
const createQuestion = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const {
      template_id,
      case_study_id,
      question_type,
      question_text,
      question_text_ar,
      question_order,
      media_url,
      media_type,
      options,
      correct_answers,
      expected_response,
      expected_response_ar,
      keywords,
      rubric,
      max_score,
      weight,
      partial_credit,
      time_limit,
      min_word_count,
      max_word_count,
      min_video_duration,
      max_video_duration,
      programming_language,
      test_cases,
      starter_code,
      spreadsheet_template,
      spreadsheet_solution,
      skill_tags,
      is_required
    } = req.body;

    // Validate required fields
    if (!question_type || !question_text) {
      return res.status(400).json({
        success: false,
        message: 'Question type and text are required'
      });
    }

    // Validate MCQ options if MCQ type
    if ((question_type === 'mcq' || question_type === 'mcq_multiple') && (!options || !options.length)) {
      return res.status(400).json({
        success: false,
        message: 'MCQ questions require options'
      });
    }

    const [result] = await db.query(`
      INSERT INTO custom_questions (
        template_id, case_study_id, question_type, question_text, question_text_ar,
        question_order, media_url, media_type, options, correct_answers,
        expected_response, expected_response_ar, keywords, rubric,
        max_score, weight, partial_credit, time_limit,
        min_word_count, max_word_count, min_video_duration, max_video_duration,
        programming_language, test_cases, starter_code,
        spreadsheet_template, spreadsheet_solution, skill_tags, is_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template_id || null,
      case_study_id || null,
      question_type,
      question_text,
      question_text_ar || null,
      question_order || 0,
      media_url || null,
      media_type || null,
      options ? JSON.stringify(options) : null,
      correct_answers ? JSON.stringify(correct_answers) : null,
      expected_response || null,
      expected_response_ar || null,
      keywords ? JSON.stringify(keywords) : null,
      rubric ? JSON.stringify(rubric) : null,
      max_score || 100,
      weight || 1.0,
      partial_credit || false,
      time_limit || null,
      min_word_count || null,
      max_word_count || null,
      min_video_duration || null,
      max_video_duration || 180,
      programming_language || null,
      test_cases ? JSON.stringify(test_cases) : null,
      starter_code || null,
      spreadsheet_template ? JSON.stringify(spreadsheet_template) : null,
      spreadsheet_solution ? JSON.stringify(spreadsheet_solution) : null,
      skill_tags ? JSON.stringify(skill_tags) : null,
      is_required !== false
    ]);

    const questionId = result.insertId;

    // Fetch the created question
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [questionId]
    );

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: parseQuestionJSON(questions[0])
    });

  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
      error: error.message
    });
  }
};

/**
 * Create multiple questions in bulk
 */
const createBulkQuestions = async (req, res) => {
  try {
    const { questions, template_id, case_study_id } = req.body;

    if (!questions || !Array.isArray(questions) || !questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }

    const createdQuestions = [];
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      const [result] = await db.query(`
        INSERT INTO custom_questions (
          template_id, case_study_id, question_type, question_text, question_text_ar,
          question_order, options, correct_answers, expected_response,
          keywords, rubric, max_score, weight, time_limit, programming_language,
          test_cases, starter_code, spreadsheet_template, spreadsheet_solution,
          skill_tags, is_required
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        template_id || q.template_id || null,
        case_study_id || q.case_study_id || null,
        q.question_type,
        q.question_text,
        q.question_text_ar || null,
        q.question_order || i,
        q.options ? JSON.stringify(q.options) : null,
        q.correct_answers ? JSON.stringify(q.correct_answers) : null,
        q.expected_response || null,
        q.keywords ? JSON.stringify(q.keywords) : null,
        q.rubric ? JSON.stringify(q.rubric) : null,
        q.max_score || 100,
        q.weight || 1.0,
        q.time_limit || null,
        q.programming_language || null,
        q.test_cases ? JSON.stringify(q.test_cases) : null,
        q.starter_code || null,
        q.spreadsheet_template ? JSON.stringify(q.spreadsheet_template) : null,
        q.spreadsheet_solution ? JSON.stringify(q.spreadsheet_solution) : null,
        q.skill_tags ? JSON.stringify(q.skill_tags) : null,
        q.is_required !== false
      ]);

      createdQuestions.push({ id: result.insertId, ...q });
    }

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questions created successfully`,
      data: createdQuestions
    });

  } catch (error) {
    console.error('Error creating bulk questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create questions',
      error: error.message
    });
  }
};

/**
 * Get questions by template ID
 */
const getQuestionsByTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const [questions] = await db.query(`
      SELECT * FROM custom_questions 
      WHERE template_id = ? AND is_active = TRUE
      ORDER BY question_order ASC
    `, [templateId]);

    res.json({
      success: true,
      data: questions.map(parseQuestionJSON)
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

/**
 * Get questions by case study ID
 */
const getQuestionsByCaseStudy = async (req, res) => {
  try {
    const { caseStudyId } = req.params;

    const [questions] = await db.query(`
      SELECT * FROM custom_questions 
      WHERE case_study_id = ? AND is_active = TRUE
      ORDER BY question_order ASC
    `, [caseStudyId]);

    res.json({
      success: true,
      data: questions.map(parseQuestionJSON)
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
      error: error.message
    });
  }
};

/**
 * Get a single question by ID
 */
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: parseQuestionJSON(questions[0])
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question',
      error: error.message
    });
  }
};

/**
 * Update a question
 */
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const allowedFields = [
      'question_type', 'question_text', 'question_text_ar', 'question_order',
      'media_url', 'media_type', 'options', 'correct_answers',
      'expected_response', 'expected_response_ar', 'keywords', 'rubric',
      'max_score', 'weight', 'partial_credit', 'time_limit',
      'min_word_count', 'max_word_count', 'min_video_duration', 'max_video_duration',
      'programming_language', 'test_cases', 'starter_code',
      'spreadsheet_template', 'spreadsheet_solution', 'skill_tags', 'is_required', 'is_active'
    ];

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        
        // JSON fields need stringification
        const jsonFields = ['options', 'correct_answers', 'keywords', 'rubric', 
                          'test_cases', 'spreadsheet_template', 'spreadsheet_solution', 'skill_tags'];
        
        if (jsonFields.includes(field) && updates[field] !== null) {
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
      `UPDATE custom_questions SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    // Fetch updated question
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: parseQuestionJSON(questions[0])
    });

  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
      error: error.message
    });
  }
};

/**
 * Delete a question (soft delete)
 */
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE custom_questions SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
      error: error.message
    });
  }
};

/**
 * Reorder questions
 */
const reorderQuestions = async (req, res) => {
  try {
    const { questionOrders } = req.body; // [{ id: 1, order: 0 }, { id: 2, order: 1 }]

    if (!questionOrders || !Array.isArray(questionOrders)) {
      return res.status(400).json({
        success: false,
        message: 'questionOrders array is required'
      });
    }

    for (const item of questionOrders) {
      await db.query(
        'UPDATE custom_questions SET question_order = ? WHERE id = ?',
        [item.order, item.id]
      );
    }

    res.json({
      success: true,
      message: 'Questions reordered successfully'
    });

  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder questions',
      error: error.message
    });
  }
};

/**
 * Duplicate a question
 */
const duplicateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const original = questions[0];

    const [result] = await db.query(`
      INSERT INTO custom_questions (
        template_id, case_study_id, question_type, question_text, question_text_ar,
        question_order, media_url, media_type, options, correct_answers,
        expected_response, expected_response_ar, keywords, rubric,
        max_score, weight, partial_credit, time_limit,
        min_word_count, max_word_count, min_video_duration, max_video_duration,
        programming_language, test_cases, starter_code,
        spreadsheet_template, spreadsheet_solution, skill_tags, is_required
      ) SELECT 
        template_id, case_study_id, question_type, 
        CONCAT(question_text, ' (Copy)'), question_text_ar,
        question_order + 1, media_url, media_type, options, correct_answers,
        expected_response, expected_response_ar, keywords, rubric,
        max_score, weight, partial_credit, time_limit,
        min_word_count, max_word_count, min_video_duration, max_video_duration,
        programming_language, test_cases, starter_code,
        spreadsheet_template, spreadsheet_solution, skill_tags, is_required
      FROM custom_questions WHERE id = ?
    `, [id]);

    const [newQuestion] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Question duplicated successfully',
      data: parseQuestionJSON(newQuestion[0])
    });

  } catch (error) {
    console.error('Error duplicating question:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate question',
      error: error.message
    });
  }
};

// ============================================
// SCORING RULES CRUD
// ============================================

/**
 * Create a scoring rule
 */
const createScoringRule = async (req, res) => {
  try {
    const {
      template_id,
      question_id,
      module_id,
      rule_name,
      rule_type,
      rule_config,
      points_awarded,
      points_deducted,
      is_mandatory,
      priority
    } = req.body;

    if (!rule_name || !rule_type || !rule_config) {
      return res.status(400).json({
        success: false,
        message: 'Rule name, type, and config are required'
      });
    }

    const [result] = await db.query(`
      INSERT INTO scoring_rules (
        template_id, question_id, module_id, rule_name, rule_type,
        rule_config, points_awarded, points_deducted, is_mandatory, priority
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template_id || null,
      question_id || null,
      module_id || null,
      rule_name,
      rule_type,
      JSON.stringify(rule_config),
      points_awarded || 0,
      points_deducted || 0,
      is_mandatory || false,
      priority || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Scoring rule created successfully',
      data: { id: result.insertId, rule_name, rule_type, rule_config }
    });

  } catch (error) {
    console.error('Error creating scoring rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scoring rule',
      error: error.message
    });
  }
};

/**
 * Get scoring rules for a question
 */
const getScoringRules = async (req, res) => {
  try {
    const { questionId } = req.params;

    const [rules] = await db.query(`
      SELECT * FROM scoring_rules 
      WHERE question_id = ? AND is_active = TRUE
      ORDER BY priority ASC
    `, [questionId]);

    res.json({
      success: true,
      data: rules.map(rule => ({
        ...rule,
        rule_config: JSON.parse(rule.rule_config || '{}')
      }))
    });

  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scoring rules',
      error: error.message
    });
  }
};

/**
 * Update a scoring rule
 */
const updateScoringRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { rule_name, rule_type, rule_config, points_awarded, points_deducted, is_mandatory, priority } = req.body;

    await db.query(`
      UPDATE scoring_rules SET
        rule_name = COALESCE(?, rule_name),
        rule_type = COALESCE(?, rule_type),
        rule_config = COALESCE(?, rule_config),
        points_awarded = COALESCE(?, points_awarded),
        points_deducted = COALESCE(?, points_deducted),
        is_mandatory = COALESCE(?, is_mandatory),
        priority = COALESCE(?, priority)
      WHERE id = ?
    `, [
      rule_name,
      rule_type,
      rule_config ? JSON.stringify(rule_config) : null,
      points_awarded,
      points_deducted,
      is_mandatory,
      priority,
      id
    ]);

    res.json({
      success: true,
      message: 'Scoring rule updated successfully'
    });

  } catch (error) {
    console.error('Error updating scoring rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scoring rule',
      error: error.message
    });
  }
};

/**
 * Delete a scoring rule
 */
const deleteScoringRule = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      'UPDATE scoring_rules SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scoring rule',
      error: error.message
    });
  }
};

// ============================================
// QUESTION BANK
// ============================================

/**
 * Get questions from the question bank
 */
const getQuestionBank = async (req, res) => {
  try {
    const { category, subcategory, difficulty, question_type, search, page = 1, limit = 20 } = req.query;
    const recruiterId = req.user?.id;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM question_bank 
      WHERE is_active = TRUE AND (is_public = TRUE OR recruiter_id = ?)
    `;
    const params = [recruiterId];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    if (question_type) {
      query += ' AND question_type = ?';
      params.push(question_type);
    }

    if (search) {
      query += ' AND (question_text LIKE ? OR question_text_ar LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY usage_count DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [questions] = await db.query(query, params);

    // Get total count
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM question_bank WHERE is_active = TRUE AND (is_public = TRUE OR recruiter_id = ?)',
      [recruiterId]
    );

    res.json({
      success: true,
      data: questions.map(parseQuestionJSON),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question bank',
      error: error.message
    });
  }
};

/**
 * Add a question to the question bank
 */
const addToQuestionBank = async (req, res) => {
  try {
    const recruiterId = req.user?.id;
    const {
      category,
      subcategory,
      difficulty,
      question_type,
      question_text,
      question_text_ar,
      options,
      correct_answers,
      expected_response,
      keywords,
      rubric,
      skill_tags,
      estimated_time_minutes,
      programming_language,
      test_cases,
      starter_code,
      spreadsheet_template,
      is_public
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO question_bank (
        recruiter_id, category, subcategory, difficulty, question_type,
        question_text, question_text_ar, options, correct_answers,
        expected_response, keywords, rubric, skill_tags, estimated_time_minutes,
        programming_language, test_cases, starter_code, spreadsheet_template, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      recruiterId,
      category,
      subcategory || null,
      difficulty || 'medium',
      question_type,
      question_text,
      question_text_ar || null,
      options ? JSON.stringify(options) : null,
      correct_answers ? JSON.stringify(correct_answers) : null,
      expected_response || null,
      keywords ? JSON.stringify(keywords) : null,
      rubric ? JSON.stringify(rubric) : null,
      skill_tags ? JSON.stringify(skill_tags) : null,
      estimated_time_minutes || 5,
      programming_language || null,
      test_cases ? JSON.stringify(test_cases) : null,
      starter_code || null,
      spreadsheet_template ? JSON.stringify(spreadsheet_template) : null,
      is_public !== false
    ]);

    res.status(201).json({
      success: true,
      message: 'Question added to bank successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error adding to question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add question to bank',
      error: error.message
    });
  }
};

/**
 * Import question from bank to template/case study
 */
const importFromQuestionBank = async (req, res) => {
  try {
    const { bankQuestionId, template_id, case_study_id, question_order } = req.body;

    const [bankQuestions] = await db.query(
      'SELECT * FROM question_bank WHERE id = ?',
      [bankQuestionId]
    );

    if (!bankQuestions.length) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in bank'
      });
    }

    const bq = bankQuestions[0];

    // Create a copy in custom_questions
    const [result] = await db.query(`
      INSERT INTO custom_questions (
        template_id, case_study_id, question_type, question_text, question_text_ar,
        question_order, options, correct_answers, expected_response,
        keywords, rubric, max_score, programming_language, test_cases,
        starter_code, spreadsheet_template, skill_tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      template_id || null,
      case_study_id || null,
      bq.question_type,
      bq.question_text,
      bq.question_text_ar,
      question_order || 0,
      bq.options,
      bq.correct_answers,
      bq.expected_response,
      bq.keywords,
      bq.rubric,
      100,
      bq.programming_language,
      bq.test_cases,
      bq.starter_code,
      bq.spreadsheet_template,
      bq.skill_tags
    ]);

    // Increment usage count
    await db.query(
      'UPDATE question_bank SET usage_count = usage_count + 1 WHERE id = ?',
      [bankQuestionId]
    );

    res.status(201).json({
      success: true,
      message: 'Question imported successfully',
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error('Error importing from question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import question',
      error: error.message
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function parseQuestionJSON(question) {
  if (!question) return null;
  
  return {
    ...question,
    options: safeJSONParse(question.options),
    correct_answers: safeJSONParse(question.correct_answers),
    keywords: safeJSONParse(question.keywords),
    rubric: safeJSONParse(question.rubric),
    test_cases: safeJSONParse(question.test_cases),
    spreadsheet_template: safeJSONParse(question.spreadsheet_template),
    spreadsheet_solution: safeJSONParse(question.spreadsheet_solution),
    skill_tags: safeJSONParse(question.skill_tags)
  };
}

function safeJSONParse(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Questions CRUD
  createQuestion,
  createBulkQuestions,
  getQuestionsByTemplate,
  getQuestionsByCaseStudy,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  duplicateQuestion,
  
  // Scoring Rules
  createScoringRule,
  getScoringRules,
  updateScoringRule,
  deleteScoringRule,
  
  // Question Bank
  getQuestionBank,
  addToQuestionBank,
  importFromQuestionBank
};
