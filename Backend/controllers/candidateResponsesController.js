// controllers/candidateResponsesController.js
// Controller for handling candidate responses to custom questions

const db = require("../src/config/database");
const scoringService = require("../services/automaticScoringService");
const { v4: uuidv4 } = require('uuid');

// ============================================
// SUBMIT RESPONSES
// ============================================

/**
 * Submit a single response to a question
 */
const submitResponse = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      question_id,
      module_id,
      response_type,
      response_text,
      response_mcq,
      response_file_url,
      response_video_url,
      response_code,
      response_code_language,
      response_spreadsheet,
      time_spent
    } = req.body;

    if (!question_id || !response_type) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and response type are required'
      });
    }

    // Get the question details for scoring
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ?',
      [question_id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = parseQuestionJSON(questions[0]);

    // Check if response already exists
    const [existing] = await db.query(`
      SELECT id FROM candidate_responses 
      WHERE question_id = ? AND (application_id = ? OR assessment_application_id = ?)
    `, [question_id, application_id, assessment_application_id]);

    let responseId;

    if (existing.length) {
      // Update existing response
      responseId = existing[0].id;
      await db.query(`
        UPDATE candidate_responses SET
          response_type = ?,
          response_text = ?,
          response_mcq = ?,
          response_file_url = ?,
          response_video_url = ?,
          response_code = ?,
          response_code_language = ?,
          response_spreadsheet = ?,
          time_spent = COALESCE(time_spent, 0) + ?,
          completed_at = NOW()
        WHERE id = ?
      `, [
        response_type,
        response_text || null,
        response_mcq ? JSON.stringify(response_mcq) : null,
        response_file_url || null,
        response_video_url || null,
        response_code || null,
        response_code_language || null,
        response_spreadsheet ? JSON.stringify(response_spreadsheet) : null,
        time_spent || 0,
        responseId
      ]);
    } else {
      // Create new response
      const [result] = await db.query(`
        INSERT INTO candidate_responses (
          application_id, assessment_application_id, question_id, module_id,
          response_type, response_text, response_mcq, response_file_url,
          response_video_url, response_code, response_code_language,
          response_spreadsheet, time_spent, started_at, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        application_id || null,
        assessment_application_id || null,
        question_id,
        module_id || null,
        response_type,
        response_text || null,
        response_mcq ? JSON.stringify(response_mcq) : null,
        response_file_url || null,
        response_video_url || null,
        response_code || null,
        response_code_language || null,
        response_spreadsheet ? JSON.stringify(response_spreadsheet) : null,
        time_spent || 0
      ]);
      responseId = result.insertId;
    }

    // Auto-score if applicable
    let scoreResult = null;
    const autoScoreTypes = ['mcq', 'mcq_multiple', 'coding', 'sql', 'excel'];
    
    if (autoScoreTypes.includes(question.question_type)) {
      const responseData = {
        response_text,
        response_mcq: response_mcq || [],
        response_code,
        response_code_language,
        response_spreadsheet
      };
      
      scoreResult = await scoringService.scoreResponse(responseData, question);
      
      // Update with score
      await db.query(`
        UPDATE candidate_responses SET
          auto_score = ?,
          auto_feedback = ?,
          score_breakdown = ?,
          final_score = ?
        WHERE id = ?
      `, [
        scoreResult.score,
        scoreResult.feedback,
        JSON.stringify(scoreResult.breakdown || {}),
        scoreResult.score, // Final score defaults to auto score
        responseId
      ]);
    }

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      data: {
        responseId,
        autoScore: scoreResult?.score,
        feedback: scoreResult?.feedback
      }
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
};

/**
 * Submit multiple responses at once (for batch submission)
 */
const submitBulkResponses = async (req, res) => {
  try {
    const { application_id, assessment_application_id, responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: 'Responses array is required'
      });
    }

    const results = [];

    for (const response of responses) {
      try {
        const [questions] = await db.query(
          'SELECT * FROM custom_questions WHERE id = ?',
          [response.question_id]
        );

        if (!questions.length) {
          results.push({
            question_id: response.question_id,
            success: false,
            error: 'Question not found'
          });
          continue;
        }

        const question = parseQuestionJSON(questions[0]);

        // Insert response
        const [result] = await db.query(`
          INSERT INTO candidate_responses (
            application_id, assessment_application_id, question_id, module_id,
            response_type, response_text, response_mcq, response_file_url,
            response_video_url, response_code, response_code_language,
            response_spreadsheet, time_spent, started_at, completed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            response_text = VALUES(response_text),
            response_mcq = VALUES(response_mcq),
            response_code = VALUES(response_code),
            response_spreadsheet = VALUES(response_spreadsheet),
            time_spent = time_spent + VALUES(time_spent),
            completed_at = NOW()
        `, [
          application_id || null,
          assessment_application_id || null,
          response.question_id,
          response.module_id || null,
          response.response_type || 'text',
          response.response_text || null,
          response.response_mcq ? JSON.stringify(response.response_mcq) : null,
          response.response_file_url || null,
          response.response_video_url || null,
          response.response_code || null,
          response.response_code_language || null,
          response.response_spreadsheet ? JSON.stringify(response.response_spreadsheet) : null,
          response.time_spent || 0
        ]);

        results.push({
          question_id: response.question_id,
          success: true,
          response_id: result.insertId
        });

      } catch (err) {
        results.push({
          question_id: response.question_id,
          success: false,
          error: err.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Submitted ${results.filter(r => r.success).length}/${responses.length} responses`,
      data: results
    });

  } catch (error) {
    console.error('Error submitting bulk responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit responses',
      error: error.message
    });
  }
};

