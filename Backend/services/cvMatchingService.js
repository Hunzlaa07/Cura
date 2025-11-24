// services/cvMatchingService.js
const db = require("../src/config/database");
const aiService = require('./aiService'); // ✅ Use AI Service instead of direct Gemini

/**
 * Analyze CV text against job requirements using AI Service
 * @param {string} cvText - Extracted text from CV
 * @param {object} jobDetails - Job details including title, description, skills
 * @returns {Promise<object>} Match analysis with score and breakdown
 */
async function analyzeCVJobMatch(cvText, jobDetails) {
  try {
    console.log('🔍 Starting CV-Job matching analysis...');

    if (!cvText || cvText.trim().length < 50) {
      console.warn('⚠️ CV text too short or empty');
      return {
        overall_match_score: 0,
        match_level: 'Poor',
        skills_match: [],
        experience_match: 0,
        education_match: 0,
        summary: 'CV text is too short or unavailable for analysis',
        recommendation: 'Review Manually'
      };
    }

    const prompt = `
You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well this candidate's CV matches the job requirements.

🎯 JOB DETAILS:
Title: ${jobDetails.title}
Description: ${jobDetails.description}
Key Responsibilities: ${jobDetails.key_responsibilities || 'Not specified'}
Department: ${jobDetails.department || 'Not specified'}
Experience Level: ${jobDetails.experience_level || 'Not specified'}
Min Experience: ${jobDetails.min_experience_years || 'Not specified'} years
Max Experience: ${jobDetails.max_experience_years || 'Not specified'} years

🛠️ REQUIRED SKILLS:
${jobDetails.required_skills && jobDetails.required_skills.length > 0 
  ? jobDetails.required_skills.map(skill => 
      `- ${skill.name} (${skill.category}) ${skill.is_required ? '- REQUIRED' : '- Preferred'}`
    ).join('\n')
  : 'No specific skills listed'}

📄 CANDIDATE CV:
${cvText}

Analyze the match and return ONLY this JSON structure (no markdown, no extra text):
{
  "overall_match_score": <0-100>,
  "match_level": "<Poor|Fair|Good|Excellent>",
  "skills_match": [
    {
      "skill_name": "<skill name>",
      "found_in_cv": <true|false>,
      "evidence": "<brief quote or evidence from CV>",
      "is_required": <true|false>
    }
  ],
  "experience_match": <0-100>,
  "experience_evidence": "<evidence of relevant experience>",
  "education_match": <0-100>,
  "education_evidence": "<education background>",
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "gaps": [
    "<gap 1>",
    "<gap 2>"
  ],
  "summary": "<2-3 sentence summary of the match>",
  "recommendation": "<Strong Hire|Interview|Review Manually|Reject>"
}

SCORING RULES:
- 80-100: Excellent match (most/all required skills + relevant experience)
- 60-79: Good match (some required skills + relevant experience)
- 40-59: Fair match (few skills or limited experience)
- 0-39: Poor match (major gaps in requirements)

Be objective and evidence-based. Return ONLY valid JSON.
    `.trim();

    // ✅ Use AI Service instead of direct Gemini call
    const response = await aiService.generateContent(prompt);
    const analysis = JSON.parse(response);
    
    console.log(`✅ CV Match Analysis Complete: ${analysis.overall_match_score}% - ${analysis.match_level}`);
    
    return analysis;

  } catch (err) {
    console.error('❌ Error analyzing CV-Job match:', err);
    return {
      overall_match_score: 0,
      match_level: 'Unknown',
      skills_match: [],
      experience_match: 0,
      education_match: 0,
      summary: 'Error analyzing CV match: ' + err.message,
      recommendation: 'Review Manually'
    };
  }
}

/**
 * Get job details with required skills for matching
 * @param {number} jobId - Job ID
 * @returns {Promise<object>} Job details
 */
async function getJobDetailsForMatching(jobId) {
  try {
    const [jobRows] = await db.query(
      `SELECT 
        id, title, description, key_responsibilities, 
        department, experience_level, 
        min_experience_years, max_experience_years
      FROM jobs 
      WHERE id = ?`,
      [jobId]
    );

    if (!jobRows || jobRows.length === 0) {
      throw new Error('Job not found');
    }

    const job = jobRows[0];

    // Get required skills
    const [skills] = await db.query(
      `SELECT s.id, s.name, s.category, js.is_required, js.minimum_proficiency
       FROM job_skills js
       JOIN skills s ON s.id = js.skill_id
       WHERE js.job_id = ?`,
      [jobId]
    );

    job.required_skills = skills;

    return job;

  } catch (err) {
    console.error('Error fetching job details:', err);
    throw err;
  }
}

/**
 * Main function: Match CV against job and store results
 * @param {number} applicationId - Job application ID
 * @param {number} jobId - Job ID
 * @param {string} cvText - Extracted CV text
 * @returns {Promise<object>} Match results
 */
async function matchCVToJob(applicationId, jobId, cvText) {
  try {
    console.log(`🚀 Starting CV match for application ${applicationId}, job ${jobId}`);

    // Get job details
    const jobDetails = await getJobDetailsForMatching(jobId);

    // Analyze CV-Job match using AI Service
    const matchAnalysis = await analyzeCVJobMatch(cvText, jobDetails);

    // Store match results in job_applications
    await db.query(
      `UPDATE job_applications 
       SET cv_match_score = ?,
           cv_match_level = ?,
           cv_match_details = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        matchAnalysis.overall_match_score,
        matchAnalysis.match_level,
        JSON.stringify(matchAnalysis),
        applicationId
      ]
    );

    console.log(`✅ CV match stored: ${matchAnalysis.overall_match_score}% (${matchAnalysis.match_level})`);

    return matchAnalysis;

  } catch (err) {
    console.error('❌ Error in matchCVToJob:', err);
    throw err;
  }
}

module.exports = {
  matchCVToJob,
  analyzeCVJobMatch,
  getJobDetailsForMatching
};