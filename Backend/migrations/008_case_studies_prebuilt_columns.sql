-- Migration: Add columns to case_studies table for pre-built case studies integration
-- This allows pre-built case studies to be copied into the normal case study flow

-- Add column to track source pre-built assessment (if any)
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS pre_built_assessment_id INT DEFAULT NULL,
ADD CONSTRAINT fk_pre_built_assessment 
  FOREIGN KEY (pre_built_assessment_id) 
  REFERENCES pre_built_assessments(id) 
  ON DELETE SET NULL;

-- Add anti-cheating columns if they don't exist
ALTER TABLE case_studies 
ADD COLUMN IF NOT EXISTS enable_fullscreen BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enable_tab_switch BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enable_copy_paste BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_tab_switches INT DEFAULT 3;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_case_studies_pre_built ON case_studies(pre_built_assessment_id);
