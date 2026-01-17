const db = require('./database/db');

async function checkAttempts() {
  try {
    const examId = process.argv[2];
    if (!examId) {
      console.log('Usage: node check-exam-attempts-by-candidate.js <exam_id>');
      process.exit(1);
    }

    console.log(`\n🔍 Checking all attempts for exam ${examId}\n`);
    
    const attempts = await db.query(`
      SELECT 
        ea.id as attempt_id,
        ea.candidate_id,
        u.name,
        u.email,
        ea.started_at,
        ea.submitted_at,
        ea.status,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ea.started_at))/60 as elapsed_minutes,
        e.duration,
        e.global_time_extension_minutes,
        ea.time_extension_minutes
      FROM exam_attempts ea
      JOIN users u ON u.id = ea.candidate_id
      JOIN exams e ON e.id = ea.exam_id
      WHERE ea.exam_id = $1
      ORDER BY ea.started_at DESC
    `, [examId]);
    
    if (attempts.rows.length === 0) {
      console.log('No attempts found for this exam.');
      process.exit(0);
    }
    
    console.log(`Found ${attempts.rows.length} attempt(s):\n`);
    
    attempts.rows.forEach((a, i) => {
      const total = a.duration + (a.global_time_extension_minutes || 0) + (a.time_extension_minutes || 0);
      const elapsed = parseFloat(a.elapsed_minutes);
      const remaining = Math.max(0, total - elapsed);
      
      console.log(`${i + 1}. Candidate ID: ${a.candidate_id} (${a.name})`);
      console.log(`   Email: ${a.email}`);
      console.log(`   Attempt ID: ${a.attempt_id}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Started: ${a.started_at}`);
      console.log(`   Submitted: ${a.submitted_at || 'Not submitted'}`);
      console.log(`   Elapsed: ${elapsed.toFixed(2)} minutes`);
      console.log(`   Total duration: ${total} min (${a.duration} base + ${a.global_time_extension_minutes || 0} global + ${a.time_extension_minutes || 0} individual)`);
      console.log(`   Remaining: ${remaining.toFixed(2)} minutes`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkAttempts();
