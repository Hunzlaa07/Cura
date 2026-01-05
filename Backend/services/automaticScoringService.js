// services/automaticScoringService.js
// Comprehensive automatic scoring service for various assessment types

const db = require("../src/config/database");
const aiService = require("./aiService");

// ============================================
// MCQ SCORING
// ============================================
function scoreMCQ(response, question) {
  const correctAnswers = question.correct_answers || [];
  const selectedAnswers = response.response_mcq || [];
  
  if (!correctAnswers.length) {
    return { score: 0, feedback: 'No correct answer defined', breakdown: {} };
  }
  
  // Single select MCQ
  if (question.question_type === 'mcq') {
    const isCorrect = selectedAnswers.length === 1 && 
                      correctAnswers.includes(selectedAnswers[0]);
    return {
      score: isCorrect ? question.max_score : 0,
      feedback: isCorrect ? 'Correct answer' : 'Incorrect answer',
      breakdown: {
        selected: selectedAnswers,
        correct: correctAnswers,
        isCorrect
      }
    };
  }
  
  // Multiple select MCQ
  if (question.question_type === 'mcq_multiple') {
    const correctSet = new Set(correctAnswers);
    const selectedSet = new Set(selectedAnswers);
    
    let correctSelections = 0;
    let incorrectSelections = 0;
    let missedSelections = 0;
    
    selectedAnswers.forEach(ans => {
      if (correctSet.has(ans)) {
        correctSelections++;
      } else {
        incorrectSelections++;
      }
    });
    
    correctAnswers.forEach(ans => {
      if (!selectedSet.has(ans)) {
        missedSelections++;
      }
    });
    
    // Calculate score based on partial credit setting
    let score = 0;
    if (question.partial_credit) {
      // Partial credit: points for correct, minus for incorrect
      const pointsPerCorrect = question.max_score / correctAnswers.length;
      score = Math.max(0, (correctSelections * pointsPerCorrect) - 
                         (incorrectSelections * pointsPerCorrect * 0.5));
    } else {
      // All or nothing
      score = (correctSelections === correctAnswers.length && 
               incorrectSelections === 0) ? question.max_score : 0;
    }
    
    return {
      score: Math.round(score * 100) / 100,
      feedback: `${correctSelections}/${correctAnswers.length} correct selections`,
      breakdown: {
        correctSelections,
        incorrectSelections,
        missedSelections,
        totalCorrect: correctAnswers.length
      }
    };
  }
  
  return { score: 0, feedback: 'Unknown MCQ type', breakdown: {} };
}

// ============================================
// KEYWORD-BASED SCORING
// ============================================
function scoreKeywordMatch(responseText, question) {
  const keywords = question.keywords || [];
  const responseTextLower = (responseText || '').toLowerCase();
  
  if (!keywords.length) {
    return { score: 0, matched: [], feedback: 'No keywords defined' };
  }
  
  const matchedKeywords = [];
  const missedKeywords = [];
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    if (responseTextLower.includes(keywordLower)) {
      matchedKeywords.push(keyword);
    } else {
      missedKeywords.push(keyword);
    }
  });
  
  const matchRatio = matchedKeywords.length / keywords.length;
  const score = Math.round(matchRatio * question.max_score);
  
  return {
    score,
    matched: matchedKeywords,
    missed: missedKeywords,
    matchRatio,
    feedback: `Matched ${matchedKeywords.length}/${keywords.length} key concepts`
  };
}

// ============================================
// CODE EXECUTION & SCORING
// ============================================
async function scoreCodeSubmission(code, question, language) {
  const testCases = question.test_cases || [];
  
  if (!testCases.length) {
    return {
      score: 0,
      feedback: 'No test cases defined',
      results: []
    };
  }
  
  const results = [];
  let passedCount = 0;
  
  for (const testCase of testCases) {
    try {
      const result = await executeCode(code, language, testCase.input);
      const passed = normalizeOutput(result.output) === normalizeOutput(testCase.expected_output);
      
      results.push({
        id: testCase.id,
        input: testCase.is_hidden ? '[Hidden]' : testCase.input,
        expectedOutput: testCase.is_hidden ? '[Hidden]' : testCase.expected_output,
        actualOutput: testCase.is_hidden ? (passed ? '[Correct]' : '[Incorrect]') : result.output,
        passed,
        executionTime: result.executionTime,
        error: result.error
      });
      
      if (passed) passedCount++;
    } catch (error) {
      results.push({
        id: testCase.id,
        input: testCase.is_hidden ? '[Hidden]' : testCase.input,
        passed: false,
        error: error.message
      });
    }
  }
  
  const score = Math.round((passedCount / testCases.length) * question.max_score);
  
  return {
    score,
    passedCount,
    totalCount: testCases.length,
    results,
    feedback: `Passed ${passedCount}/${testCases.length} test cases`
  };
}

