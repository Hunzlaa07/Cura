-- =============================================
-- Migration: Custom Questions and Assessment Modules
-- Date: 2024-12-18
-- Description: Adds support for custom questions (MCQ, open-ended, video),
--              assessment modules, scoring rules, and anti-cheating settings
-- =============================================

-- =============================================
-- 1. ASSESSMENT TEMPLATES (Reusable assessment configurations)
-- =============================================
CREATE TABLE IF NOT EXISTS assessment_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  category ENUM('job_simulation', 'coding', 'spreadsheet', 'writing', 'customer_service', 
                'video_response', 'situational_judgment', 'cognitive', 'technical', 'behavioral') NOT NULL,
  industry VARCHAR(100),
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  estimated_duration INT DEFAULT 30 COMMENT 'Duration in minutes',
  is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether template is shared publicly',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_recruiter (recruiter_id),
  INDEX idx_category (category),
  INDEX idx_public (is_public)
);

-- =============================================
-- 2. CUSTOM QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS custom_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT COMMENT 'FK to assessment_templates, NULL for case study questions',
  case_study_id INT COMMENT 'FK to case_studies, NULL for template questions',
  
  -- Question Content
  question_type ENUM('mcq', 'mcq_multiple', 'open_ended', 'video_response', 'file_upload',
                     'coding', 'sql', 'excel', 'writing', 'situational', 'cognitive') NOT NULL,
  question_text TEXT NOT NULL,
  question_text_ar TEXT,
  question_order INT DEFAULT 0,
  
  -- Question Media
  media_url VARCHAR(500) COMMENT 'Optional image/video/audio for the question',
  media_type ENUM('image', 'video', 'audio') NULL,
  
  -- MCQ Options (JSON array for MCQ questions)
  options JSON COMMENT '[{"id": "a", "text": "Option A", "text_ar": "الخيار أ"}, ...]',
  correct_answers JSON COMMENT '["a"] for single MCQ, ["a", "c"] for multiple select',
  
  -- Expected Response (for auto-scoring)
  expected_response TEXT COMMENT 'Expected answer for open-ended/coding/SQL questions',
  expected_response_ar TEXT,
  keywords JSON COMMENT '["keyword1", "keyword2"] for keyword-based scoring',
  rubric JSON COMMENT '{"excellent": "criteria...", "good": "criteria...", ...}',
  
  -- Scoring Configuration
  max_score INT DEFAULT 100,
  weight DECIMAL(5,2) DEFAULT 1.0 COMMENT 'Weight multiplier for this question',
  partial_credit BOOLEAN DEFAULT FALSE COMMENT 'Allow partial credit for MCQ',
  
  -- Time & Constraints
  time_limit INT COMMENT 'Time limit in seconds for this question, NULL for unlimited',
  min_word_count INT COMMENT 'Minimum words for open-ended questions',
  max_word_count INT COMMENT 'Maximum words for open-ended questions',
  min_video_duration INT COMMENT 'Minimum video duration in seconds',
  max_video_duration INT DEFAULT 180 COMMENT 'Maximum video duration in seconds',
  
  -- Code/Technical Settings
  programming_language VARCHAR(50) COMMENT 'For coding questions: python, javascript, etc.',
  test_cases JSON COMMENT '[{"input": "...", "expected_output": "...", "is_hidden": true}, ...]',
  starter_code TEXT COMMENT 'Initial code provided to candidate',
  
  -- Excel/Spreadsheet Settings
  spreadsheet_template JSON COMMENT 'Initial spreadsheet data structure',
  spreadsheet_solution JSON COMMENT 'Expected solution for spreadsheet tasks',
  
  -- Metadata
  skill_tags JSON COMMENT '["analytical", "communication", "excel"]',
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template (template_id),
  INDEX idx_case_study (case_study_id),
  INDEX idx_question_type (question_type),
  INDEX idx_order (question_order),
  FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE
);

