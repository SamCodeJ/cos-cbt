/**
 * Migration Script: Add Time Extension Support
 * This script adds the ability for teachers to extend exam time globally or for individual students
 */

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'gesDB',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    console.log('\n📋 Applying time extension migration...');
    
    // Read the migration SQL file
    const sqlPath = path.join(__dirname, 'add_time_extension.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the migration
    await client.query(sql);

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
    console.error('\n❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
applyMigration();