/**
 * Submit coding test response with execution
 */
const submitCodingResponse = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      question_id,
      code,
      language
    } = req.body;

    if (!question_id || !code || !language) {
      return res.status(400).json({
        success: false,
        message: 'Question ID, code, and language are required'
      });
    }

    // Get question with test cases
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ? AND question_type = "coding"',
      [question_id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Coding question not found'
      });
    }

    const question = parseQuestionJSON(questions[0]);

    // Save response
    const [responseResult] = await db.query(`
      INSERT INTO candidate_responses (
        application_id, assessment_application_id, question_id,
        response_type, response_code, response_code_language,
        started_at, completed_at
      ) VALUES (?, ?, ?, 'code', ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        response_code = VALUES(response_code),
        response_code_language = VALUES(response_code_language),
        completed_at = NOW()
    `, [
      application_id || null,
      assessment_application_id || null,
      question_id,
      code,
      language
    ]);

    const responseId = responseResult.insertId || responseResult.affectedRows;

    // Score the code submission
    const scoreResult = await scoringService.scoreCodeSubmission(code, question, language);

    // Save coding submission details
    await db.query(`
      INSERT INTO coding_submissions (
        response_id, question_id, code, language,
        execution_status, execution_output, execution_error,
        test_results, tests_passed, tests_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      question_id,
      code,
      language,
      'completed',
      scoreResult.results?.[0]?.actualOutput || null,
      scoreResult.results?.[0]?.error || null,
      JSON.stringify(scoreResult.results || []),
      scoreResult.passedCount || 0,
      scoreResult.totalCount || 0
    ]);

    // Update response with score
    await db.query(`
      UPDATE candidate_responses SET
        auto_score = ?,
        auto_feedback = ?,
        code_execution_result = ?,
        final_score = ?
      WHERE id = ?
    `, [
      scoreResult.score,
      scoreResult.feedback,
      JSON.stringify({
        passed: scoreResult.passedCount,
        failed: scoreResult.totalCount - scoreResult.passedCount,
        results: scoreResult.results
      }),
      scoreResult.score,
      responseId
    ]);

    res.status(201).json({
      success: true,
      message: 'Code submitted and evaluated',
      data: {
        responseId,
        score: scoreResult.score,
        passedTests: scoreResult.passedCount,
        totalTests: scoreResult.totalCount,
        results: scoreResult.results,
        feedback: scoreResult.feedback
      }
    });

  } catch (error) {
    console.error('Error submitting coding response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit code',
      error: error.message
    });
  }
};

/**
 * Submit SQL response with validation
 */
const submitSQLResponse = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      question_id,
      query
    } = req.body;

    if (!question_id || !query) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and SQL query are required'
      });
    }

    // Get question
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ? AND question_type = "sql"',
      [question_id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'SQL question not found'
      });
    }

    const question = parseQuestionJSON(questions[0]);

    // Save response
    const [responseResult] = await db.query(`
      INSERT INTO candidate_responses (
        application_id, assessment_application_id, question_id,
        response_type, response_text, started_at, completed_at
      ) VALUES (?, ?, ?, 'text', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        response_text = VALUES(response_text),
        completed_at = NOW()
    `, [
      application_id || null,
      assessment_application_id || null,
      question_id,
      query
    ]);

    const responseId = responseResult.insertId || responseResult.affectedRows;

    // Score SQL submission
    const scoreResult = await scoringService.scoreSQLSubmission(query, question);

    // Save SQL submission details
    await db.query(`
      INSERT INTO sql_submissions (
        response_id, question_id, query, database_schema,
        execution_status, syntax_valid, correctness_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      question_id,
      query,
      JSON.stringify(question.spreadsheet_template || {}),
      scoreResult.syntaxValid ? 'completed' : 'error',
      scoreResult.syntaxValid,
      scoreResult.score
    ]);

    // Update response with score
    await db.query(`
      UPDATE candidate_responses SET
        auto_score = ?,
        auto_feedback = ?,
        final_score = ?
      WHERE id = ?
    `, [scoreResult.score, scoreResult.feedback, scoreResult.score, responseId]);

    res.status(201).json({
      success: true,
      message: 'SQL query submitted and validated',
      data: {
        responseId,
        score: scoreResult.score,
        syntaxValid: scoreResult.syntaxValid,
        feedback: scoreResult.feedback
      }
    });

  } catch (error) {
    console.error('Error submitting SQL response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit SQL query',
      error: error.message
    });
  }
};

