const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  try {
    // Hash password for demo users
    const hashedPassword = await hashPassword('password');
    
    console.log('📝 Inserting demo users...');
    await db.query(`
      INSERT INTO users (name, email, password, role, student_id) VALUES
      ('Admin User', 'admin@uiges.com', $1, 'admin', NULL),
      ('John Teacher', 'teacher@uiges.com', $1, 'teacher', NULL),
      ('Jane Instructor', 'jane@uiges.com', $1, 'teacher', NULL),
      ('Student One', 'candidate@uiges.com', $1, 'candidate', 'ST001'),
      ('Student Two', 'student2@uiges.com', $1, 'candidate', 'ST002'),
      ('Student Three', 'student3@uiges.com', $1, 'candidate', 'ST003')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    
    console.log('📝 Inserting demo exams...');
    await db.query(`
      INSERT INTO exams (teacher_id, title, subject, duration, questions_per_candidate, total_questions, pass_mark, start_date, end_date, show_results, randomize_questions, status) VALUES
      (2, 'Mathematics Midterm Exam', 'Mathematics', 90, 40, 50, 60.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true, true, 'active'),
      (2, 'Computer Science Quiz', 'Computer Science', 60, 30, 40, 70.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '15 days', true, true, 'active'),
      (3, 'Physics Final Examination', 'Physics', 120, 50, 60, 50.00, CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '35 days', false, true, 'scheduled')
    `);
    
    console.log('📝 Inserting demo questions...');
    // Read and execute seed.sql for questions
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    // Extract only the questions INSERT statements
    const questionsInsert = seedSQL.match(/INSERT INTO questions[\s\S]*?(?=;)/g);
    if (questionsInsert) {
      for (const insert of questionsInsert) {
        await db.query(insert);
      }
    }
    
    console.log('📝 Assigning candidates to exams...');
    await db.query(`
      INSERT INTO exam_candidates (exam_id, candidate_id) VALUES
      (1, 4), (1, 5), (1, 6),
      (2, 4), (2, 5)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Demo Credentials:');
    console.log('   Admin: admin@uiges.com / password');
    console.log('   Teacher: teacher@uiges.com / password');
    console.log('   Candidate: candidate@uiges.com / password\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();