// Simulated code execution (in production, use a sandboxed environment)
async function executeCode(code, language, input) {
  // In production, this would call a secure code execution service
  // like Judge0, HackerRank API, or a custom sandboxed container
  
  const startTime = Date.now();
  
  // Placeholder for actual execution
  // This should be replaced with actual code execution logic
  const executionResult = {
    output: '',
    error: null,
    executionTime: Date.now() - startTime
  };
  
  // For demonstration, we'll use a simple eval for JavaScript only
  // WARNING: Never use eval in production without proper sandboxing
  if (language === 'javascript') {
    try {
      // This is a placeholder - use proper sandboxing in production
      const vm = require('vm');
      const sandbox = { 
        input,
        result: null,
        console: { log: (x) => sandbox.result = x }
      };
      const script = new vm.Script(`${code}\n// Execute with input\n`);
      const context = vm.createContext(sandbox);
      script.runInContext(context, { timeout: 5000 });
      executionResult.output = String(sandbox.result || '');
    } catch (error) {
      executionResult.error = error.message;
    }
  }
  
  return executionResult;
}

function normalizeOutput(output) {
  if (output === null || output === undefined) return '';
  return String(output).trim().replace(/\r\n/g, '\n');
}

// ============================================
// SQL SCORING
// ============================================
async function scoreSQLSubmission(query, question) {
  const expectedResultSet = question.spreadsheet_solution || question.test_cases?.[0]?.expected_output;
  
  // In production, execute the query against a test database
  // and compare results
  
  const result = {
    syntaxValid: true,
    resultMatch: false,
    score: 0,
    feedback: ''
  };
  
  // Basic syntax validation
  try {
    validateSQLSyntax(query);
    result.syntaxValid = true;
  } catch (error) {
    result.syntaxValid = false;
    result.feedback = `SQL Syntax Error: ${error.message}`;
    return result;
  }
  
  // For actual execution, you would:
  // 1. Create a temporary database with the question's schema
  // 2. Execute the candidate's query
  // 3. Compare results with expected output
  
  // Placeholder scoring based on keyword analysis
  const sqlKeywords = extractSQLComponents(query.toLowerCase());
  const expectedKeywords = extractSQLComponents((expectedResultSet || '').toLowerCase());
  
  let matchScore = 0;
  if (sqlKeywords.select && expectedKeywords.select) matchScore += 25;
  if (sqlKeywords.from && expectedKeywords.from) matchScore += 25;
  if (sqlKeywords.where === expectedKeywords.where) matchScore += 25;
  if (sqlKeywords.orderBy === expectedKeywords.orderBy) matchScore += 25;
  
  result.score = Math.round(matchScore * (question.max_score / 100));
  result.feedback = `Query structure analysis: ${matchScore}% match`;
  
  return result;
}

function validateSQLSyntax(query) {
  // Basic syntax validation
  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE'];
  const upperQuery = query.toUpperCase();
  
  for (const keyword of dangerousKeywords) {
    if (upperQuery.includes(keyword)) {
      throw new Error(`Dangerous keyword detected: ${keyword}`);
    }
  }
  
  // Check for basic SELECT structure
  if (!upperQuery.includes('SELECT')) {
    throw new Error('Query must contain SELECT statement');
  }
  
  return true;
}

function extractSQLComponents(query) {
  return {
    select: query.includes('select'),
    from: query.includes('from'),
    where: query.includes('where'),
    join: query.includes('join'),
    groupBy: query.includes('group by'),
    orderBy: query.includes('order by'),
    having: query.includes('having')
  };
}