-- =============================================
-- 3. ASSESSMENT MODULES (Predefined module types)
-- =============================================
CREATE TABLE IF NOT EXISTS assessment_modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  module_type ENUM('job_simulation', 'coding_challenge', 'spreadsheet_task', 'writing_analysis',
                   'customer_service', 'video_response', 'situational_judgment', 'cognitive_test',
                   'technical_skill', 'behavioral', 'data_analysis', 'sql_challenge') NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  instructions TEXT,
  instructions_ar TEXT,
  
  -- Module Configuration
  module_order INT DEFAULT 0,
  time_limit INT COMMENT 'Time limit in minutes for entire module',
  passing_score INT DEFAULT 60 COMMENT 'Minimum score to pass this module',
  weight DECIMAL(5,2) DEFAULT 1.0 COMMENT 'Weight of this module in overall score',
  
  -- Content Settings
  content_data JSON COMMENT 'Module-specific data (scenarios, datasets, etc.)',
  resources JSON COMMENT 'Files, links, or materials provided to candidate',
  
  -- Technical Skill Settings (for Salesforce, marketing, HR, finance tests)
  skill_domain VARCHAR(100) COMMENT 'salesforce, marketing, hr, finance, etc.',
  skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  
  is_required BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template (template_id),
  INDEX idx_module_type (module_type),
  INDEX idx_order (module_order),
  FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE
);

-- =============================================
-- 4. ANTI-CHEATING SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS anti_cheating_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT COMMENT 'FK to assessment_templates',
  case_study_id INT COMMENT 'FK to case_studies',
  assessment_id INT COMMENT 'FK to case_study_assessments',
  
  -- Browser/Tab Monitoring
  prevent_tab_switch BOOLEAN DEFAULT TRUE,
  tab_switch_limit INT DEFAULT 3 COMMENT 'Max tab switches before warning/disqualification',
  tab_switch_action ENUM('warn', 'flag', 'auto_submit', 'disqualify') DEFAULT 'flag',
  
  -- Copy/Paste Prevention
  disable_copy_paste BOOLEAN DEFAULT FALSE,
  disable_right_click BOOLEAN DEFAULT FALSE,
  
  -- Screen & Webcam Monitoring
  require_webcam BOOLEAN DEFAULT FALSE,
  webcam_snapshots_interval INT DEFAULT 60 COMMENT 'Take snapshot every N seconds',
  require_screen_share BOOLEAN DEFAULT FALSE,
  record_screen BOOLEAN DEFAULT FALSE,
  
  -- Identity Verification
  require_id_verification BOOLEAN DEFAULT FALSE,
  require_face_match BOOLEAN DEFAULT FALSE,
  
  -- Time Controls
  strict_time_limit BOOLEAN DEFAULT TRUE COMMENT 'Auto-submit when time expires',
  no_pause_allowed BOOLEAN DEFAULT TRUE COMMENT 'Cannot pause once started',
  random_question_order BOOLEAN DEFAULT TRUE,
  random_option_order BOOLEAN DEFAULT TRUE COMMENT 'Shuffle MCQ options',
  
  -- AI Detection
  ai_content_detection BOOLEAN DEFAULT TRUE,
  ai_detection_threshold INT DEFAULT 70 COMMENT 'Flag if AI probability > threshold',
  plagiarism_check BOOLEAN DEFAULT TRUE,
  
  -- Access Controls
  single_attempt BOOLEAN DEFAULT TRUE,
  ip_restriction BOOLEAN DEFAULT FALSE,
  allowed_ips JSON COMMENT '["192.168.1.0/24", ...]',
  lockdown_browser BOOLEAN DEFAULT FALSE COMMENT 'Require lockdown browser app',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template (template_id),
  INDEX idx_case_study (case_study_id),
  INDEX idx_assessment (assessment_id)
);

-- =============================================
-- 5. CANDIDATE RESPONSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS candidate_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT COMMENT 'FK to job_applications',
  assessment_application_id INT COMMENT 'FK to case_study_assessment_applications',
  question_id INT NOT NULL,
  module_id INT COMMENT 'FK to assessment_modules if part of a module',
  
  -- Response Content
  response_type ENUM('text', 'mcq', 'file', 'video', 'code', 'spreadsheet') NOT NULL,
  response_text TEXT,
  response_mcq JSON COMMENT '["a"] or ["a", "c"] for selected options',
  response_file_url VARCHAR(500),
  response_video_url VARCHAR(500),
  response_code TEXT,
  response_code_language VARCHAR(50),
  response_spreadsheet JSON,
  
  -- Code Execution Results
  code_execution_result JSON COMMENT '{"passed": 5, "failed": 1, "errors": [...], "output": "..."}',
  
  -- Scoring
  auto_score DECIMAL(5,2) COMMENT 'Score from automatic scoring',
  manual_score DECIMAL(5,2) COMMENT 'Score from manual review',
  final_score DECIMAL(5,2) COMMENT 'Final score (auto or manual override)',
  score_breakdown JSON COMMENT '{"accuracy": 80, "completeness": 90, "efficiency": 75}',
  
  -- Feedback
  auto_feedback TEXT,
  auto_feedback_ar TEXT,
  manual_feedback TEXT,
  
  -- AI Detection
  ai_detected BOOLEAN DEFAULT FALSE,
  ai_probability DECIMAL(5,2),
  plagiarism_score DECIMAL(5,2),
  
  -- Timing
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  time_spent INT COMMENT 'Time spent in seconds',
  
  -- Anti-cheating Flags
  tab_switches INT DEFAULT 0,
  focus_lost_count INT DEFAULT 0,
  suspicious_activity JSON COMMENT '[{"type": "tab_switch", "time": "...", "details": "..."}]',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_application (application_id),
  INDEX idx_assessment_app (assessment_application_id),
  INDEX idx_question (question_id),
  INDEX idx_module (module_id),
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES assessment_modules(id) ON DELETE SET NULL
);

