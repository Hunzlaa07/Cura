-- Add id_token column to linkedin_tokens for OIDC
ALTER TABLE linkedin_tokens
  ADD COLUMN IF NOT EXISTS id_token LONGTEXT NULL;
