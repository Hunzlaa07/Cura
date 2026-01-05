const db = require('./src/config/database');

(async () => {
  console.log('\n=== ASSESSMENT SESSION 16 ANALYSIS ===');
  const [session16] = await db.query('SELECT id, applicant_id, case_study_id, integrity_score, warnings_issued FROM assessment_sessions WHERE id = 16');
  console.log('Session 16:', session16[0]);

  console.log('\n=== PROCTORING LOGS FOR SESSION 16 ===');
  const [logs16] = await db.query(
    'SELECT id, applicant_id, session_id, event_type, assessment_application_id, case_study_id, server_timestamp FROM proctoring_logs WHERE session_id = 16'
  );
  console.log(`Found ${logs16.length} logs for session_id=16`);
  logs16.forEach(l => {
    console.log(`  ID: ${l.id} | applicant: ${l.applicant_id} | event: ${l.event_type} | app_id: ${l.assessment_application_id} | cs_id: ${l.case_study_id}`);
  });

  console.log('\n=== PROCTORING LOGS BY CASE_STUDY_ID 424 ===');
  const [logs424] = await db.query(
    'SELECT id, applicant_id, session_id, event_type, assessment_application_id, case_study_id FROM proctoring_logs WHERE case_study_id = 424 ORDER BY server_timestamp DESC LIMIT 20'
  );
  console.log(`Found ${logs424.length} logs for case_study_id=424`);
  logs424.forEach(l => {
    console.log(`  ID: ${l.id} | applicant: ${l.applicant_id} | session: ${l.session_id} | event: ${l.event_type} | app_id: ${l.assessment_application_id}`);
  });

  process.exit();
})().catch(err => { console.error(err); process.exit(1); });
