const db = require('./database/db');

async function verify() {
  try {
    console.log('🔍 Checking if migration columns exist...\n');
    
    // Check global_time_extension_minutes in exams table
    const exam_col = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'exams' 
      AND column_name = 'global_time_extension_minutes'
    `);
    
    console.log('✅ exams.global_time_extension_minutes:', exam_col.rows.length > 0 ? 'EXISTS' : '❌ MISSING');
    if (exam_col.rows.length > 0) {
      console.log('   Type:', exam_col.rows[0].data_type);
      console.log('   Default:', exam_col.rows[0].column_default);
    }
    
    // Check time_extension_minutes in exam_attempts table
    const attempt_col = await db.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'exam_attempts' 
      AND column_name = 'time_extension_minutes'
    `);
    
    console.log('\n✅ exam_attempts.time_extension_minutes:', attempt_col.rows.length > 0 ? 'EXISTS' : '❌ MISSING');
    if (attempt_col.rows.length > 0) {
      console.log('   Type:', attempt_col.rows[0].data_type);
      console.log('   Default:', attempt_col.rows[0].column_default);
    }
    
    if (exam_col.rows.length > 0 && attempt_col.rows.length > 0) {
      console.log('\n🎉 Migration successful! All columns exist.');
      console.log('\n📝 Next step: RESTART your backend server to use the new columns.');
    } else {
      console.log('\n⚠️  Migration incomplete. Please run the migration script.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.pool.end();
  }
}

verify();

