-- Create case_study_assessments table
CREATE TABLE IF NOT EXISTS case_study_assessments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recruiter_id INT NOT NULL,
  user_id INT NOT NULL,
  case_study_id INT NULL,
  job_description_text TEXT NOT NULL,
  share_link VARCHAR(255) NOT NULL UNIQUE,
  status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE SET NULL,
  INDEX idx_share_link (share_link),
  INDEX idx_recruiter_id (recruiter_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create case_study_assessment_applications table for tracking applicants
CREATE TABLE IF NOT EXISTS case_study_assessment_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assessment_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NULL,
  otp_verified TINYINT(1) DEFAULT 0,
  otp_expires_at TIMESTAMP NULL,
  invitation_sent TINYINT(1) DEFAULT 0,
  invitation_sent_at TIMESTAMP NULL,
  status ENUM('pending', 'invited', 'completed', 'expired') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES case_study_assessments(id) ON DELETE CASCADE,
  INDEX idx_assessment_id (assessment_id),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Allow job_id to be NULL in case_studies table for assessments
ALTER TABLE case_studies MODIFY COLUMN job_id INT NULL;

-- Allow job_id to be NULL in case_study_invitations table for assessments
ALTER TABLE case_study_invitations MODIFY COLUMN job_id INT NULL;

-- Allow job_id to be NULL in job_applications table for assessments
ALTER TABLE job_applications MODIFY COLUMN job_id INT NULL;