-- =============================================
-- 6. SCORING RULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS scoring_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT COMMENT 'FK to assessment_templates',
  question_id INT COMMENT 'FK to custom_questions',
  module_id INT COMMENT 'FK to assessment_modules',
  
  rule_name VARCHAR(100) NOT NULL,
  rule_type ENUM('keyword_match', 'exact_match', 'regex_match', 'range_check', 
                 'code_output', 'test_case', 'formula_check', 'rubric', 'ai_evaluation') NOT NULL,
  
  -- Rule Configuration
  rule_config JSON NOT NULL COMMENT 'Rule-specific configuration',
  /* Examples:
     keyword_match: {"keywords": ["profit", "revenue"], "match_type": "any|all", "case_sensitive": false}
     exact_match: {"expected": "42", "tolerance": 0}
     regex_match: {"pattern": "\\d{3}-\\d{4}", "flags": "gi"}
     range_check: {"min": 0, "max": 100, "inclusive": true}
     code_output: {"test_cases": [...], "timeout_ms": 5000}
     formula_check: {"cell": "B5", "expected_formula": "=SUM(B2:B4)"}
     rubric: {"criteria": {...}, "levels": [...]}
     ai_evaluation: {"prompt": "Evaluate for...", "max_score": 100}
  */
  
  -- Scoring
  points_awarded DECIMAL(5,2) DEFAULT 0 COMMENT 'Points if rule matches',
  points_deducted DECIMAL(5,2) DEFAULT 0 COMMENT 'Points deducted if rule fails',
  is_mandatory BOOLEAN DEFAULT FALSE COMMENT 'Must pass this rule to get any points',
  
  priority INT DEFAULT 0 COMMENT 'Order of rule evaluation',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_template (template_id),
  INDEX idx_question (question_id),
  INDEX idx_module (module_id),
  INDEX idx_rule_type (rule_type)
);

-- =============================================
-- 7. CODING TEST SUBMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS coding_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT NOT NULL,
  question_id INT NOT NULL,
  
  -- Submission Details
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  
  -- Execution Results
  execution_status ENUM('pending', 'running', 'completed', 'error', 'timeout') DEFAULT 'pending',
  execution_output TEXT,
  execution_error TEXT,
  execution_time_ms INT,
  memory_used_kb INT,
  
  -- Test Case Results
  test_results JSON COMMENT '[{"id": 1, "passed": true, "input": "...", "expected": "...", "actual": "...", "time_ms": 50}]',
  tests_passed INT DEFAULT 0,
  tests_total INT DEFAULT 0,
  
  -- Code Quality Metrics
  cyclomatic_complexity INT,
  code_quality_score DECIMAL(5,2),
  lint_errors JSON,
  
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_response (response_id),
  INDEX idx_question (question_id),
  FOREIGN KEY (response_id) REFERENCES candidate_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- =============================================
-- 8. SQL TEST SUBMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS sql_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT NOT NULL,
  question_id INT NOT NULL,
  
  -- Submission Details
  query TEXT NOT NULL,
  database_schema JSON COMMENT 'Schema used for this question',
  
  -- Execution Results
  execution_status ENUM('pending', 'completed', 'error', 'timeout') DEFAULT 'pending',
  result_set JSON COMMENT 'Query results as JSON',
  expected_result_set JSON,
  row_count INT,
  execution_time_ms INT,
  
  -- Validation
  result_match BOOLEAN DEFAULT FALSE COMMENT 'Whether result matches expected',
  match_type ENUM('exact', 'unordered', 'partial') DEFAULT 'exact',
  syntax_valid BOOLEAN DEFAULT TRUE,
  
  -- Scoring
  correctness_score DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),
  
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_response (response_id),
  INDEX idx_question (question_id),
  FOREIGN KEY (response_id) REFERENCES candidate_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- =============================================
