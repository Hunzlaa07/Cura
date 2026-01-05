// client/lib/assessmentApiService.ts
// API service for custom questions, assessment modules, and candidate responses

import type {
  CustomQuestion,
  AssessmentTemplate,
  AssessmentModule,
  AntiCheatingSettings,
  CandidateResponse,
  ScoringRule,
  CognitiveTestTemplate,
  AssessmentSession,
  ProctoringLog,
  QuestionBankItem,
  AssessmentResults,
  CreateQuestionRequest,
  SubmitResponseRequest,
  CodeSubmissionRequest,
  SQLSubmissionRequest,
  SpreadsheetSubmissionRequest,
  ApiResponse,
  PaginatedResponse,
} from '../../shared/assessmentTypes';

const API_URL = import.meta.env.VITE_API_URL;

// Helper to get headers
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ============================================
// CUSTOM QUESTIONS API
// ============================================

export const createQuestion = async (
  question: CreateQuestionRequest
): Promise<ApiResponse<CustomQuestion>> => {
  const res = await fetch(`${API_URL}/api/custom-questions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(question),
  });
  return res.json();
};

export const createBulkQuestions = async (
  questions: CreateQuestionRequest[],
  templateId?: number,
  caseStudyId?: number
): Promise<ApiResponse<CustomQuestion[]>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/bulk`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ questions, template_id: templateId, case_study_id: caseStudyId }),
  });
  return res.json();
};

export const getQuestionsByTemplate = async (
  templateId: number
): Promise<ApiResponse<CustomQuestion[]>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/template/${templateId}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getQuestionsByCaseStudy = async (
  caseStudyId: number
): Promise<ApiResponse<CustomQuestion[]>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/case-study/${caseStudyId}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getQuestionById = async (
  id: number
): Promise<ApiResponse<CustomQuestion>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/${id}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const updateQuestion = async (
  id: number,
  updates: Partial<CustomQuestion>
): Promise<ApiResponse<CustomQuestion>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteQuestion = async (id: number): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const reorderQuestions = async (
  questionOrders: Array<{ id: number; order: number }>
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/reorder`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ questionOrders }),
  });
  return res.json();
};

export const duplicateQuestion = async (
  id: number
): Promise<ApiResponse<CustomQuestion>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/${id}/duplicate`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};

// ============================================
// SCORING RULES API
// ============================================

export const createScoringRule = async (
  rule: Partial<ScoringRule>
): Promise<ApiResponse<ScoringRule>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/scoring-rules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(rule),
  });
  return res.json();
};

export const getScoringRules = async (
  questionId: number
): Promise<ApiResponse<ScoringRule[]>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/scoring-rules/${questionId}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const updateScoringRule = async (
  id: number,
  updates: Partial<ScoringRule>
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/scoring-rules/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteScoringRule = async (id: number): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/scoring-rules/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

// ============================================
// QUESTION BANK API
// ============================================

export const getQuestionBank = async (params?: {
  category?: string;
  subcategory?: string;
  difficulty?: string;
  question_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<QuestionBankItem>> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, String(value));
    });
  }
  const res = await fetch(`${API_URL}/api/custom-questions/bank?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const addToQuestionBank = async (
  question: Partial<QuestionBankItem>
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/bank`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(question),
  });
  return res.json();
};

export const importFromQuestionBank = async (
  bankQuestionId: number,
  templateId?: number,
  caseStudyId?: number,
  questionOrder?: number
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/custom-questions/bank/import`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      bankQuestionId,
      template_id: templateId,
      case_study_id: caseStudyId,
      question_order: questionOrder,
    }),
  });
  return res.json();
};

// ============================================
// ASSESSMENT TEMPLATES API
// ============================================

export const createTemplate = async (
  template: Partial<AssessmentTemplate>
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/templates`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(template),
  });
  return res.json();
};

export const getTemplates = async (params?: {
  category?: string;
  includePublic?: boolean;
}): Promise<ApiResponse<AssessmentTemplate[]>> => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.includePublic) queryParams.append('includePublic', 'true');
  
  const res = await fetch(`${API_URL}/api/assessment-modules/templates?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getTemplateById = async (id: number): Promise<ApiResponse<{
  template: AssessmentTemplate;
  questions: CustomQuestion[];
  modules: AssessmentModule[];
  antiCheatingSettings: AntiCheatingSettings | null;
}>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/templates/${id}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const updateTemplate = async (
  id: number,
  updates: Partial<AssessmentTemplate>
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/templates/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteTemplate = async (id: number): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/templates/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const duplicateTemplate = async (
  id: number
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/templates/${id}/duplicate`, {
    method: "POST",
    headers: getHeaders(),
  });
  return res.json();
};

