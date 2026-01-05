-- Migration: Add custom_answers column to feedbacks table
-- This stores the applicant's answers to custom questions (MCQ, coding, SQL, etc.)

ALTER TABLE feedbacks
ADD COLUMN custom_answers JSON NULL COMMENT 'Stores answers to custom questions (MCQ, coding, SQL, etc.)' AFTER answers;

-- Add column for custom question scores after AI evaluation
ALTER TABLE feedbacks
ADD COLUMN custom_question_scores JSON NULL COMMENT 'AI-evaluated scores for custom questions' AFTER question_scores_ar;

-- Also add column for custom_question_scores_ar
ALTER TABLE feedbacks
ADD COLUMN custom_question_scores_ar JSON NULL COMMENT 'Arabic version of custom question scores' AFTER custom_question_scores;
