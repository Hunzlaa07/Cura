-- Store Google Drive authentication tokens
CREATE TABLE IF NOT EXISTS google_drive_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recruiter_id INT NOT NULL UNIQUE,
  access_token LONGTEXT NOT NULL,
  refresh_token LONGTEXT,
  token_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES recruiter_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_recruiter_id ON google_drive_tokens(recruiter_id);
