const db = require('./database/db');

async function checkAttempts() {
  try {
    console.log('🔍 Checking all active exam attempts\n');
    
    const attempts = await db.query(`
      SELECT 
        ea.id,
        ea.exam_id,
        ea.candidate_id,
        ea.started_at,
        ea.time_extension_minutes,
        e.title,
        e.duration,
        e.global_time_extension_minutes,
        u.name,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ea.started_at))/60 as elapsed_minutes
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      JOIN users u ON u.id = ea.candidate_id
      WHERE ea.status = 'in_progress'
      ORDER BY ea.started_at DESC
    `);
    
    if (attempts.rows.length === 0) {
      console.log('No active exam attempts found.');
      return;
    }
    
    console.log('Found', attempts.rows.length, 'active attempt(s):\n');
    
    attempts.rows.forEach((a, i) => {
      const total = a.duration + (a.global_time_extension_minutes || 0) + (a.time_extension_minutes || 0);
      const elapsed = parseFloat(a.elapsed_minutes);
      const remaining = Math.max(0, total - elapsed);
      
      console.log(`${i + 1}. ${a.name} - "${a.title}"`);
      console.log(`   Attempt ID: ${a.id}`);
      console.log(`   Started: ${a.started_at}`);
      console.log(`   Duration: ${a.duration} min (base) + ${a.global_time_extension_minutes || 0} (global) + ${a.time_extension_minutes || 0} (individual) = ${total} min total`);
      console.log(`   Elapsed: ${elapsed.toFixed(1)} minutes`);
      console.log(`   Remaining: ${remaining.toFixed(1)} minutes (${Math.floor(remaining * 60)} seconds)`);
      
      if (remaining <= 0) {
        console.log(`   ⚠️  TIME EXPIRED! This exam should have auto-submitted.`);
      } else if (elapsed > total * 0.8) {
        console.log(`   ⚠️  Less than 20% time remaining`);
      } else {
        console.log(`   ✅ Time remaining is OK`);
      }
      console.log('');
    });
    
    console.log('💡 If an attempt shows TIME EXPIRED:');
    console.log('   Option 1: Extend more time from web portal');
    console.log('   Option 2: Manually reset the attempt (not recommended)');
    console.log('   Option 3: Let it auto-submit when timer reaches 0');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

checkAttempts();

