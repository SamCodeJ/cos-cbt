const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function applyMigration() {
  console.log('🚀 Starting Student ID Migration...\n');

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
    const migrationPath = path.join(__dirname, 'add_unique_student_id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Checking current state...');
    
    // Check if migration already applied
    const constraintCheck = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND constraint_name = 'chk_candidate_student_id'
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('⚠️  Migration appears to already be applied!');
      console.log('   Found constraint: chk_candidate_student_id');
      
      const response = await askQuestion('\nDo you want to continue anyway? (y/N): ');
      if (response.toLowerCase() !== 'y' && response.toLowerCase() !== 'yes') {
        console.log('\n❌ Migration cancelled by user');
        await client.end();
        return;
      }
    }

    // Count candidates without student_id
    const candidatesCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM users 
      WHERE role = 'candidate' 
      AND (student_id IS NULL OR student_id = '')
    `);
    
    const candidatesNeedingIds = parseInt(candidatesCheck.rows[0].count);
    
    if (candidatesNeedingIds > 0) {
      console.log(`\n📊 Found ${candidatesNeedingIds} candidate(s) without Student IDs`);
      console.log('   These will be auto-assigned IDs like STU000001, STU000002, etc.\n');
    } else {
      console.log('\n✅ All candidates already have Student IDs\n');
    }

    // Check for duplicate student_ids
    const duplicateCheck = await client.query(`
      SELECT student_id, COUNT(*) as count, string_agg(name, ', ') as names
      FROM users 
      WHERE role = 'candidate' AND student_id IS NOT NULL
      GROUP BY student_id 
      HAVING COUNT(*) > 1
    `);

    if (duplicateCheck.rows.length > 0) {
      console.log('❌ ERROR: Found duplicate Student IDs!');
      console.log('   You must fix these before running the migration:\n');
      duplicateCheck.rows.forEach(row => {
        console.log(`   Student ID "${row.student_id}" is used by: ${row.names}`);
      });
      console.log('\n   Fix these duplicates manually, then run this script again.');
      await client.end();
      return;
    }

    console.log('🔄 Applying migration...\n');

    // Execute migration
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!\n');

    // Show results
    const results = await client.query(`
      SELECT id, name, email, student_id 
      FROM users 
      WHERE role = 'candidate'
      ORDER BY id
      LIMIT 10
    `);

    console.log('📋 Sample of Student IDs assigned:');
    console.log('─'.repeat(80));
    console.log('ID  | Student ID    | Name                  | Email');
    console.log('─'.repeat(80));
    results.rows.forEach(row => {
      const id = String(row.id).padEnd(3);
      const studentId = String(row.student_id).padEnd(13);
      const name = String(row.name).padEnd(21).substring(0, 21);
      const email = String(row.email).substring(0, 30);
      console.log(`${id} | ${studentId} | ${name} | ${email}`);
    });
    console.log('─'.repeat(80));

    const totalCount = await client.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'candidate'
    `);
    
    const total = parseInt(totalCount.rows[0].count);
    if (total > 10) {
      console.log(`\n(Showing 10 of ${total} candidates)`);
    }

    console.log('\n✅ MIGRATION COMPLETE!\n');
    console.log('📝 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Clear mobile app cache: npx expo start --clear');
    console.log('   3. Login with Student ID instead of email');
    console.log('   4. Share Student IDs with your candidates\n');
    console.log('💡 To view all Student IDs, run:');
    console.log('   SELECT student_id, name, email FROM users WHERE role = \'candidate\' ORDER BY student_id;\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('relation "users" does not exist')) {
      console.error('\n💡 The users table does not exist.');
      console.error('   Make sure you\'re connected to the correct database.');
      console.error('   Run the main schema.sql file first to create tables.');
    } else if (error.message.includes('duplicate key')) {
      console.error('\n💡 There are duplicate Student IDs in the database.');
      console.error('   Run this query to find them:');
      console.error('   SELECT student_id, COUNT(*), string_agg(name, \', \')');
      console.error('   FROM users WHERE role = \'candidate\' GROUP BY student_id HAVING COUNT(*) > 1;');
    } else if (error.message.includes('already exists')) {
      console.error('\n💡 The constraint or index already exists.');
      console.error('   The migration may have already been applied.');
    }
    
    console.error('\n');
  } finally {
    await client.end();
    console.log('📡 Database connection closed');
  }
}

// Helper function for user input (for Node.js < 17, use readline)
function askQuestion(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run migration
applyMigration().catch(console.error);