// ============================================
// SPREADSHEET/EXCEL SCORING
// ============================================
function scoreSpreadsheetSubmission(submittedData, question) {
  const solution = question.spreadsheet_solution || {};
  const cellChecks = [];
  const formulaChecks = [];
  
  let correctCells = 0;
  let totalCells = 0;
  let correctFormulas = 0;
  let totalFormulas = 0;
  
  // Check cell values
  if (solution.expectedCells) {
    for (const [cell, expectedValue] of Object.entries(solution.expectedCells)) {
      totalCells++;
      const actualValue = getCellValue(submittedData, cell);
      const isCorrect = compareValues(actualValue, expectedValue, solution.tolerance || 0);
      
      if (isCorrect) correctCells++;
      
      cellChecks.push({
        cell,
        expected: expectedValue,
        actual: actualValue,
        correct: isCorrect
      });
    }
  }
  
  // Check formulas
  if (solution.expectedFormulas) {
    for (const [cell, expectedFormula] of Object.entries(solution.expectedFormulas)) {
      totalFormulas++;
      const actualFormula = getCellFormula(submittedData, cell);
      const isCorrect = normalizeFormula(actualFormula) === normalizeFormula(expectedFormula);
      
      if (isCorrect) correctFormulas++;
      
      formulaChecks.push({
        cell,
        expectedFormula,
        actualFormula,
        correct: isCorrect
      });
    }
  }
  
  // Calculate scores
  const cellScore = totalCells > 0 ? (correctCells / totalCells) * 50 : 50;
  const formulaScore = totalFormulas > 0 ? (correctFormulas / totalFormulas) * 50 : 50;
  const totalScore = Math.round((cellScore + formulaScore) * (question.max_score / 100));
  
  return {
    score: totalScore,
    cellChecks,
    formulaChecks,
    accuracy: {
      cells: totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 100,
      formulas: totalFormulas > 0 ? Math.round((correctFormulas / totalFormulas) * 100) : 100
    },
    feedback: `Cell accuracy: ${correctCells}/${totalCells}, Formula accuracy: ${correctFormulas}/${totalFormulas}`
  };
}

function getCellValue(spreadsheetData, cellRef) {
  // Parse cell reference (e.g., "B5" -> column B, row 5)
  const match = cellRef.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const col = match[1].toUpperCase();
  const row = parseInt(match[2]) - 1;
  const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
  
  if (spreadsheetData?.data?.[row]?.[colIndex]) {
    return spreadsheetData.data[row][colIndex].value;
  }
  return null;
}

function getCellFormula(spreadsheetData, cellRef) {
  const match = cellRef.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const col = match[1].toUpperCase();
  const row = parseInt(match[2]) - 1;
  const colIndex = col.charCodeAt(0) - 'A'.charCodeAt(0);
  
  if (spreadsheetData?.data?.[row]?.[colIndex]) {
    return spreadsheetData.data[row][colIndex].formula || null;
  }
  return null;
}

function compareValues(actual, expected, tolerance = 0) {
  if (actual === expected) return true;
  
  // Numeric comparison with tolerance
  const numActual = parseFloat(actual);
  const numExpected = parseFloat(expected);
  
  if (!isNaN(numActual) && !isNaN(numExpected)) {
    return Math.abs(numActual - numExpected) <= tolerance;
  }
  
  // String comparison (case-insensitive)
  if (typeof actual === 'string' && typeof expected === 'string') {
    return actual.toLowerCase().trim() === expected.toLowerCase().trim();
  }
  
  return false;
}

function normalizeFormula(formula) {
  if (!formula) return '';
  return formula
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/\$/g, ''); // Remove absolute references for comparison
}

// ============================================
// COGNITIVE TEST SCORING
// ============================================
function scoreCognitiveTest(responses, testTemplate) {
  const scoringMethod = testTemplate.scoring_method || 'correct_only';
  let rawScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  
  for (const response of responses) {
    if (response.isCorrect) {
      correctCount++;
      rawScore += 1;
    } else {
      incorrectCount++;
      if (scoringMethod === 'correct_minus_incorrect') {
        rawScore -= 0.25; // Penalty for wrong answers
      }
    }
  }
  
  rawScore = Math.max(0, rawScore);
  const percentageScore = (rawScore / responses.length) * 100;
  
  // Calculate percentile if norm data available
  let percentile = null;
  if (testTemplate.norm_data) {
    percentile = calculatePercentile(rawScore, testTemplate.norm_data);
  }
  
  return {
    rawScore,
    percentageScore: Math.round(percentageScore * 10) / 10,
    correctCount,
    incorrectCount,
    totalQuestions: responses.length,
    percentile,
    feedback: `Score: ${correctCount}/${responses.length} (${Math.round(percentageScore)}%)`
  };
}

