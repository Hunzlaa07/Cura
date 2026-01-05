/**
 * Assessment Module Generator Service
 * Generates AI-powered assessment content for various question types
 * MCQ, Open-Ended, Video Response, Coding, SQL, Excel, Writing, Situational Judgment
 */

const aiService = require('./aiService');

/**
 * Module type configurations
 */
const MODULE_CONFIGS = {
  mcq: {
    name: 'Multiple Choice Question',
    nameAr: 'سؤال اختيار متعدد',
    defaultTimeLimit: 2,
    requiresOptions: true
  },
  openEnded: {
    name: 'Open-Ended Question',
    nameAr: 'سؤال مفتوح',
    defaultTimeLimit: 10,
    requiresOptions: false
  },
  videoResponse: {
    name: 'Video Response',
    nameAr: 'استجابة فيديو',
    defaultTimeLimit: 5,
    requiresOptions: false
  },
  codingChallenge: {
    name: 'Coding Challenge',
    nameAr: 'تحدي برمجي',
    defaultTimeLimit: 30,
    requiresOptions: false,
    requiresTestCases: true
  },
  sqlProblem: {
    name: 'SQL Problem',
    nameAr: 'مشكلة SQL',
    defaultTimeLimit: 15,
    requiresOptions: false,
    requiresTestCases: true
  },
  excelTask: {
    name: 'Excel/Spreadsheet Task',
    nameAr: 'مهمة إكسل',
    defaultTimeLimit: 20,
    requiresOptions: false,
    requiresExpectedOutput: true
  },
  writingExercise: {
    name: 'Writing Exercise',
    nameAr: 'تمرين كتابة',
    defaultTimeLimit: 15,
    requiresOptions: false,
    requiresRubric: true
  },
  situationalJudgment: {
    name: 'Situational Judgment',
    nameAr: 'اختبار الحكم الموقفي',
    defaultTimeLimit: 5,
    requiresOptions: true,
    requiresScoring: true
  }
};

/**
 * Generate MCQ questions
 */
async function generateMCQQuestions(job, count, difficultyLevel, context = '', provider = 'openai', psychometricTypes = []) {
  const psychometricContext = psychometricTypes.length > 0 
    ? `\n\nPSYCHOMETRIC FOCUS (design questions to assess these traits):\n${psychometricTypes.map(p => `- ${p}`).join('\n')}\nEnsure questions reveal insights about the candidate's ${psychometricTypes.join(', ')} through their answer choices.`
    : '';

  const prompt = `You are an expert at creating professional assessment questions for job candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, reference those directly in question stems/options (mention table titles, metrics or specific numbers where applicable).

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}${psychometricContext}

TASK: Generate ${count} multiple choice questions to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Each question must have exactly 4 options (A, B, C, D)
- Only ONE correct answer per question
- Questions should be relevant to the job role
- Include mix of knowledge, scenario, and application questions
- Provide clear explanation for the correct answer

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "questions": [
    {
      "question_en": "English question text",
      "question_ar": "نص السؤال بالعربية",
      "options": [
        { "id": "A", "text_en": "Option A in English", "text_ar": "الخيار أ بالعربية", "is_correct": false },
        { "id": "B", "text_en": "Option B in English", "text_ar": "الخيار ب بالعربية", "is_correct": true },
        { "id": "C", "text_en": "Option C in English", "text_ar": "الخيار ج بالعربية", "is_correct": false },
        { "id": "D", "text_en": "Option D in English", "text_ar": "الخيار د بالعربية", "is_correct": false }
      ],
      "explanation_en": "Explanation why B is correct",
      "explanation_ar": "شرح لماذا ب هو الصحيح",
      "difficulty": "${difficultyLevel}",
      "category": "technical/behavioral/analytical"
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Open-Ended questions
 */
async function generateOpenEndedQuestions(job, count, difficultyLevel, context = '', provider = 'openai', psychometricTypes = []) {
  const psychometricContext = psychometricTypes.length > 0 
    ? `\n\nPSYCHOMETRIC FOCUS (design questions to reveal these traits):\n${psychometricTypes.map(p => `- ${p}`).join('\n')}\nDesign open-ended questions that allow assessment of ${psychometricTypes.join(', ')} based on the depth, structure, and reasoning in their responses.`
    : '';

  const prompt = `You are an expert at creating professional assessment questions for job candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, reference those directly in question stems and scoring criteria (mention table titles, metrics or specific numbers where applicable).

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}${psychometricContext}

