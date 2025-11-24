// scripts/reanalyzeExistingCVs.js

const db = require("../src/config/database");
const cvMatchingService = require("../services/cvMatchingService");

async function reanalyzeExistingApplications() {
  try {
    console.log('🔄 Starting batch re-analysis of existing applications...\n');

    // Get all applications without CV match scores that have CV documents
    const [applications] = await db.query(
      `SELECT 
        ja.id as application_id,
        ja.job_id,
        ja.full_name,
        ja.email,
        cd.parsed_text
      FROM job_applications ja
      LEFT JOIN applicant_profiles ap ON ja.user_id = ap.user_id
      LEFT JOIN cv_documents cd ON ap.id = cd.applicant_id AND cd.is_active = 1
      WHERE (ja.cv_match_score IS NULL OR ja.cv_match_score = 0)
        AND cd.parsed_text IS NOT NULL
        AND LENGTH(cd.parsed_text) > 50
      ORDER BY ja.applied_at DESC`
    );

    if (!applications || applications.length === 0) {
      console.log('✅ No applications found that need re-analysis.');
      return;
    }

    console.log(`📊 Found ${applications.length} applications to analyze\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      
      try {
        console.log(`\n[${i + 1}/${applications.length}] Analyzing: ${app.full_name} (App ID: ${app.application_id})`);
        
        // Run CV matching
        const result = await cvMatchingService.matchCVToJob(
          app.application_id,
          app.job_id,
          app.parsed_text
        );

        console.log(`✅ Match Score: ${result.overall_match_score}% (${result.match_level})`);
        successCount++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`❌ Failed for ${app.full_name}:`, err.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH RE-ANALYSIS COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total: ${applications.length}`);
    console.log('='.repeat(60));

  } catch (err) {
    console.error('❌ Error in batch re-analysis:', err);
  } finally {
    process.exit(0);
  }
}

// Run the script
reanalyzeExistingApplications();