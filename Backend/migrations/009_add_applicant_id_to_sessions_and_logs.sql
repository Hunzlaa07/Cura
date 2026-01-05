-- Migration: Ensure application_id column exists for tracking job_applications in proctoring
-- This enables proper tracking of proctoring data per job application (applicant)

-- Check and add session_id column to proctoring_logs if not exists
-- (This column should already exist but adding for safety)
ALTER TABLE proctoring_logs 
ADD COLUMN IF NOT EXISTS session_id INT DEFAULT NULL COMMENT 'FK to assessment_sessions';

-- Add index for application_id on proctoring_logs for better query performance
CREATE INDEX IF NOT EXISTS idx_logs_application ON proctoring_logs (application_id);

-- Add index for application_id on assessment_sessions for better query performance  
CREATE INDEX IF NOT EXISTS idx_sessions_application ON assessment_sessions (application_id);

-- The application_id column already exists in both tables per original schema
-- These indexes will improve query performance when filtering by application_id
