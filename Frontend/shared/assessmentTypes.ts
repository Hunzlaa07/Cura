/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// ============================================
// CUSTOM QUESTIONS TYPES
// ============================================

export type QuestionType = 
  | 'mcq' 
  | 'mcq_multiple' 
  | 'open_ended' 
  | 'video_response' 
  | 'file_upload'
  | 'coding' 
  | 'sql' 
  | 'excel' 
  | 'writing' 
  | 'situational' 
  | 'cognitive';

export interface MCQOption {
  id: string;
  text: string;
  text_ar?: string;
}

export interface TestCase {
  id: number;
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface ScoringRubric {
  excellent?: { score_range: string; criteria: string };
  good?: { score_range: string; criteria: string };
  satisfactory?: { score_range: string; criteria: string };
  needs_improvement?: { score_range: string; criteria: string };
  unsatisfactory?: { score_range: string; criteria: string };
}

export interface CustomQuestion {
  id: number;
  template_id?: number;
  case_study_id?: number;
  question_type: QuestionType;
  question_text: string;
  question_text_ar?: string;
  question_order: number;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  options?: MCQOption[];
  correct_answers?: string[];
  expected_response?: string;
  expected_response_ar?: string;
  keywords?: string[];
  rubric?: ScoringRubric;
  max_score: number;
  weight: number;
  partial_credit: boolean;
  time_limit?: number;
  min_word_count?: number;
  max_word_count?: number;
  min_video_duration?: number;
  max_video_duration?: number;
  programming_language?: string;
  test_cases?: TestCase[];
  starter_code?: string;
  spreadsheet_template?: Record<string, unknown>;
  spreadsheet_solution?: Record<string, unknown>;
  skill_tags?: string[];
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ASSESSMENT TEMPLATES TYPES
// ============================================

export type AssessmentCategory = 
  | 'job_simulation' 
  | 'coding' 
  | 'spreadsheet' 
  | 'writing' 
  | 'customer_service'
  | 'video_response' 
  | 'situational_judgment' 
  | 'cognitive' 
  | 'technical' 
  | 'behavioral';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface AssessmentTemplate {
  id: number;
  recruiter_id: number;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  category: AssessmentCategory;
  industry?: string;
  difficulty_level: DifficultyLevel;
  estimated_duration: number;
  is_public: boolean;
  is_active: boolean;
  question_count?: number;
  module_count?: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ASSESSMENT MODULES TYPES
// ============================================

export type ModuleType = 
  | 'job_simulation' 
  | 'coding_challenge' 
  | 'spreadsheet_task' 
  | 'writing_analysis'
  | 'customer_service' 
  | 'video_response' 
  | 'situational_judgment' 
  | 'cognitive_test'
  | 'technical_skill' 
  | 'behavioral' 
  | 'data_analysis' 
  | 'sql_challenge';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface AssessmentModule {
  id: number;
  template_id: number;
  module_type: ModuleType;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  instructions?: string;
  instructions_ar?: string;
  module_order: number;
  time_limit?: number;
  passing_score: number;
  weight: number;
  content_data?: Record<string, unknown>;
  resources?: Array<{ name: string; url: string; type: string }>;
  skill_domain?: string;
  skill_level: SkillLevel;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// ANTI-CHEATING SETTINGS TYPES
// ============================================

export type TabSwitchAction = 'warn' | 'flag' | 'auto_submit' | 'disqualify';

export interface AntiCheatingSettings {
  id?: number;
  template_id?: number;
  case_study_id?: number;
  assessment_id?: number;
  prevent_tab_switch: boolean;
  tab_switch_limit: number;
  tab_switch_action: TabSwitchAction;
  disable_copy_paste: boolean;
  disable_right_click: boolean;
  require_webcam: boolean;
  webcam_snapshots_interval: number;
  require_screen_share: boolean;
  record_screen: boolean;
  require_id_verification: boolean;
  require_face_match: boolean;
  strict_time_limit: boolean;
  no_pause_allowed: boolean;
  random_question_order: boolean;
  random_option_order: boolean;
  ai_content_detection: boolean;
  ai_detection_threshold: number;
  plagiarism_check: boolean;
  single_attempt: boolean;
  ip_restriction: boolean;
  allowed_ips: string[];
  lockdown_browser: boolean;
}

// ============================================
// CANDIDATE RESPONSE TYPES
// ============================================

export type ResponseType = 'text' | 'mcq' | 'file' | 'video' | 'code' | 'spreadsheet';

export interface SuspiciousActivity {
  type: string;
  time: string;
  details: string;
}

export interface CandidateResponse {
  id: number;
  application_id?: number;
  assessment_application_id?: number;
  question_id: number;
  module_id?: number;
  response_type: ResponseType;
  response_text?: string;
  response_mcq?: string[];
  response_file_url?: string;
  response_video_url?: string;
  response_code?: string;
  response_code_language?: string;
  response_spreadsheet?: Record<string, unknown>;
  code_execution_result?: {
    passed: number;
    failed: number;
    errors: string[];
    output: string;
  };
  auto_score?: number;
  manual_score?: number;
  final_score?: number;
  score_breakdown?: Record<string, number>;
  auto_feedback?: string;
  auto_feedback_ar?: string;
  manual_feedback?: string;
  ai_detected: boolean;
  ai_probability?: number;
  plagiarism_score?: number;
  started_at?: string;
  completed_at?: string;
  time_spent?: number;
  tab_switches: number;
  focus_lost_count: number;
  suspicious_activity?: SuspiciousActivity[];
  created_at: string;
  updated_at: string;
}

// ============================================
// SCORING RULES TYPES
// ============================================

export type RuleType = 
  | 'keyword_match' 
  | 'exact_match' 
  | 'regex_match' 
  | 'range_check'
  | 'code_output' 
  | 'test_case' 
  | 'formula_check' 
  | 'rubric' 
  | 'ai_evaluation';

export interface ScoringRule {
  id: number;
  template_id?: number;
  question_id?: number;
  module_id?: number;
  rule_name: string;
  rule_type: RuleType;
  rule_config: Record<string, unknown>;
  points_awarded: number;
  points_deducted: number;
  is_mandatory: boolean;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// COGNITIVE TEST TYPES
// ============================================

export type CognitiveTestType = 
  | 'numerical_reasoning' 
  | 'verbal_reasoning' 
  | 'abstract_reasoning'
  | 'logical_reasoning' 
  | 'spatial_reasoning' 
  | 'attention_to_detail'
  | 'memory' 
  | 'pattern_recognition' 
  | 'problem_solving';

export type ScoringMethod = 'correct_only' | 'correct_minus_incorrect' | 'irt';

export interface CognitiveTestTemplate {
  id: number;
  test_type: CognitiveTestType;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  instructions?: string;
  instructions_ar?: string;
  time_limit: number;
  question_count: number;
  difficulty: DifficultyLevel;
  scoring_method: ScoringMethod;
  norm_data?: Record<string, unknown>;
  is_adaptive: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// SESSION & PROCTORING TYPES
// ============================================

export type SessionStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'timed_out'
  | 'disqualified' 
  | 'abandoned';

export interface AssessmentSession {
  id: number;
  application_id?: number;
  assessment_application_id?: number;
  case_study_id?: number;
  template_id?: number;
  status: SessionStatus;
  current_question_id?: number;
  current_module_id?: number;
  started_at?: string;
  last_activity_at?: string;
  completed_at?: string;
  total_time_spent: number;
  time_remaining?: number;
  questions_answered: number;
  questions_total: number;
  modules_completed: number;
  modules_total: number;
  tab_switches_total: number;
  warnings_issued: number;
  flags_raised?: Array<{ type: string; time: string; severity: string }>;
  integrity_score: number;
  ip_address?: string;
  user_agent?: string;
  browser_fingerprint?: string;
  created_at: string;
  updated_at: string;
}

export type ProctoringEventType = 
  | 'session_start' 
  | 'session_end' 
  | 'tab_switch' 
  | 'focus_lost' 
  | 'focus_gained'
  | 'webcam_snapshot' 
  | 'screen_capture' 
  | 'suspicious_movement' 
  | 'copy_attempt'
  | 'paste_attempt' 
  | 'right_click' 
  | 'keyboard_shortcut' 
  | 'multiple_faces'
  | 'no_face_detected' 
  | 'browser_resize' 
  | 'fullscreen_exit';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface ProctoringLog {
  id: number;
  application_id?: number;
  assessment_application_id?: number;
  event_type: ProctoringEventType;
  event_data?: Record<string, unknown>;
  screenshot_url?: string;
  severity: Severity;
  client_timestamp?: string;
  server_timestamp: string;
}

// ============================================
// QUESTION BANK TYPES
// ============================================

export type QuestionCategory = 
  | 'cognitive' 
  | 'technical' 
  | 'behavioral' 
  | 'situational' 
  | 'coding' 
  | 'sql'
  | 'excel' 
  | 'writing' 
  | 'customer_service' 
  | 'sales' 
  | 'marketing' 
  | 'hr'
  | 'finance' 
  | 'management' 
  | 'data_analysis';

export interface QuestionBankItem extends CustomQuestion {
  category: QuestionCategory;
  subcategory?: string;
  difficulty: DifficultyLevel;
  estimated_time_minutes: number;
  usage_count: number;
  avg_score?: number;
  is_verified: boolean;
  is_public: boolean;
}

// ============================================
// ASSESSMENT RESULTS TYPES
// ============================================

export interface ModuleScore {
  moduleId: number;
  title: string;
  score: number;
  questionCount: number;
}

export interface QuestionTypeScore {
  type: QuestionType;
  score: number;
  questionCount: number;
}

export interface SkillScore {
  skill: string;
  score: number;
  questionCount: number;
}

export interface QuestionResult {
  questionId: number;
  questionType: QuestionType;
  questionText: string;
  score: number | null;
  maxScore: number;
  feedback?: string;
  timeSpent?: number;
}

export interface AssessmentResults {
  overall: {
    score: number;
    maxScore: number;
    percentage: number;
    rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  };
  moduleScores: ModuleScore[];
  questionTypeScores: QuestionTypeScore[];
  skillScores: SkillScore[];
  session?: {
    status: SessionStatus;
    timeSpent: number;
    integrityScore: number;
    warnings: number;
  };
  responses: QuestionResult[];
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateQuestionRequest {
  template_id?: number;
  case_study_id?: number;
  question_type: QuestionType;
  question_text: string;
  question_text_ar?: string;
  question_order?: number;
  options?: MCQOption[];
  correct_answers?: string[];
  expected_response?: string;
  keywords?: string[];
  rubric?: ScoringRubric;
  max_score?: number;
  weight?: number;
  time_limit?: number;
  programming_language?: string;
  test_cases?: TestCase[];
  starter_code?: string;
  spreadsheet_template?: Record<string, unknown>;
  skill_tags?: string[];
}

export interface SubmitResponseRequest {
  application_id?: number;
  assessment_application_id?: number;
  question_id: number;
  module_id?: number;
  response_type: ResponseType;
  response_text?: string;
  response_mcq?: string[];
  response_code?: string;
  response_code_language?: string;
  response_spreadsheet?: Record<string, unknown>;
  time_spent?: number;
}

export interface CodeSubmissionRequest {
  application_id?: number;
  assessment_application_id?: number;
  question_id: number;
  code: string;
  language: string;
}

export interface SQLSubmissionRequest {
  application_id?: number;
  assessment_application_id?: number;
  question_id: number;
  query: string;
}

export interface SpreadsheetSubmissionRequest {
  application_id?: number;
  assessment_application_id?: number;
  question_id: number;
  spreadsheet_data: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