function calculatePercentile(score, normData) {
  // Simple percentile calculation based on norm data
  if (!normData || !normData.distribution) return null;
  
  const distribution = normData.distribution;
  let belowCount = 0;
  let totalCount = 0;
  
  for (const [scoreRange, count] of Object.entries(distribution)) {
    totalCount += count;
    if (parseFloat(scoreRange) < score) {
      belowCount += count;
    }
  }
  
  return totalCount > 0 ? Math.round((belowCount / totalCount) * 100) : null;
}

// ============================================
// AI-BASED EVALUATION (for open-ended responses)
// ============================================
async function scoreOpenEndedWithAI(responseText, question, language = 'en') {
  const rubric = question.rubric || getDefaultRubric();
  const expectedResponse = question.expected_response || '';
  const keywords = question.keywords || [];
  
  const prompt = buildAIEvaluationPrompt(
    question.question_text,
    responseText,
    expectedResponse,
    keywords,
    rubric,
    question.max_score,
    language
  );
  
  try {
    const aiResponse = await aiService.chat([
      {
        role: 'system',
        content: `You are an expert assessment evaluator. Evaluate candidate responses objectively and provide detailed scoring based on the rubric provided. Always respond in valid JSON format.`
      },
      {
        role: 'user',
        content: prompt
      }
    ], {
      response_format: { type: 'json_object' }
    });
    
    const evaluation = JSON.parse(aiResponse);
    
    return {
      score: Math.min(question.max_score, Math.max(0, evaluation.score || 0)),
      feedback: evaluation.feedback || '',
      feedbackAr: evaluation.feedback_ar || '',
      breakdown: evaluation.breakdown || {},
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || [],
      keywordsCovered: evaluation.keywords_covered || []
    };
  } catch (error) {
    console.error('AI evaluation error:', error);
    
    // Fallback to keyword-based scoring
    const keywordResult = scoreKeywordMatch(responseText, question);
    return {
      score: keywordResult.score,
      feedback: `Automated evaluation: ${keywordResult.feedback}`,
      breakdown: { keywordMatch: keywordResult.matchRatio * 100 },
      error: 'AI evaluation failed, using keyword matching'
    };
  }
}

