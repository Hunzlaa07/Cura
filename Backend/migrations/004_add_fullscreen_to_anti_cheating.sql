-- Migration: Add fullscreen_required column to anti_cheating_settings
-- Date: 2024-12-18

-- Add fullscreen_required column
ALTER TABLE anti_cheating_settings 
ADD COLUMN require_fullscreen BOOLEAN DEFAULT FALSE 
COMMENT 'Require fullscreen mode during assessment'
AFTER require_webcam;

-- Note: If column already exists, this will error (which is fine)