// ============================================
// ASSESSMENT MODULES API
// ============================================

export const createModule = async (
  module: Partial<AssessmentModule>
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/modules`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(module),
  });
  return res.json();
};

export const getModulesByTemplate = async (
  templateId: number
): Promise<ApiResponse<AssessmentModule[]>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/modules/template/${templateId}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const updateModule = async (
  id: number,
  updates: Partial<AssessmentModule>
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/modules/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  return res.json();
};

export const deleteModule = async (id: number): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/modules/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return res.json();
};

export const reorderModules = async (
  moduleOrders: Array<{ id: number; order: number }>
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/modules/reorder`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ moduleOrders }),
  });
  return res.json();
};

// ============================================
// ANTI-CHEATING SETTINGS API
// ============================================

export const saveAntiCheatingSettings = async (
  settings: Partial<AntiCheatingSettings>
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/anti-cheating`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  return res.json();
};

export const getAntiCheatingSettings = async (params: {
  template_id?: number;
  case_study_id?: number;
  assessment_id?: number;
}): Promise<ApiResponse<AntiCheatingSettings>> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, String(value));
  });
  const res = await fetch(`${API_URL}/api/assessment-modules/anti-cheating?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

// ============================================
// COGNITIVE TEST TEMPLATES API
// ============================================

export const getCognitiveTestTemplates = async (params?: {
  test_type?: string;
  difficulty?: string;
}): Promise<ApiResponse<CognitiveTestTemplate[]>> => {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
  }
  const res = await fetch(`${API_URL}/api/assessment-modules/cognitive-tests?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const createCognitiveTestTemplate = async (
  template: Partial<CognitiveTestTemplate>
): Promise<ApiResponse<{ id: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/cognitive-tests`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(template),
  });
  return res.json();
};

// ============================================
// CANDIDATE RESPONSES API
// ============================================

export const submitResponse = async (
  response: SubmitResponseRequest
): Promise<ApiResponse<{ responseId: number; autoScore?: number; feedback?: string }>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/submit`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(response),
  });
  return res.json();
};

export const submitBulkResponses = async (
  applicationId: number | undefined,
  assessmentApplicationId: number | undefined,
  responses: Array<Omit<SubmitResponseRequest, 'application_id' | 'assessment_application_id'>>
): Promise<ApiResponse<Array<{ question_id: number; success: boolean; response_id?: number; error?: string }>>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/submit/bulk`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      application_id: applicationId,
      assessment_application_id: assessmentApplicationId,
      responses,
    }),
  });
  return res.json();
};

export const submitCodingResponse = async (
  submission: CodeSubmissionRequest
): Promise<ApiResponse<{
  responseId: number;
  score: number;
  passedTests: number;
  totalTests: number;
  results: Array<{
    id: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    error?: string;
  }>;
  feedback: string;
}>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/submit/coding`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(submission),
  });
  return res.json();
};

export const submitSQLResponse = async (
  submission: SQLSubmissionRequest
): Promise<ApiResponse<{
  responseId: number;
  score: number;
  syntaxValid: boolean;
  feedback: string;
}>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/submit/sql`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(submission),
  });
  return res.json();
};

export const submitSpreadsheetResponse = async (
  submission: SpreadsheetSubmissionRequest
): Promise<ApiResponse<{
  responseId: number;
  score: number;
  accuracy: { cells: number; formulas: number };
  cellChecks: Array<{ cell: string; expected: unknown; actual: unknown; correct: boolean }>;
  formulaChecks: Array<{ cell: string; expectedFormula: string; actualFormula: string; correct: boolean }>;
  feedback: string;
}>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/submit/spreadsheet`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(submission),
  });
  return res.json();
};

export const submitVideoResponse = async (
  questionId: number,
  videoFile: File,
  applicationId?: number,
  assessmentApplicationId?: number
): Promise<ApiResponse<{ responseId: number; requiresManualReview: boolean }>> => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('question_id', String(questionId));
  if (applicationId) formData.append('application_id', String(applicationId));
  if (assessmentApplicationId) formData.append('assessment_application_id', String(assessmentApplicationId));

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/candidate-responses/submit/video`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  return res.json();
};

