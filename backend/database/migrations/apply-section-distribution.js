#!/usr/bin/env node

/**
 * Script to apply the section distribution migration
 * Run: node backend/database/migrations/apply-section-distribution.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../db');

async function applyMigration() {
  try {
    console.log('📦 Applying section distribution migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'add_section_distribution.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await db.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('');
    console.log('New columns added to exams table:');
    console.log('  - enable_section_distribution (boolean)');
    console.log('  - section_distribution (jsonb)');
    console.log('');
    console.log('You can now restart your backend server to use the new feature.');
    
    process.exit(0);
  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Migration already applied - columns exist.');
      process.exit(0);
    } else {
      console.error('❌ Migration failed:', error.message);
      console.error('');
      console.error('Please check:');
      console.error('  1. Database connection is working');
      console.error('  2. You have ALTER TABLE privileges');
      console.error('  3. The exams table exists');
      process.exit(1);
    }
  }
}

// Run the migration
applyMigration();