TASK: Generate ${count} open-ended questions to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Questions should require detailed, thoughtful responses
- Include scenario-based and reflective questions
- Provide keywords/criteria for AI scoring
- Include sample strong responses

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "questions": [
    {
      "question_en": "English question text",
      "question_ar": "نص السؤال بالعربية",
      "expected_keywords": ["keyword1", "keyword2", "keyword3"],
      "scoring_criteria_en": "What to look for in a good answer",
      "scoring_criteria_ar": "ما يجب البحث عنه في الإجابة الجيدة",
      "sample_strong_response_en": "Example of a strong answer",
      "sample_strong_response_ar": "مثال على إجابة قوية",
      "min_word_count": 100,
      "max_word_count": 500,
      "difficulty": "${difficultyLevel}",
      "category": "behavioral/analytical/creative"
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Video Response prompts
 */
async function generateVideoResponseQuestions(job, count, difficultyLevel, context = '', provider = 'openai', psychometricTypes = []) {
  const psychometricContext = psychometricTypes.length > 0 
    ? `\n\nPSYCHOMETRIC FOCUS (design questions to reveal these traits through video responses):\n${psychometricTypes.map(p => `- ${p}`).join('\n')}\nCreate video prompts that allow evaluation of ${psychometricTypes.join(', ')} through verbal communication, body language, and response structure.`
    : '';

  const prompt = `You are an expert at creating professional video interview questions for job candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, reference those directly in prompts and evaluation criteria (mention table titles, metrics or specific numbers where applicable).

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}${psychometricContext}

TASK: Generate ${count} video response questions to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Questions should be suitable for 2-5 minute video responses
- Include behavioral (STAR method) and situational questions
- Provide evaluation criteria for reviewers

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "questions": [
    {
      "question_en": "English question text",
      "question_ar": "نص السؤال بالعربية",
      "preparation_time_seconds": 30,
      "max_response_time_seconds": 180,
      "evaluation_criteria_en": ["Criteria 1", "Criteria 2", "Criteria 3"],
      "evaluation_criteria_ar": ["المعيار 1", "المعيار 2", "المعيار 3"],
      "tips_for_candidate_en": "Brief tip for the candidate",
      "tips_for_candidate_ar": "نصيحة مختصرة للمرشح",
      "difficulty": "${difficultyLevel}",
      "category": "behavioral/communication/leadership"
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Coding Challenges
 */
async function generateCodingChallenges(job, count, difficultyLevel, context = '', provider = 'openai') {
  const prompt = `You are an expert at creating professional coding challenges for software developer candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, incorporate scenario data where appropriate (e.g., sample inputs derived from table values or data summaries) and reference specific metrics or named entities.

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}

TASK: Generate ${count} coding challenges to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Include clear problem statement
- Provide input/output examples
- Include test cases for validation
- Support multiple programming languages (Python, JavaScript, Java)

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "challenges": [
    {
      "title_en": "Challenge Title",
      "title_ar": "عنوان التحدي",
      "problem_statement_en": "Detailed problem description",
      "problem_statement_ar": "وصف المشكلة بالتفصيل",
      "input_format_en": "Description of input format",
      "input_format_ar": "وصف تنسيق الإدخال",
      "output_format_en": "Description of expected output",
      "output_format_ar": "وصف المخرجات المتوقعة",
      "constraints_en": ["Time constraint", "Memory constraint"],
      "constraints_ar": ["قيد الوقت", "قيد الذاكرة"],
      "examples": [
        {
          "input": "sample input",
          "output": "expected output",
          "explanation_en": "Why this output",
          "explanation_ar": "لماذا هذا الإخراج"
        }
      ],
      "test_cases": [
        { "input": "test1", "expected_output": "output1", "is_hidden": false },
        { "input": "test2", "expected_output": "output2", "is_hidden": true }
      ],
      "starter_code": {
        "python": "def solution(input):\\n    # Your code here\\n    pass",
        "javascript": "function solution(input) {\\n    // Your code here\\n}",
        "java": "public class Solution {\\n    public static String solution(String input) {\\n        // Your code here\\n        return \\"\\";\\n    }\\n}"
      },
      "difficulty": "${difficultyLevel}",
      "tags": ["arrays", "strings", "algorithms"]
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate SQL Problems
 */
async function generateSQLProblems(job, count, difficultyLevel, context = '', provider = 'openai') {
  const prompt = `You are an expert at creating professional SQL assessment problems for candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, derive schemas/sample data and query targets from the provided tables (reference table titles/columns explicitly).

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}

TASK: Generate ${count} SQL problems to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Include realistic database schema
- Cover SELECT, JOIN, GROUP BY, subqueries as appropriate
- Provide expected results for validation

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "problems": [
    {
      "title_en": "Problem Title",
      "title_ar": "عنوان المشكلة",
      "description_en": "Business problem description",
      "description_ar": "وصف مشكلة العمل",
      "schema": {
        "tables": [
          {
            "name": "employees",
            "columns": [
              { "name": "id", "type": "INT", "constraints": "PRIMARY KEY" },
              { "name": "name", "type": "VARCHAR(100)", "constraints": "NOT NULL" },
              { "name": "department_id", "type": "INT", "constraints": "FOREIGN KEY" },
              { "name": "salary", "type": "DECIMAL(10,2)", "constraints": "" }
            ]
          }
        ],
        "sample_data": "INSERT INTO employees VALUES (1, 'John', 1, 50000)..."
      },
      "task_en": "Write a SQL query to...",
      "task_ar": "اكتب استعلام SQL لـ...",
      "expected_output": [
        { "column1": "value1", "column2": "value2" }
      ],
      "solution_query": "SELECT ... FROM ... WHERE ...",
      "hints_en": ["Hint 1", "Hint 2"],
      "hints_ar": ["تلميح 1", "تلميح 2"],
      "difficulty": "${difficultyLevel}",
      "concepts": ["joins", "aggregation", "filtering"]
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Excel/Spreadsheet Tasks
 */
async function generateExcelTasks(job, count, difficultyLevel, context = '', provider = 'openai') {
  const prompt = `You are an expert at creating professional Excel/spreadsheet assessment tasks for candidates.

IMPORTANT: If ADDITIONAL CONTEXT includes a CASE STUDY DESCRIPTION and TABLE SUMMARIES, use the table samples as starter data and reference specific metrics or column names in the tasks.

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}

TASK: Generate ${count} Excel/spreadsheet tasks to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Include realistic business scenarios
- Cover formulas, pivot tables, data analysis as appropriate
- Provide starter data and expected outcomes

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "tasks": [
    {
      "title_en": "Task Title",
      "title_ar": "عنوان المهمة",
      "scenario_en": "Business scenario description",
      "scenario_ar": "وصف سيناريو العمل",
      "instructions_en": ["Step 1", "Step 2", "Step 3"],
      "instructions_ar": ["الخطوة 1", "الخطوة 2", "الخطوة 3"],
      "starter_data": {
        "sheet_name": "Sales Data",
        "columns": ["Date", "Product", "Region", "Revenue", "Units"],
        "sample_rows": [
          ["2024-01-01", "Widget A", "North", 5000, 100],
          ["2024-01-02", "Widget B", "South", 3500, 70]
        ]
      },
      "required_formulas": ["SUM", "VLOOKUP", "IF"],
      "expected_outputs": [
        { "cell": "G2", "formula": "=SUM(D2:D100)", "description_en": "Total revenue", "description_ar": "إجمالي الإيرادات" }
      ],
      "evaluation_criteria_en": ["Correct formulas", "Data accuracy", "Presentation"],
      "evaluation_criteria_ar": ["صحة الصيغ", "دقة البيانات", "العرض"],
      "difficulty": "${difficultyLevel}",
      "skills": ["formulas", "pivot_tables", "charts"]
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Writing Exercises
 */
async function generateWritingExercises(job, count, difficultyLevel, context = '', provider = 'openai') {
  const prompt = `You are an expert at creating professional writing assessment exercises for candidates.

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}

TASK: Generate ${count} writing exercises to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Include professional writing scenarios (emails, reports, proposals)
- Provide clear context and requirements
- Include evaluation rubric

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "exercises": [
    {
      "title_en": "Exercise Title",
      "title_ar": "عنوان التمرين",
      "type": "email/report/proposal/memo",
      "scenario_en": "Detailed scenario and context",
      "scenario_ar": "السيناريو والسياق بالتفصيل",
      "requirements_en": ["Must include X", "Should address Y", "Format as Z"],
      "requirements_ar": ["يجب أن يتضمن X", "يجب معالجة Y", "التنسيق كـ Z"],
      "audience_en": "Who will read this",
      "audience_ar": "من سيقرأ هذا",
      "word_count_min": 200,
      "word_count_max": 500,
      "rubric": {
        "clarity": { "weight": 25, "description_en": "Clear and coherent", "description_ar": "واضح ومتماسك" },
        "grammar": { "weight": 20, "description_en": "Proper grammar and spelling", "description_ar": "قواعد وإملاء صحيحة" },
        "structure": { "weight": 20, "description_en": "Well-organized", "description_ar": "منظم جيداً" },
        "relevance": { "weight": 20, "description_en": "Addresses the topic", "description_ar": "يعالج الموضوع" },
        "professionalism": { "weight": 15, "description_en": "Professional tone", "description_ar": "نبرة مهنية" }
      },
      "difficulty": "${difficultyLevel}"
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Generate Situational Judgment Tests
 */
async function generateSituationalJudgmentTests(job, count, difficultyLevel, context = '', provider = 'openai', psychometricTypes = []) {
  const psychometricContext = psychometricTypes.length > 0 
    ? `\n\nPSYCHOMETRIC FOCUS (design scenarios to assess these traits):\n${psychometricTypes.map(p => `- ${p}`).join('\n')}\nCreate situational scenarios where response choices directly reveal the candidate's ${psychometricTypes.join(', ')}. The effectiveness scores should correlate with psychometric indicators.`
    : '';

  const prompt = `You are an expert at creating professional situational judgment tests for job candidates.

JOB CONTEXT:
Job Title: ${job.title}
Description: ${job.description}
Key Responsibilities: ${job.key_responsibilities || ''}

ADDITIONAL CONTEXT:
${context}${psychometricContext}

TASK: Generate ${count} situational judgment scenarios to assess candidates for this role.

REQUIREMENTS:
- Difficulty Level: ${difficultyLevel.toUpperCase()}
- Create realistic workplace scenarios
- Include 4 response options with different effectiveness levels
- Avoid obviously wrong or right answers

Return ONLY valid JSON with NO markdown, NO explanations:
{
  "scenarios": [
    {
      "scenario_en": "Detailed workplace scenario description",
      "scenario_ar": "وصف سيناريو العمل بالتفصيل",
      "question_en": "What would you do in this situation?",
      "question_ar": "ماذا ستفعل في هذا الموقف؟",
      "options": [
        { "id": "A", "text_en": "Response option A", "text_ar": "خيار الاستجابة أ", "effectiveness_score": 4, "feedback_en": "Why this is most effective", "feedback_ar": "لماذا هذا الأكثر فعالية" },
        { "id": "B", "text_en": "Response option B", "text_ar": "خيار الاستجابة ب", "effectiveness_score": 3, "feedback_en": "Why this is somewhat effective", "feedback_ar": "لماذا هذا فعال إلى حد ما" },
        { "id": "C", "text_en": "Response option C", "text_ar": "خيار الاستجابة ج", "effectiveness_score": 2, "feedback_en": "Why this is less effective", "feedback_ar": "لماذا هذا أقل فعالية" },
        { "id": "D", "text_en": "Response option D", "text_ar": "خيار الاستجابة د", "effectiveness_score": 1, "feedback_en": "Why this is least effective", "feedback_ar": "لماذا هذا الأقل فعالية" }
      ],
      "competencies_assessed": ["leadership", "communication", "problem-solving"],
      "difficulty": "${difficultyLevel}"
    }
  ]
}`;

  const response = await aiService.generateContent(prompt, provider);
  return sanitizeAndParseJSON(response);
}

/**
 * Main function to generate all selected assessment modules
 * @param {Object} job - Job object with title, description, key_responsibilities
 * @param {Array} selectedModules - Array of module types to generate
 * @param {Object} moduleSettings - Settings with counts for each module
 * @param {string} difficultyLevel - easy, medium, or hard
 * @param {string} context - Additional context for generation
 * @param {string} provider - AI provider (openai, groq, gemini)
 * @param {Array} psychometricTypes - Array of psychometric types to evaluate (optional)
 */
async function generateAssessmentModules(job, selectedModules, moduleSettings, difficultyLevel, context = '', provider = 'openai', psychometricTypes = []) {
  console.log('\n🎯 ASSESSMENT MODULE GENERATION STARTED');
  console.log(`   Selected modules: ${selectedModules.join(', ')}`);
  console.log(`   Difficulty: ${difficultyLevel}`);
  console.log(`   Provider: ${provider}`);
  if (psychometricTypes.length > 0) {
    console.log(`   🧠 Psychometrics: ${psychometricTypes.join(', ')}`);
  }
  console.log('');

  const results = {
    mcq: null,
    openEnded: null,
    videoResponse: null,
    codingChallenge: null,
    sqlProblem: null,
    excelTask: null,
    writingExercise: null,
    situationalJudgment: null
  };

  const errors = [];

  for (const moduleType of selectedModules) {
    try {
      const count = moduleSettings[`${moduleType}Count`] || 1;
      console.log(`   🔄 Generating ${count} ${MODULE_CONFIGS[moduleType]?.name || moduleType}...`);

      let generated;
      switch (moduleType) {
        case 'mcq':
          generated = await generateMCQQuestions(job, count, difficultyLevel, context, provider, psychometricTypes);
          results.mcq = generated?.questions || [];
          break;
        case 'openEnded':
          generated = await generateOpenEndedQuestions(job, count, difficultyLevel, context, provider, psychometricTypes);
          results.openEnded = generated?.questions || [];
          break;
        case 'videoResponse':
          generated = await generateVideoResponseQuestions(job, count, difficultyLevel, context, provider, psychometricTypes);
          results.videoResponse = generated?.questions || [];
          break;
        case 'codingChallenge':
          generated = await generateCodingChallenges(job, count, difficultyLevel, context, provider);
          results.codingChallenge = generated?.challenges || [];
          break;
        case 'sqlProblem':
          generated = await generateSQLProblems(job, count, difficultyLevel, context, provider);
          results.sqlProblem = generated?.problems || [];
          break;
        case 'excelTask':
          generated = await generateExcelTasks(job, count, difficultyLevel, context, provider);
          results.excelTask = generated?.tasks || [];
          break;
        case 'writingExercise':
          generated = await generateWritingExercises(job, count, difficultyLevel, context, provider);
          results.writingExercise = generated?.exercises || [];
          break;
        case 'situationalJudgment':
          generated = await generateSituationalJudgmentTests(job, count, difficultyLevel, context, provider, psychometricTypes);
          results.situationalJudgment = generated?.scenarios || [];
          break;
        default:
          console.warn(`   ⚠️ Unknown module type: ${moduleType}`);
      }

      console.log(`   ✅ Generated ${results[moduleType]?.length || 0} ${moduleType} items`);
    } catch (err) {
      console.error(`   ❌ Failed to generate ${moduleType}:`, err.message);
      errors.push({ module: moduleType, error: err.message });
    }
  }

  console.log('\n🎯 ASSESSMENT MODULE GENERATION COMPLETED');
  console.log(`   Successful: ${selectedModules.length - errors.length}/${selectedModules.length}`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.map(e => e.module).join(', ')}`);
  }

  return { results, errors };
}

/**
 * Sanitize and parse JSON response from AI
 */
function sanitizeAndParseJSON(text) {
  if (!text) return null;

  let cleanText = text.trim();

  // Remove markdown code blocks
  cleanText = cleanText.replace(/```json\s*/gi, '');
  cleanText = cleanText.replace(/```\s*/gi, '');

  // Find JSON object or array
  const jsonMatch = cleanText.match(/[\[{][\s\S]*[\]}]/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('JSON parse error:', err.message);
    console.error('Raw text:', cleanText.substring(0, 500));
    return null;
  }
}

module.exports = {
  generateAssessmentModules,
  generateMCQQuestions,
  generateOpenEndedQuestions,
  generateVideoResponseQuestions,
  generateCodingChallenges,
  generateSQLProblems,
  generateExcelTasks,
  generateWritingExercises,
  generateSituationalJudgmentTests,
  MODULE_CONFIGS
};
