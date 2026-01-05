/**
 * Proctoring Screenshot Retention Script
 * 
 * This script deletes old proctoring screenshots from Cloudinary and removes
 * or archives the corresponding database records based on retention policy.
 * 
 * Run via cron job: 0 2 * * * node scripts/proctoringRetention.js
 * (Runs daily at 2 AM)
 * 
 * Environment variables:
 * - PROCTORING_RETENTION_DAYS: Number of days to keep screenshots (default: 30)
 * - PROCTORING_RETENTION_ACTION: 'delete' or 'archive' (default: 'delete')
 */

require('dotenv').config();
const db = require('../src/config/database');
const cloudinary = require('../src/config/cloudinary');

const RETENTION_DAYS = parseInt(process.env.PROCTORING_RETENTION_DAYS || '30', 10);
const RETENTION_ACTION = process.env.PROCTORING_RETENTION_ACTION || 'delete';

async function runRetention() {
  console.log('🗑️ Starting proctoring retention cleanup...');
  console.log(`   Retention period: ${RETENTION_DAYS} days`);
  console.log(`   Action: ${RETENTION_ACTION}`);
  
  const startTime = Date.now();
  let deletedCount = 0;
  let archivedCount = 0;
  let cloudinaryDeletedCount = 0;
  let errorCount = 0;

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString().slice(0, 19).replace('T', ' ');

    console.log(`   Cutoff date: ${cutoffISO}`);

    // Fetch old proctoring logs with Cloudinary public IDs
    const [oldLogs] = await db.query(`
      SELECT id, screenshot_public_id, screenshot_url, event_type, created_at
      FROM proctoring_logs
      WHERE created_at < ?
        AND (archived_at IS NULL OR archived_at = '0000-00-00 00:00:00')
      LIMIT 1000
    `, [cutoffISO]);

    if (oldLogs.length === 0) {
      console.log('✅ No old proctoring logs to process.');
      return;
    }

    console.log(`   Found ${oldLogs.length} logs to process`);

    // Process each log
    for (const log of oldLogs) {
      try {
        // Delete from Cloudinary if public_id exists
        if (log.screenshot_public_id) {
          try {
            await cloudinary.uploader.destroy(log.screenshot_public_id);
            cloudinaryDeletedCount++;
            console.log(`   ☁️ Deleted from Cloudinary: ${log.screenshot_public_id}`);
          } catch (cloudErr) {
            console.warn(`   ⚠️ Cloudinary delete failed for ${log.screenshot_public_id}:`, cloudErr.message);
          }
        }

        // Delete or archive the database record
        if (RETENTION_ACTION === 'archive') {
          await db.query(`
            UPDATE proctoring_logs 
            SET archived_at = NOW(), screenshot_url = NULL, screenshot_public_id = NULL
            WHERE id = ?
          `, [log.id]);
          archivedCount++;
        } else {
          await db.query('DELETE FROM proctoring_logs WHERE id = ?', [log.id]);
          deletedCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error processing log ${log.id}:`, err.message);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n📊 Retention Summary:');
    console.log(`   - Database records deleted: ${deletedCount}`);
    console.log(`   - Database records archived: ${archivedCount}`);
    console.log(`   - Cloudinary images deleted: ${cloudinaryDeletedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Duration: ${duration}s`);
    console.log('✅ Retention cleanup complete.');

    // Log retention run to database for audit
    try {
      await db.query(`
        INSERT INTO retention_logs (log_type, records_processed, records_deleted, records_archived, errors, duration_seconds, created_at)
        VALUES ('proctoring', ?, ?, ?, ?, ?, NOW())
      `, [oldLogs.length, deletedCount, archivedCount, errorCount, parseFloat(duration)]);
    } catch (auditErr) {
      // Ignore if retention_logs table doesn't exist
      console.log('   (Audit log skipped - retention_logs table may not exist)');
    }

  } catch (err) {
    console.error('❌ Retention script failed:', err);
    process.exit(1);
  } finally {
    // Close database connection
    try {
      await db.end();
    } catch (e) {
      // Ignore close errors
    }
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  runRetention();
}

module.exports = { runRetention };
