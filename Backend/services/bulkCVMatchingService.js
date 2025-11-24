const db = require("../src/config/database");
const cvMatchingService = require('./cvMatchingService');
const fs = require('fs');
const path = require('path');

/**
 * Create a bulk matching job
 * @param {number} recruiterId - Recruiter ID
 * @param {string} jd - Job description text
 * @returns {Promise<object>} Bulk job details
 */
async function createBulkJob(recruiterId, jd) {
  try {
    const [result] = await db.query(
      `INSERT INTO bulk_cv_jobs 
       (recruiter_id, jd_text, status, total_files, processed_files, created_at)
       VALUES (?, ?, 'processing', 0, 0, NOW())`,
      [recruiterId, jd]
    );

    console.log(`📋 Created bulk job ${result.insertId} for recruiter ${recruiterId}`);
    return {
      bulk_job_id: result.insertId,
      status: 'processing'
    };

  } catch (err) {
    console.error('Error creating bulk job:', err);
    throw err;
  }
}

/**
 * Process bulk CVs in batches
 * @param {number} bulkJobId - Bulk job ID
 * @param {Array} cvFiles - Array of extracted CV texts with metadata
 * @param {string} jdText - Job description
 * @returns {Promise<Array>} Ranked results
 */
async function processBulkCVs(bulkJobId, cvFiles, jdText) {
  try {
    console.log(`🔄 Processing ${cvFiles.length} CVs for bulk job ${bulkJobId}`);

    // Parse JD to get job details
    const jobDetails = {
      title: extractJobTitle(jdText),
      description: jdText,
      key_responsibilities: extractResponsibilities(jdText),
      required_skills: extractSkills(jdText),
      experience_level: extractExperienceLevel(jdText),
      min_experience_years: extractMinExperience(jdText)
    };

    const results = [];
    const batchSize = 5; // Process 5 CVs at a time to avoid overload

    // Process in batches
    for (let i = 0; i < cvFiles.length; i += batchSize) {
      const batch = cvFiles.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (cvFile) => {
        try {
          console.log(`⏳ Analyzing: ${cvFile.name}`);

          // Use existing CV analyzer
          const analysis = await cvMatchingService.analyzeCVJobMatch(
            cvFile.text,
            jobDetails
          );

          return {
            file_name: cvFile.name,
            extracted_text: cvFile.text.substring(0, 500), // Store preview
            match_score: analysis.overall_match_score,
            match_level: analysis.match_level,
            skills_match: analysis.skills_match,
            experience_match: analysis.experience_match,
            education_match: analysis.education_match,
            strengths: analysis.strengths,
            gaps: analysis.gaps,
            summary: analysis.summary,
            recommendation: analysis.recommendation,
            full_analysis: analysis
          };
        } catch (err) {
          console.error(`Error analyzing ${cvFile.name}:`, err);
          return {
            file_name: cvFile.name,
            match_score: 0,
            match_level: 'Error',
            error: err.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Update progress
      await db.query(
        `UPDATE bulk_cv_jobs 
         SET processed_files = ? 
         WHERE id = ?`,
        [results.length, bulkJobId]
      );
    }

    // Sort by match score (descending)
    results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    // Save results
    await db.query(
      `UPDATE bulk_cv_jobs 
       SET status = 'completed', 
           results_json = ?,
           completed_at = NOW()
       WHERE id = ?`,
      [JSON.stringify(results), bulkJobId]
    );

    console.log(`✅ Bulk processing complete. Top match: ${results[0].file_name} (${results[0].match_score}%)`);
    return results;

  } catch (err) {
    console.error('Error in processBulkCVs:', err);
    await db.query(
      `UPDATE bulk_cv_jobs 
       SET status = 'error', error_message = ?
       WHERE id = ?`,
      [err.message, bulkJobId]
    );
    throw err;
  }
}

/**
 * Helper: Extract job title from JD
 */
function extractJobTitle(jdText) {
  const match = jdText.match(/(?:Position|Job Title|Role)[\s:]*([^\n]+)/i);
  return match ? match[1].trim() : 'Job Position';
}

/**
 * Helper: Extract key responsibilities
 */
function extractResponsibilities(jdText) {
  const match = jdText.match(/(?:Responsibilities|Key Responsibilities)[\s:]*([^]*?)(?=\n\n|Required Skills|$)/i);
  return match ? match[1].trim() : jdText.substring(0, 200);
}

/**
 * Helper: Extract skills from JD
 */
function extractSkills(jdText) {
  const skillMatch = jdText.match(/(?:Required Skills|Skills|Technical Skills)[\s:]*([^]*?)(?=\n\n|$)/i);
  if (!skillMatch) return [];
  
  const skillText = skillMatch[1];
  const skills = skillText
    .split(/[\n,•-]/)
    .map(s => s.trim())
    .filter(s => s && s.length > 0)
    .slice(0, 10); // Limit to 10 skills

  return skills.map((skill, idx) => ({
    name: skill,
    category: 'Technical',
    is_required: idx < 5 // First 5 are required
  }));
}

/**
 * Helper: Extract experience level
 */
function extractExperienceLevel(jdText) {
  if (jdText.match(/senior|lead|principal/i)) return 'Senior';
  if (jdText.match(/junior|entry|graduate/i)) return 'Junior';
  return 'Mid-level';
}

/**
 * Helper: Extract min experience
 */
function extractMinExperience(jdText) {
  const match = jdText.match(/(\d+)\s*(?:\+)?(?:\s*(?:years?|yrs?)\s+of\s+)?experience/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Get bulk job results
 */
async function getBulkJobResults(bulkJobId, recruiterId) {
  try {
    const [rows] = await db.query(
      `SELECT * FROM bulk_cv_jobs 
       WHERE id = ? AND recruiter_id = ?`,
      [bulkJobId, recruiterId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('Bulk job not found');
    }

    const job = rows[0];
    const results = job.results_json ? JSON.parse(job.results_json) : [];

    return {
      bulk_job_id: job.id,
      status: job.status,
      total_files: job.total_files,
      processed_files: job.processed_files,
      created_at: job.created_at,
      completed_at: job.completed_at,
      results: results
    };

  } catch (err) {
    console.error('Error fetching bulk results:', err);
    throw err;
  }
}

module.exports = {
  createBulkJob,
  processBulkCVs,
  getBulkJobResults
};