-- 9. SPREADSHEET TASK SUBMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS spreadsheet_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT NOT NULL,
  question_id INT NOT NULL,
  
  -- Submission Details
  spreadsheet_data JSON NOT NULL COMMENT 'Complete spreadsheet state',
  formulas_used JSON COMMENT '[{"cell": "B5", "formula": "=SUM(B2:B4)"}]',
  
  -- Validation Results
  cell_checks JSON COMMENT '[{"cell": "B5", "expected": 100, "actual": 100, "correct": true}]',
  formula_checks JSON COMMENT '[{"cell": "B5", "expected_formula": "=SUM(...)", "actual": "=SUM(...)", "correct": true}]',
  
  -- Scoring
  accuracy_score DECIMAL(5,2),
  formula_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_response (response_id),
  INDEX idx_question (question_id),
  FOREIGN KEY (response_id) REFERENCES candidate_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- =============================================
-- 10. VIDEO RESPONSE SUBMISSIONS
-- =============================================
CREATE TABLE IF NOT EXISTS video_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  response_id INT NOT NULL,
  question_id INT NOT NULL,
  
  -- Video Details
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INT,
  file_size_bytes BIGINT,
  
  -- Transcription
  transcript TEXT,
  transcript_language VARCHAR(10),
  
  -- AI Analysis
  sentiment_analysis JSON COMMENT '{"overall": "positive", "confidence": 0.85}',
  communication_score DECIMAL(5,2),
  confidence_score DECIMAL(5,2),
  clarity_score DECIMAL(5,2),
  
  -- Keywords & Topics
  keywords_detected JSON,
  topics_covered JSON,
  
  -- Metadata
  recording_started_at TIMESTAMP NULL,
  recording_ended_at TIMESTAMP NULL,
  retakes INT DEFAULT 0,
  
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_response (response_id),
  INDEX idx_question (question_id),
  FOREIGN KEY (response_id) REFERENCES candidate_responses(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- =============================================
-- 11. PROCTORING LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS proctoring_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT COMMENT 'FK to job_applications',
  assessment_application_id INT COMMENT 'FK to case_study_assessment_applications',
  
  event_type ENUM('session_start', 'session_end', 'tab_switch', 'focus_lost', 'focus_gained',
                  'webcam_snapshot', 'screen_capture', 'suspicious_movement', 'copy_attempt',
                  'paste_attempt', 'right_click', 'keyboard_shortcut', 'multiple_faces',
                  'no_face_detected', 'browser_resize', 'fullscreen_exit') NOT NULL,
  
  event_data JSON COMMENT 'Event-specific details',
  screenshot_url VARCHAR(500),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  
  client_timestamp TIMESTAMP NULL COMMENT 'Timestamp from client',
  server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_application (application_id),
  INDEX idx_assessment_app (assessment_application_id),
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity)
);

-- =============================================
-- 12. ASSESSMENT SESSION TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT COMMENT 'FK to job_applications',
  assessment_application_id INT COMMENT 'FK to case_study_assessment_applications',
  case_study_id INT,
  template_id INT,
  
  -- Session State
  status ENUM('not_started', 'in_progress', 'paused', 'completed', 'timed_out', 
              'disqualified', 'abandoned') DEFAULT 'not_started',
  current_question_id INT,
  current_module_id INT,
  
  -- Timing
  started_at TIMESTAMP NULL,
  last_activity_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  total_time_spent INT DEFAULT 0 COMMENT 'Total seconds spent',
  time_remaining INT COMMENT 'Seconds remaining',
  
  -- Progress
  questions_answered INT DEFAULT 0,
  questions_total INT DEFAULT 0,
  modules_completed INT DEFAULT 0,
  modules_total INT DEFAULT 0,
  
  -- Anti-cheating Summary
  tab_switches_total INT DEFAULT 0,
  warnings_issued INT DEFAULT 0,
  flags_raised JSON COMMENT '[{"type": "...", "time": "...", "severity": "..."}]',
  integrity_score DECIMAL(5,2) DEFAULT 100 COMMENT 'Decreases with violations',
  
  -- Client Info
  ip_address VARCHAR(45),
  user_agent TEXT,
  browser_fingerprint VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_application (application_id),
  INDEX idx_assessment_app (assessment_application_id),
  INDEX idx_status (status)
);

