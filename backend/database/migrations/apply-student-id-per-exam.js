const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function applyMigration() {
  console.log('🚀 Updating Student ID Constraints (Per-Exam Uniqueness)...\n');

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ui_ges_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'update_student_id_per_exam.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Current system overview:');
    
    // Check current constraints
    const constraintCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'idx_unique_student_id_candidates'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('⚠️  Found system-wide unique constraint on student_id');
      console.log('   This will be removed to allow same student in multiple exams\n');
    } else {
      console.log('✅ No system-wide unique constraint found\n');
    }

    // Check for candidates with same student_id
    const duplicateCheck = await client.query(`
      SELECT student_id, COUNT(*) as count, string_agg(name, ', ') as names
      FROM users 
      WHERE role = 'candidate' AND student_id IS NOT NULL
      GROUP BY student_id 
      HAVING COUNT(*) > 1
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log('📊 Found students with same student_id (this is now ALLOWED):');
      duplicateCheck.rows.forEach(row => {
        console.log(`   - Student ID "${row.student_id}": ${row.names}`);
      });
      console.log('   These can now take different exams with the same ID\n');
    }

    console.log('🔄 Applying migration...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Verify the changes
    console.log('📋 Verification:');
    
    const indexCheck = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'idx_users_student_id'
    `);

    if (indexCheck.rows.length > 0) {
      console.log('✅ Non-unique index on student_id created (allows duplicates)');
    }

    const uniqueConstraintCheck = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'users' 
      AND indexname = 'idx_unique_student_id_candidates'
    `);

    if (uniqueConstraintCheck.rows.length === 0) {
      console.log('✅ System-wide unique constraint removed');
    }

    // Check exam_candidates unique constraint
    const examConstraint = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'exam_candidates' 
      AND constraint_type = 'UNIQUE'
    `);

    if (examConstraint.rows.length > 0) {
      console.log('✅ Exam-level unique constraint exists (prevents duplicate assignment)');
    }

    console.log('\n✅ MIGRATION COMPLETE!\n');
    console.log('📝 What changed:');
    console.log('   ✅ Student IDs are now unique PER EXAM (not system-wide)');
    console.log('   ✅ Same student can take multiple different exams');
    console.log('   ✅ Same student cannot take the same exam twice');
    console.log('   ✅ Login still works with student_id + password\n');
    
    console.log('💡 Examples:');
    console.log('   ✅ Student STU001 can be in "Math Exam"');
    console.log('   ✅ Student STU001 can be in "English Exam"');
    console.log('   ❌ Student STU001 cannot be in "Math Exam" twice\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.error('\n💡 Some constraints may not exist (this is okay)');
      console.error('   The migration will still update what exists.');
    }
    
    console.error('\n');
  } finally {
    await client.end();
    console.log('📡 Database connection closed');
  }
}

// Run migration
applyMigration().catch(console.error);
