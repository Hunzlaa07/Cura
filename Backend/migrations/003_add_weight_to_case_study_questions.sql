-- Migration: Add weight column to case_study_questions for weighted scoring
-- Date: 2024-12-18

-- Add weight column to case_study_questions table
-- Note: Run this only once. If column exists, this will error (which is fine)
ALTER TABLE case_study_questions 
ADD COLUMN weight DECIMAL(5,2) DEFAULT 1.0 
COMMENT 'Weight multiplier for this question in overall scoring';

-- Alternative: Use this stored procedure for safe column addition
-- DELIMITER //
-- CREATE PROCEDURE AddWeightColumn()
-- BEGIN
--     IF NOT EXISTS (
--         SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
--         WHERE TABLE_NAME = 'case_study_questions' AND COLUMN_NAME = 'weight'
--     ) THEN
--         ALTER TABLE case_study_questions 
--         ADD COLUMN weight DECIMAL(5,2) DEFAULT 1.0 
--         COMMENT 'Weight multiplier for this question in overall scoring';
--     END IF;
-- END //
-- DELIMITER ;
-- CALL AddWeightColumn();
-- DROP PROCEDURE AddWeightColumn;