-- =============================================
-- 13. QUESTION BANK (Predefined questions library)
-- =============================================
CREATE TABLE IF NOT EXISTS question_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT COMMENT 'NULL for system-provided questions',
  
  -- Categorization
  category ENUM('cognitive', 'technical', 'behavioral', 'situational', 'coding', 'sql',
                'excel', 'writing', 'customer_service', 'sales', 'marketing', 'hr',
                'finance', 'management', 'data_analysis') NOT NULL,
  subcategory VARCHAR(100),
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  
  -- Question Content (same structure as custom_questions)
  question_type ENUM('mcq', 'mcq_multiple', 'open_ended', 'video_response', 'coding',
                     'sql', 'excel', 'situational') NOT NULL,
  question_text TEXT NOT NULL,
  question_text_ar TEXT,
  options JSON,
  correct_answers JSON,
  expected_response TEXT,
  keywords JSON,
  rubric JSON,
  
  -- Metadata
  skill_tags JSON,
  estimated_time_minutes INT DEFAULT 5,
  usage_count INT DEFAULT 0,
  avg_score DECIMAL(5,2),
  
  -- Technical Settings (for coding/SQL/Excel)
  programming_language VARCHAR(50),
  test_cases JSON,
  starter_code TEXT,
  spreadsheet_template JSON,
  
  is_verified BOOLEAN DEFAULT FALSE COMMENT 'Verified by admin',
  is_public BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_recruiter (recruiter_id),
  INDEX idx_category (category),
  INDEX idx_difficulty (difficulty),
  INDEX idx_question_type (question_type)
);

-- =============================================
-- 14. COGNITIVE TEST TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS cognitive_test_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_type ENUM('numerical_reasoning', 'verbal_reasoning', 'abstract_reasoning',
                 'logical_reasoning', 'spatial_reasoning', 'attention_to_detail',
                 'memory', 'pattern_recognition', 'problem_solving') NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  description TEXT,
  description_ar TEXT,
  instructions TEXT,
  instructions_ar TEXT,
  
  -- Test Configuration
  time_limit INT NOT NULL COMMENT 'Time limit in seconds',
  question_count INT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  
  -- Scoring
  scoring_method ENUM('correct_only', 'correct_minus_incorrect', 'irt') DEFAULT 'correct_only',
  norm_data JSON COMMENT 'Normative data for percentile calculations',
  
  is_adaptive BOOLEAN DEFAULT FALSE COMMENT 'Uses adaptive testing algorithm',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_test_type (test_type)
);

-- =============================================
-- 15. TEMPLATE-QUESTION JUNCTION (for reusable templates)
-- =============================================
CREATE TABLE IF NOT EXISTS template_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  bank_question_id INT COMMENT 'FK to question_bank for library questions',
  custom_question_id INT COMMENT 'FK to custom_questions for custom questions',
  question_order INT DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_template (template_id),
  INDEX idx_bank_question (bank_question_id),
  INDEX idx_custom_question (custom_question_id),
  FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  FOREIGN KEY (custom_question_id) REFERENCES custom_questions(id) ON DELETE CASCADE
);

-- =============================================
-- 16. UPDATE EXISTING TABLES
-- =============================================

-- Add template reference to case_study_assessments
ALTER TABLE case_study_assessments 
ADD COLUMN template_id INT NULL AFTER case_study_id,
ADD COLUMN custom_questions_enabled BOOLEAN DEFAULT FALSE,
ADD INDEX idx_template (template_id);

-- Add module/question references to feedbacks
ALTER TABLE feedbacks
ADD COLUMN module_scores JSON COMMENT '{"module_id": {"score": 85, "passed": true}}' AFTER question_scores_ar,
ADD COLUMN custom_question_scores JSON COMMENT '{"question_id": {"score": 90, "feedback": "..."}}' AFTER module_scores,
ADD COLUMN integrity_score DECIMAL(5,2) DEFAULT 100 AFTER ai_suspected,
ADD COLUMN proctoring_summary JSON COMMENT '{"tab_switches": 2, "warnings": 1}' AFTER integrity_score;

-- Add anti-cheating reference to case_studies
ALTER TABLE case_studies
ADD COLUMN anti_cheating_id INT NULL,
ADD COLUMN has_custom_questions BOOLEAN DEFAULT FALSE,
ADD COLUMN question_randomization BOOLEAN DEFAULT TRUE;