export const getResponsesByApplication = async (params: {
  applicationId?: number;
  assessmentApplicationId?: number;
}): Promise<ApiResponse<CandidateResponse[]>> => {
  const queryParams = new URLSearchParams();
  if (params.applicationId) queryParams.append('applicationId', String(params.applicationId));
  if (params.assessmentApplicationId) queryParams.append('assessmentApplicationId', String(params.assessmentApplicationId));
  
  const res = await fetch(`${API_URL}/api/candidate-responses?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const getResponseById = async (
  id: number
): Promise<ApiResponse<CandidateResponse>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/${id}`, {
    headers: getHeaders(),
  });
  return res.json();
};

export const scoreResponse = async (
  id: number,
  manualScore: number,
  manualFeedback?: string
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/${id}/score`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ manual_score: manualScore, manual_feedback: manualFeedback }),
  });
  return res.json();
};

export const triggerAIEvaluation = async (
  applicationId?: number,
  assessmentApplicationId?: number,
  language?: string
): Promise<ApiResponse<Array<{ questionId: number; score: number; feedback: string }>>> => {
  const res = await fetch(`${API_URL}/api/candidate-responses/evaluate/ai`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      applicationId,
      assessmentApplicationId,
      language: language || 'en',
    }),
  });
  return res.json();
};

export const getAssessmentResults = async (params: {
  applicationId?: number;
  assessmentApplicationId?: number;
}): Promise<ApiResponse<AssessmentResults>> => {
  const queryParams = new URLSearchParams();
  if (params.applicationId) queryParams.append('applicationId', String(params.applicationId));
  if (params.assessmentApplicationId) queryParams.append('assessmentApplicationId', String(params.assessmentApplicationId));
  
  const res = await fetch(`${API_URL}/api/candidate-responses/results/summary?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

// ============================================
// SESSION & PROCTORING API
// ============================================

export const startSession = async (params: {
  applicant_id?: number;
  application_id?: number;
  assessment_application_id?: number;
  case_study_id?: number;
  template_id?: number;
  questions_total: number;
  modules_total: number;
  time_remaining?: number;
}): Promise<ApiResponse<{ sessionId: number }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/sessions/start`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  return res.json();
};

export const updateSessionProgress = async (
  sessionId: number,
  progress: {
    current_question_id?: number;
    current_module_id?: number;
    questions_answered?: number;
    modules_completed?: number;
    time_remaining?: number;
    time_spent?: number;
  }
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/sessions/${sessionId}/progress`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(progress),
  });
  return res.json();
};

export const endSession = async (
  sessionId: number,
  status: 'completed' | 'timed_out' | 'abandoned' | 'disqualified'
): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/sessions/${sessionId}/end`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const logProctoringEvent = async (event: {
  applicant_id?: number;
  application_id?: number;
  assessment_application_id?: number;
  session_id?: number | null;
  event_type: string;
  event_data?: Record<string, unknown>;
  screenshot_url?: string;
  screenshot_base64?: string; // New: send base64 for server-side Cloudinary upload
  debug_screenshot_base64?: string | undefined; // Optional annotated debug screenshot for debugging
  face_detection?: {
    faceCount: number;
    faces: Array<{ boundingBox: { x: number; y: number; width: number; height: number }; confidence: number }>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    eventType: string;
    confidence: number;
    message: string;
    rawDetections?: any[];
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  client_timestamp?: string;
}): Promise<ApiResponse<{ id: number; severity: string; event_type: string; screenshot_url: string }>> => {
  const res = await fetch(`${API_URL}/api/assessment-modules/proctoring/log`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(event),
  });
  return res.json();
};

export const getProctoringLogs = async (params: {
  applicantId?: number;
  applicationId?: number;
  assessmentApplicationId?: number;
  caseStudyId?: number;
  sessionId?: number;
  severity?: string;
}): Promise<ApiResponse<ProctoringLog[]>> => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, String(value));
  });
  const res = await fetch(`${API_URL}/api/assessment-modules/proctoring/logs?${queryParams}`, {
    headers: getHeaders(),
  });
  return res.json();
};

// Export all assessment API functions
export const assessmentApi = {
  // Questions
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
  importFromQuestionBank,
  
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
  
  // Anti-Cheating
  saveAntiCheatingSettings,
  getAntiCheatingSettings,
  
  // Cognitive Tests
  getCognitiveTestTemplates,
  createCognitiveTestTemplate,
  
  // Responses
  submitResponse,
  submitBulkResponses,
  submitCodingResponse,
  submitSQLResponse,
  submitSpreadsheetResponse,
  submitVideoResponse,
  getResponsesByApplication,
  getResponseById,
  scoreResponse,
  triggerAIEvaluation,
  getAssessmentResults,
  
  // Sessions & Proctoring
  startSession,
  updateSessionProgress,
  endSession,
  logProctoringEvent,
  getProctoringLogs,
};

export default assessmentApi;
