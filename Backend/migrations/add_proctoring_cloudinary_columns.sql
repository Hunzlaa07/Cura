-- Migration: Add Cloudinary support columns to proctoring_logs
-- Run this migration to add support for Cloudinary screenshot storage and retention

-- Add screenshot_public_id column for Cloudinary resource management
ALTER TABLE proctoring_logs 
ADD COLUMN IF NOT EXISTS screenshot_public_id VARCHAR(255) NULL AFTER screenshot_url;

-- Add archived_at column for soft-delete retention policy
ALTER TABLE proctoring_logs 
ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL AFTER client_timestamp;

-- Add index for retention queries
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_created_archived 
ON proctoring_logs (created_at, archived_at);

-- Add index for screenshot_public_id for cleanup queries
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_public_id 
ON proctoring_logs (screenshot_public_id);

-- Optional: Create retention_logs table for audit trail
CREATE TABLE IF NOT EXISTS retention_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  log_type VARCHAR(50) NOT NULL,
  records_processed INT DEFAULT 0,
  records_deleted INT DEFAULT 0,
  records_archived INT DEFAULT 0,
  errors INT DEFAULT 0,
  duration_seconds DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_retention_logs_type (log_type),
  INDEX idx_retention_logs_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample environment variables to add to .env:
-- PROCTORING_RETENTION_DAYS=30
-- PROCTORING_RETENTION_ACTION=delete
-- 
-- To run retention daily at 2 AM, add to crontab:
-- 0 2 * * * cd /path/to/Merit\ Backend && node scripts/proctoringRetention.js >> /var/log/proctoring-retention.log 2>&1
