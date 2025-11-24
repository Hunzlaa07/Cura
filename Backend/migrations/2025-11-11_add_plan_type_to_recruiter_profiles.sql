-- Add plan_type to recruiter_profiles to distinguish client types
-- plan_type: 'full' (jobs + case studies) | 'case_only' (case studies only)

ALTER TABLE recruiter_profiles
  ADD COLUMN plan_type ENUM('full', 'case_only') NOT NULL DEFAULT 'full' AFTER bio_ar;

-- Backfill existing rows to 'full' by default (redundant due to DEFAULT but explicit)
UPDATE recruiter_profiles SET plan_type = 'full' WHERE plan_type IS NULL;








