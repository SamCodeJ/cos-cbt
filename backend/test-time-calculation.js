const db = require('./database/db');

async function testTimeCalculation() {
  try {
    console.log('🧪 Testing Time Extension Calculation\n');
    
    // Find an active exam attempt
    const attempt = await db.query(`
      SELECT 
        ea.id as attempt_id,
        ea.exam_id,
        ea.candidate_id,
        ea.started_at,
        ea.status,
        ea.time_extension_minutes,
        e.duration as base_duration,
        e.global_time_extension_minutes,
        e.title,
        u.name as candidate_name
      FROM exam_attempts ea
      JOIN exams e ON e.id = ea.exam_id
      JOIN users u ON u.id = ea.candidate_id
      WHERE ea.status = 'in_progress'
      LIMIT 1
    `);
    
    if (attempt.rows.length === 0) {
      console.log('⚠️  No active exam attempts found.');
      console.log('   Start an exam on mobile first, then run this test.\n');
      process.exit(0);
    }
    
    const exam = attempt.rows[0];
    console.log('📝 Found active exam:');
    console.log('   Title:', exam.title);
    console.log('   Student:', exam.candidate_name);
    console.log('   Started:', exam.started_at);
    console.log('');
    
    // Calculate time
    const baseDuration = parseInt(exam.base_duration) || 0;
    const globalExtension = parseInt(exam.global_time_extension_minutes) || 0;
    const individualExtension = parseInt(exam.time_extension_minutes) || 0;
    const totalDuration = baseDuration + globalExtension + individualExtension;
    
    const startTime = new Date(exam.started_at);
    const currentTime = new Date();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    const remainingMinutes = Math.max(0, totalDuration - elapsedMinutes);
    const remainingSeconds = Math.floor(remainingMinutes * 60);
    
    console.log('⏱️  Time Calculation:');
    console.log('   Base Duration:', baseDuration, 'minutes');
    console.log('   Global Extension:', globalExtension, 'minutes');
    console.log('   Individual Extension:', individualExtension, 'minutes');
    console.log('   ─────────────────────────────');
    console.log('   Total Duration:', totalDuration, 'minutes');
    console.log('');
    console.log('   Elapsed:', elapsedMinutes.toFixed(2), 'minutes');
    console.log('   Remaining:', remainingMinutes.toFixed(2), 'minutes');
    console.log('   ═════════════════════════════');
    console.log('   Remaining in seconds:', remainingSeconds, 's');
    console.log('   Remaining in MM:SS:', Math.floor(remainingSeconds / 60) + ':' + String(remainingSeconds % 60).padStart(2, '0'));
    console.log('');
    
    if (remainingSeconds <= 0) {
      console.log('❌ PROBLEM: Time remaining is 0 or negative!');
      console.log('   This would cause auto-submit.');
      console.log('');
      console.log('💡 Possible causes:');
      console.log('   1. Exam duration has actually expired');
      console.log('   2. Extensions not being added to total');
      console.log('   3. Data type conversion issues');
    } else {
      console.log('✅ Time calculation looks correct!');
      console.log('');
      console.log('🧪 Now test extending time:');
      console.log('   1. Go to web portal');
      console.log('   2. Extend time for this exam');
      console.log('   3. Run this script again to see updated values');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.pool.end();
  }
}

testTimeCalculation();

