/**
 * SIMPLE Migration Script: Add Time Extension Support
 * Uses the existing database connection from db.js
 */

const db = require('../db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  try {
    console.log('🔌 Using existing database connection...');
    console.log('✅ Connected successfully');

    console.log('\n📋 Applying time extension migration...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, 'add_time_extension.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    await db.query(sql);

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 Changes made:');
    console.log('  - Added time_extension_minutes column to exam_attempts table');
    console.log('  - Added global_time_extension_minutes column to exams table');
    console.log('\n✨ Time extension feature is now available!');
    console.log('  Teachers can now:');
    console.log('  - Extend time for all students taking an exam');
    console.log('  - Extend time for individual students');
    console.log('  Students will see time extensions automatically in their exam timer');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Migration already applied!');
      console.log('✅ The time extension feature is already set up and ready to use.');
    } else {
      console.error('\n❌ Migration failed:', error.message);
      console.error('Error details:', error);
      process.exit(1);
    }
  } finally {
    // Close the pool
    await db.pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
applyMigration();