/**
 * Submit spreadsheet/Excel response
 */
const submitSpreadsheetResponse = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      question_id,
      spreadsheet_data
    } = req.body;

    if (!question_id || !spreadsheet_data) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and spreadsheet data are required'
      });
    }

    // Get question
    const [questions] = await db.query(
      'SELECT * FROM custom_questions WHERE id = ? AND question_type = "excel"',
      [question_id]
    );

    if (!questions.length) {
      return res.status(404).json({
        success: false,
        message: 'Excel question not found'
      });
    }

    const question = parseQuestionJSON(questions[0]);

    // Save response
    const [responseResult] = await db.query(`
      INSERT INTO candidate_responses (
        application_id, assessment_application_id, question_id,
        response_type, response_spreadsheet, started_at, completed_at
      ) VALUES (?, ?, ?, 'spreadsheet', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        response_spreadsheet = VALUES(response_spreadsheet),
        completed_at = NOW()
    `, [
      application_id || null,
      assessment_application_id || null,
      question_id,
      JSON.stringify(spreadsheet_data)
    ]);

    const responseId = responseResult.insertId || responseResult.affectedRows;

    // Score spreadsheet submission
    const scoreResult = scoringService.scoreSpreadsheetSubmission(spreadsheet_data, question);

    // Save spreadsheet submission details
    await db.query(`
      INSERT INTO spreadsheet_submissions (
        response_id, question_id, spreadsheet_data, formulas_used,
        cell_checks, formula_checks, accuracy_score, formula_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      question_id,
      JSON.stringify(spreadsheet_data),
      JSON.stringify(spreadsheet_data.formulas || []),
      JSON.stringify(scoreResult.cellChecks || []),
      JSON.stringify(scoreResult.formulaChecks || []),
      scoreResult.accuracy?.cells || 0,
      scoreResult.accuracy?.formulas || 0
    ]);

    // Update response with score
    await db.query(`
      UPDATE candidate_responses SET
        auto_score = ?,
        auto_feedback = ?,
        score_breakdown = ?,
        final_score = ?
      WHERE id = ?
    `, [
      scoreResult.score,
      scoreResult.feedback,
      JSON.stringify(scoreResult.accuracy || {}),
      scoreResult.score,
      responseId
    ]);

    res.status(201).json({
      success: true,
      message: 'Spreadsheet submitted and evaluated',
      data: {
        responseId,
        score: scoreResult.score,
        accuracy: scoreResult.accuracy,
        cellChecks: scoreResult.cellChecks,
        formulaChecks: scoreResult.formulaChecks,
        feedback: scoreResult.feedback
      }
    });

  } catch (error) {
    console.error('Error submitting spreadsheet response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit spreadsheet',
      error: error.message
    });
  }
};

/**
 * Submit video response
 */
const submitVideoResponse = async (req, res) => {
  try {
    const {
      application_id,
      assessment_application_id,
      question_id,
      video_url,
      thumbnail_url,
      duration_seconds,
      file_size_bytes,
      transcript
    } = req.body;

    if (!question_id || !video_url) {
      return res.status(400).json({
        success: false,
        message: 'Question ID and video URL are required'
      });
    }

    // Save response
    const [responseResult] = await db.query(`
      INSERT INTO candidate_responses (
        application_id, assessment_application_id, question_id,
        response_type, response_video_url, started_at, completed_at
      ) VALUES (?, ?, ?, 'video', ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        response_video_url = VALUES(response_video_url),
        completed_at = NOW()
    `, [
      application_id || null,
      assessment_application_id || null,
      question_id,
      video_url
    ]);

    const responseId = responseResult.insertId || responseResult.affectedRows;

    // Save video submission details
    await db.query(`
      INSERT INTO video_submissions (
        response_id, question_id, video_url, thumbnail_url,
        duration_seconds, file_size_bytes, transcript
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      responseId,
      question_id,
      video_url,
      thumbnail_url || null,
      duration_seconds || null,
      file_size_bytes || null,
      transcript || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Video response submitted',
      data: {
        responseId,
        requiresManualReview: true
      }
    });

  } catch (error) {
    console.error('Error submitting video response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit video',
      error: error.message
    });
  }
};

