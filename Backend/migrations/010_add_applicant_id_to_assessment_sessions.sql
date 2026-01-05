-- Migration: Add applicant_id to assessment_sessions table
-- This enables proper tracking of integrity and proctoring data per applicant

-- Add applicant_id column to assessment_sessions
ALTER TABLE assessment_sessions
ADD COLUMN IF NOT EXISTS applicant_id INT DEFAULT NULL COMMENT 'FK to applicant_profiles' AFTER id;

-- Add index on applicant_id for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_applicant_id ON assessment_sessions (applicant_id);

-- Add composite index for better join performance
CREATE INDEX IF NOT EXISTS idx_sessions_applicant_case_study ON assessment_sessions (applicant_id, case_study_id);
