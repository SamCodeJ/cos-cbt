const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📝 Creating tables...');
    await db.query(schema);
    console.log('✅ Tables created successfully!');
    
    console.log('✅ Database migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