// ============================================
// GET RESPONSES
// ============================================

/**
 * Get all responses for an application
 */
const getResponsesByApplication = async (req, res) => {
  try {
    const { applicationId, assessmentApplicationId } = req.query;

    let query = `
      SELECT cr.*, cq.question_text, cq.question_type, cq.max_score, cq.correct_answers
      FROM candidate_responses cr
      JOIN custom_questions cq ON cr.question_id = cq.id
      WHERE 1=1
    `;
    const params = [];

    if (applicationId) {
      query += ' AND cr.application_id = ?';
      params.push(applicationId);
    }
    if (assessmentApplicationId) {
      query += ' AND cr.assessment_application_id = ?';
      params.push(assessmentApplicationId);
    }

    query += ' ORDER BY cq.question_order ASC';

    const [responses] = await db.query(query, params);

    res.json({
      success: true,
      data: responses.map(r => ({
        ...r,
        response_mcq: safeJSONParse(r.response_mcq),
        response_spreadsheet: safeJSONParse(r.response_spreadsheet),
        code_execution_result: safeJSONParse(r.code_execution_result),
        score_breakdown: safeJSONParse(r.score_breakdown),
        suspicious_activity: safeJSONParse(r.suspicious_activity),
        correct_answers: safeJSONParse(r.correct_answers)
      }))
    });

  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responses',
      error: error.message
    });
  }
};

/**
 * Get a single response by ID
 */
