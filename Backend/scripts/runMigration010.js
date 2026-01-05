// scripts/runMigration010.js - Run migration 010 to add applicant_id to assessment_sessions

require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

async function runMigration() {
  try {
    console.log('🚀 Running migration 010: Add applicant_id to assessment_sessions...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/010_add_applicant_id_to_assessment_sessions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon to handle multiple statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
      await db.query(statement);
    }
    
    console.log('✅ Migration 010 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