function buildAIEvaluationPrompt(question, response, expectedResponse, keywords, rubric, maxScore, language) {
  return `
Evaluate the following candidate response:

## Question
${question}

## Candidate Response
${response}

${expectedResponse ? `## Expected/Model Response\n${expectedResponse}\n` : ''}

${keywords.length ? `## Key Concepts to Look For\n${keywords.join(', ')}\n` : ''}

## Scoring Rubric (Max Score: ${maxScore})
${JSON.stringify(rubric, null, 2)}

## Instructions
1. Evaluate the response against the rubric criteria
2. Identify which key concepts were addressed
3. Note specific strengths and areas for improvement
4. Provide a score out of ${maxScore}

## Required JSON Response Format
{
  "score": <number 0-${maxScore}>,
  "feedback": "<detailed feedback in English>",
  "feedback_ar": "<detailed feedback in Arabic>",
  "breakdown": {
    "relevance": <0-100>,
    "completeness": <0-100>,
    "accuracy": <0-100>,
    "clarity": <0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area for improvement 1>", "<area for improvement 2>"],
  "keywords_covered": ["<keyword1>", "<keyword2>"]
}
`;
}

function getDefaultRubric() {
  return {
    excellent: {
      score_range: "90-100",
      criteria: "Comprehensive, well-structured response demonstrating deep understanding. All key concepts addressed with specific examples."
    },
    good: {
      score_range: "75-89",
      criteria: "Solid response covering most key concepts with reasonable depth. Minor gaps or areas that could be expanded."
    },
    satisfactory: {
      score_range: "60-74",
      criteria: "Adequate response addressing main points but lacking depth or missing some concepts."
    },
    needs_improvement: {
      score_range: "40-59",
      criteria: "Partial response with significant gaps. Shows basic understanding but lacks completeness."
    },
    unsatisfactory: {
      score_range: "0-39",
      criteria: "Inadequate response. Fails to address key concepts or demonstrates misunderstanding."
    }
  };
}

// ============================================
// WRITING ASSESSMENT SCORING
// ============================================
async function scoreWritingAssessment(responseText, question, language = 'en') {
  const wordCount = countWords(responseText);
  const minWords = question.min_word_count || 0;
  const maxWords = question.max_word_count || Infinity;
  
  // Check word count constraints
  const wordCountPenalty = calculateWordCountPenalty(wordCount, minWords, maxWords);
  
  // Get AI evaluation for content quality
  const aiScore = await scoreOpenEndedWithAI(responseText, question, language);
  
  // Adjust score based on word count
  const adjustedScore = Math.max(0, aiScore.score * (1 - wordCountPenalty));
  
  return {
    ...aiScore,
    score: Math.round(adjustedScore),
    wordCount,
    wordCountStatus: wordCount < minWords ? 'below_minimum' : 
                     wordCount > maxWords ? 'above_maximum' : 'within_range',
    wordCountPenalty: wordCountPenalty * 100
  };
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function calculateWordCountPenalty(wordCount, minWords, maxWords) {
  if (wordCount < minWords) {
    // 2% penalty for each percentage below minimum
    const shortage = (minWords - wordCount) / minWords;
    return Math.min(0.5, shortage * 0.5);
  }
  if (wordCount > maxWords) {
    // 1% penalty for each percentage above maximum
    const excess = (wordCount - maxWords) / maxWords;
    return Math.min(0.3, excess * 0.3);
  }
  return 0;
}

// ============================================
// SITUATIONAL JUDGMENT SCORING
// ============================================
function scoreSituationalJudgment(response, question) {
  // Situational judgment tests typically have ranked responses
  const correctRanking = question.correct_answers || [];
  const candidateRanking = response.response_mcq || [];
  
  if (!correctRanking.length || !candidateRanking.length) {
    return {
      score: 0,
      feedback: 'Invalid response or missing correct answers'
    };
  }
  
  // Calculate Kendall's tau or Spearman correlation for ranking
  let concordantPairs = 0;
  let discordantPairs = 0;
  
  for (let i = 0; i < candidateRanking.length; i++) {
    for (let j = i + 1; j < candidateRanking.length; j++) {
      const candidateOrder = candidateRanking.indexOf(candidateRanking[i]) < 
                             candidateRanking.indexOf(candidateRanking[j]) ? 1 : -1;
      
      const correctI = correctRanking.indexOf(candidateRanking[i]);
      const correctJ = correctRanking.indexOf(candidateRanking[j]);
      
      if (correctI === -1 || correctJ === -1) continue;
      
      const correctOrder = correctI < correctJ ? 1 : -1;
      
      if (candidateOrder === correctOrder) {
        concordantPairs++;
      } else {
        discordantPairs++;
      }
    }
  }
  
  const totalPairs = concordantPairs + discordantPairs;
  const tau = totalPairs > 0 ? (concordantPairs - discordantPairs) / totalPairs : 0;
  
  // Convert correlation to score (tau ranges from -1 to 1)
  const score = Math.round(((tau + 1) / 2) * question.max_score);
  
  return {
    score,
    correlation: tau,
    concordantPairs,
    discordantPairs,
    feedback: `Response alignment: ${Math.round((tau + 1) * 50)}%`
  };
}

// ============================================
// MAIN SCORING ORCHESTRATOR
// ============================================
async function scoreResponse(response, question, options = {}) {
  const { language = 'en' } = options;
  
  let result;
  
  switch (question.question_type) {
    case 'mcq':
    case 'mcq_multiple':
      result = scoreMCQ(response, question);
      break;
      
    case 'coding':
      result = await scoreCodeSubmission(
        response.response_code,
        question,
        response.response_code_language || question.programming_language
      );
      break;
      
    case 'sql':
      result = await scoreSQLSubmission(response.response_text, question);
      break;
      
    case 'excel':
      result = scoreSpreadsheetSubmission(response.response_spreadsheet, question);
      break;
      
    case 'open_ended':
      result = await scoreOpenEndedWithAI(response.response_text, question, language);
      break;
      
    case 'writing':
      result = await scoreWritingAssessment(response.response_text, question, language);
      break;
      
    case 'situational':
      result = scoreSituationalJudgment(response, question);
      break;
      
    case 'video_response':
      // Video responses typically need manual review or specialized AI
      result = {
        score: null,
        feedback: 'Video response requires manual evaluation',
        requiresManualReview: true
      };
      break;
      
    default:
      // Default to AI-based evaluation
      result = await scoreOpenEndedWithAI(
        response.response_text || '', 
        question, 
        language
      );
  }
  
  // Apply question weight
  if (question.weight && question.weight !== 1) {
    result.weightedScore = result.score * question.weight;
  }
  
  return result;
}

// ============================================
// BATCH SCORING
// ============================================
async function scoreAllResponses(applicationId, options = {}) {
  const { language = 'en' } = options;
  
  // Get all responses for this application
  const [responses] = await db.query(`
    SELECT cr.*, cq.* 
    FROM candidate_responses cr
    JOIN custom_questions cq ON cr.question_id = cq.id
    WHERE cr.application_id = ? OR cr.assessment_application_id = ?
    ORDER BY cq.question_order
  `, [applicationId, applicationId]);
  
  const results = [];
  let totalScore = 0;
  let totalWeight = 0;
  let totalMaxScore = 0;
  
  for (const response of responses) {
    const question = {
      id: response.question_id,
      question_type: response.question_type,
      question_text: response.question_text,
      correct_answers: response.correct_answers ? JSON.parse(response.correct_answers) : [],
      expected_response: response.expected_response,
      keywords: response.keywords ? JSON.parse(response.keywords) : [],
      rubric: response.rubric ? JSON.parse(response.rubric) : null,
      max_score: response.max_score || 100,
      weight: response.weight || 1,
      partial_credit: response.partial_credit,
      test_cases: response.test_cases ? JSON.parse(response.test_cases) : [],
      spreadsheet_solution: response.spreadsheet_solution ? JSON.parse(response.spreadsheet_solution) : null,
      programming_language: response.programming_language,
      min_word_count: response.min_word_count,
      max_word_count: response.max_word_count
    };
    
    const responseData = {
      response_text: response.response_text,
      response_mcq: response.response_mcq ? JSON.parse(response.response_mcq) : [],
      response_code: response.response_code,
      response_code_language: response.response_code_language,
      response_spreadsheet: response.response_spreadsheet ? JSON.parse(response.response_spreadsheet) : null
    };
    
    const scoreResult = await scoreResponse(responseData, question, { language });
    
    // Update the response with scores
    await db.query(`
      UPDATE candidate_responses 
      SET auto_score = ?, auto_feedback = ?, score_breakdown = ?
      WHERE id = ?
    `, [
      scoreResult.score,
      scoreResult.feedback,
      JSON.stringify(scoreResult.breakdown || {}),
      response.id
    ]);
    
    results.push({
      questionId: response.question_id,
      ...scoreResult
    });
    
    if (scoreResult.score !== null) {
      totalScore += (scoreResult.score * question.weight);
      totalWeight += question.weight;
      totalMaxScore += (question.max_score * question.weight);
    }
  }
  
  // Calculate overall score
  const overallScore = totalWeight > 0 ? 
    Math.round((totalScore / totalMaxScore) * 100) : 0;
  
  return {
    questionResults: results,
    overallScore,
    totalScore,
    totalMaxScore,
    totalWeight
  };
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
  // Individual scorers
  scoreMCQ,
  scoreKeywordMatch,
  scoreCodeSubmission,
  scoreSQLSubmission,
  scoreSpreadsheetSubmission,
  scoreCognitiveTest,
  scoreOpenEndedWithAI,
  scoreWritingAssessment,
  scoreSituationalJudgment,
  
  // Main functions
  scoreResponse,
  scoreAllResponses,
  
  // Helpers
  executeCode,
  validateSQLSyntax,
  countWords,
  normalizeFormula
};