const getResponseById = async (req, res) => {
  try {
    const { id } = req.params;

    const [responses] = await db.query(`
      SELECT cr.*, cq.question_text, cq.question_type, cq.max_score,
             cq.correct_answers, cq.expected_response
      FROM candidate_responses cr
      JOIN custom_questions cq ON cr.question_id = cq.id
      WHERE cr.id = ?
    `, [id]);

    if (!responses.length) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    res.json({
      success: true,
      data: parseResponseJSON(responses[0])
    });

  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch response',
      error: error.message
    });
  }
};

// ============================================
// MANUAL SCORING
// ============================================

/**
 * Manually score/review a response
 */
const scoreResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { manual_score, manual_feedback } = req.body;

    if (manual_score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Manual score is required'
      });
    }

    await db.query(`
      UPDATE candidate_responses SET
        manual_score = ?,
        manual_feedback = ?,
        final_score = ?
      WHERE id = ?
    `, [manual_score, manual_feedback || null, manual_score, id]);

    res.json({
      success: true,
      message: 'Response scored successfully'
    });

  } catch (error) {
    console.error('Error scoring response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to score response',
      error: error.message
    });
  }
};

/**
 * Trigger AI evaluation for open-ended responses
 */
const triggerAIEvaluation = async (req, res) => {
  try {
    const { applicationId, assessmentApplicationId, language } = req.body;

    // Get all open-ended responses without scores
    const [responses] = await db.query(`
      SELECT cr.*, cq.* 
      FROM candidate_responses cr
      JOIN custom_questions cq ON cr.question_id = cq.id
      WHERE (cr.application_id = ? OR cr.assessment_application_id = ?)
        AND cq.question_type IN ('open_ended', 'writing', 'situational')
        AND cr.auto_score IS NULL
    `, [applicationId, assessmentApplicationId]);

    const results = [];

    for (const response of responses) {
      const question = parseQuestionJSON(response);
      
      const scoreResult = await scoringService.scoreOpenEndedWithAI(
        response.response_text,
        question,
        language || 'en'
      );

      await db.query(`
        UPDATE candidate_responses SET
          auto_score = ?,
          auto_feedback = ?,
          auto_feedback_ar = ?,
          score_breakdown = ?,
          final_score = COALESCE(manual_score, ?)
        WHERE id = ?
      `, [
        scoreResult.score,
        scoreResult.feedback,
        scoreResult.feedbackAr || null,
        JSON.stringify(scoreResult.breakdown || {}),
        scoreResult.score,
        response.id
      ]);

      results.push({
        questionId: response.question_id,
        score: scoreResult.score,
        feedback: scoreResult.feedback
      });
    }

    res.json({
      success: true,
      message: `Evaluated ${results.length} responses`,
      data: results
    });

  } catch (error) {
    console.error('Error triggering AI evaluation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger AI evaluation',
      error: error.message
    });
  }
};

/**
 * Get overall assessment results
 */
