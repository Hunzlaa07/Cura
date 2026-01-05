-- Store LinkedIn authentication tokens per user
CREATE TABLE IF NOT EXISTS linkedin_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  access_token LONGTEXT NOT NULL,
  refresh_token LONGTEXT,
  token_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_linkedin_user_id ON linkedin_tokens(user_id);
