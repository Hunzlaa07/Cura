-- Migration: Add anti_cheat_data column to feedbacks table
-- Date: 2024-12-18

-- Add anti_cheat_data column to store anti-cheating violation information
ALTER TABLE feedbacks 
ADD COLUMN anti_cheat_data JSON DEFAULT NULL
COMMENT 'JSON object containing anti-cheating violation data (tab_switches, fullscreen_maintained, webcam_active, violations_detected)'
AFTER custom_answers;

-- Note: If column already exists, this will error (which is fine)