const getAssessmentResults = async (req, res) => {
  try {
    const { applicationId, assessmentApplicationId } = req.query;

    // Get all responses with questions
    const [responses] = await db.query(`
      SELECT cr.*, cq.question_text, cq.question_type, cq.max_score, cq.weight,
             cq.skill_tags, am.title as module_title, am.weight as module_weight
      FROM candidate_responses cr
      JOIN custom_questions cq ON cr.question_id = cq.id
      LEFT JOIN assessment_modules am ON cr.module_id = am.id
      WHERE cr.application_id = ? OR cr.assessment_application_id = ?
      ORDER BY cq.question_order ASC
    `, [applicationId, assessmentApplicationId]);

    if (!responses.length) {
      return res.status(404).json({
        success: false,
        message: 'No responses found'
      });
    }

    // Calculate overall statistics
    let totalScore = 0;
    let totalMaxScore = 0;
    let totalWeight = 0;
    const moduleScores = {};
    const questionTypeScores = {};
    const skillScores = {};

    for (const r of responses) {
      const score = r.final_score ?? r.auto_score ?? 0;
      const maxScore = r.max_score || 100;
      const weight = r.weight || 1;

      totalScore += score * weight;
      totalMaxScore += maxScore * weight;
      totalWeight += weight;

      // Module scores
      if (r.module_id) {
        if (!moduleScores[r.module_id]) {
          moduleScores[r.module_id] = {
            title: r.module_title,
            totalScore: 0,
            totalMax: 0,
            count: 0
          };
        }
        moduleScores[r.module_id].totalScore += score;
        moduleScores[r.module_id].totalMax += maxScore;
        moduleScores[r.module_id].count++;
      }

      // Question type scores
      if (!questionTypeScores[r.question_type]) {
        questionTypeScores[r.question_type] = { total: 0, max: 0, count: 0 };
      }
      questionTypeScores[r.question_type].total += score;
      questionTypeScores[r.question_type].max += maxScore;
      questionTypeScores[r.question_type].count++;

      // Skill scores
      const skills = safeJSONParse(r.skill_tags) || [];
      for (const skill of skills) {
        if (!skillScores[skill]) {
          skillScores[skill] = { total: 0, max: 0, count: 0 };
        }
        skillScores[skill].total += score;
        skillScores[skill].max += maxScore;
        skillScores[skill].count++;
      }
    }

    const overallPercentage = totalMaxScore > 0 ? 
      Math.round((totalScore / totalMaxScore) * 100) : 0;

    // Get session info
    const [sessions] = await db.query(`
      SELECT * FROM assessment_sessions 
      WHERE application_id = ? OR assessment_application_id = ?
      ORDER BY created_at DESC LIMIT 1
    `, [applicationId, assessmentApplicationId]);

    res.json({
      success: true,
      data: {
        overall: {
          score: Math.round(totalScore),
          maxScore: Math.round(totalMaxScore),
          percentage: overallPercentage,
          rating: getRating(overallPercentage)
        },
        moduleScores: Object.entries(moduleScores).map(([id, data]) => ({
          moduleId: id,
          title: data.title,
          score: Math.round((data.totalScore / data.totalMax) * 100),
          questionCount: data.count
        })),
        questionTypeScores: Object.entries(questionTypeScores).map(([type, data]) => ({
          type,
          score: Math.round((data.total / data.max) * 100),
          questionCount: data.count
        })),
        skillScores: Object.entries(skillScores).map(([skill, data]) => ({
          skill,
          score: Math.round((data.total / data.max) * 100),
          questionCount: data.count
        })),
        session: sessions[0] ? {
          status: sessions[0].status,
          timeSpent: sessions[0].total_time_spent,
          integrityScore: sessions[0].integrity_score,
          warnings: sessions[0].warnings_issued
        } : null,
        responses: responses.map(r => ({
          questionId: r.question_id,
          questionType: r.question_type,
          questionText: r.question_text,
          score: r.final_score ?? r.auto_score,
          maxScore: r.max_score,
          feedback: r.auto_feedback || r.manual_feedback,
          timeSpent: r.time_spent
        }))
      }
    });

  } catch (error) {
    console.error('Error getting assessment results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assessment results',
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

function parseResponseJSON(response) {
  if (!response) return null;
  return {
    ...response,
    response_mcq: safeJSONParse(response.response_mcq),
    response_spreadsheet: safeJSONParse(response.response_spreadsheet),
    code_execution_result: safeJSONParse(response.code_execution_result),
    score_breakdown: safeJSONParse(response.score_breakdown),
    suspicious_activity: safeJSONParse(response.suspicious_activity),
    correct_answers: safeJSONParse(response.correct_answers)
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

function getRating(percentage) {
  if (percentage >= 85) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 55) return 'Fair';
  return 'Poor';
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Submit responses
  submitResponse,
  submitBulkResponses,
  submitCodingResponse,
  submitSQLResponse,
  submitSpreadsheetResponse,
  submitVideoResponse,
  
  // Get responses
  getResponsesByApplication,
  getResponseById,
  
  // Scoring
  scoreResponse,
  triggerAIEvaluation,
  getAssessmentResults
};
