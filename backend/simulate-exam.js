const http = require('http');
const https = require('https');

const { Pool } = require('pg');

// ================= CONFIGURATION =================
const BASE_URL = 'http://127.0.0.1:5000/api'; // Changed to port 5000 based on netstat output
const EXAM_ID = 31; // The ID of the exam to test
const TOTAL_STUDENTS = 1500; // How many students to simulate
const RAMP_UP_TIME_MS = 120000; // Spread logins over 120 seconds (2 minutes) to simulate a realistic start
const AUTOSAVE_INTERVAL_MS = 20000; // Autosave every 20 seconds
const QUESTIONS_TO_ANSWER = 60; // How many questions each student will answer before submitting

require('dotenv').config({ path: __dirname + '/.env' }); // Load DB credentials first

// Database connection to fetch real students
const pool = new Pool({
  host: '127.0.0.1', // Use localhost because the script will run ON the server
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cos_db',
  user: process.env.DB_USER || 'cos_user',
  password: String(process.env.DB_PASSWORD || 'cos_pass'),
});
// =================================================

const isHttps = BASE_URL.startsWith('https');
const requestAgent = isHttps ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true });

// Fetch real students assigned to the exam
async function getRealStudents() {
  console.log(`🔍 Fetching real students assigned to Exam ${EXAM_ID}...`);
  try {
    const result = await pool.query(`
      SELECT u.student_id, u.student_id as password -- Assuming password is the same as student_id
      FROM users u
      JOIN exam_candidates ec ON ec.candidate_id = u.id
      WHERE ec.exam_id = $1 AND u.role = 'candidate'
      LIMIT $2
    `, [EXAM_ID, TOTAL_STUDENTS]);
    
    if (result.rows.length === 0) {
      console.error(`❌ No students found assigned to Exam ${EXAM_ID}!`);
      process.exit(1);
    }
    
    console.log(`✅ Found ${result.rows.length} students to simulate.`);
    return result.rows;
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Helper to make HTTP requests
async function makeRequest(endpoint, method, body = null, token = null) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Use the built-in fetch API instead of the low-level http/https modules
  // This is much more reliable and throws standard Error objects
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    let data = null;
    
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
    }
    
    return { status: response.status, data };
  } catch (error) {
    // This will catch network errors (ECONNREFUSED, ETIMEDOUT, etc)
    throw new Error(`Fetch failed: ${error.message}`);
  }
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// The Virtual User Journey
async function simulateStudent(student) {
  try {
    // 1. LOGIN
    console.log(`Attempting login for ${student.student_id}...`);
    let loginRes;
    try {
      loginRes = await makeRequest('/candidate/auth/login', 'POST', student);
    } catch (e) {
      console.log(`❌ Network/Code error during login for ${student.student_id}:`, e);
      return;
    }
    
    if (loginRes.status !== 200) {
      console.log(`❌ Login rejected for ${student.student_id}: Status ${loginRes.status} | Response: ${JSON.stringify(loginRes.data)}`);
      return;
    }
    const token = loginRes.data.token;
    // console.log(`✅ ${student.student_id} logged in.`);

    // 2. FETCH EXAM
    const examRes = await makeRequest(`/candidate/exams/${EXAM_ID}`, 'GET', null, token);
    if (examRes.status !== 200) {
      console.log(`❌ Fetch exam failed for ${student.student_id}: Status ${examRes.status} | Response: ${JSON.stringify(examRes.data)}`);
      return;
    }
    
    let realQuestionIds = [];
    
    // 2.5 START EXAM (This creates the attempt in the database!)
    const startRes = await makeRequest(`/candidate/exams/${EXAM_ID}/start`, 'POST', {}, token);
    if (startRes.status !== 200 && startRes.status !== 400) { // 400 might mean already started
      console.log(`❌ Start exam failed for ${student.student_id}: Status ${startRes.status} | Response: ${JSON.stringify(startRes.data)}`);
      return;
    }
    
    // Extract questions from the /start response
    if (startRes.data && Array.isArray(startRes.data.questions)) {
      realQuestionIds = startRes.data.questions.map(q => q.id || q.question_id);
    } else if (startRes.data && startRes.data.attempt && Array.isArray(startRes.data.questions)) {
      realQuestionIds = startRes.data.questions.map(q => q.id || q.question_id);
    } else if (startRes.status === 400 && startRes.data && startRes.data.questions) {
      // If they already started, the API might return the questions anyway
      realQuestionIds = startRes.data.questions.map(q => q.id || q.question_id);
    }
    
    if (realQuestionIds.length === 0) {
      console.log(`⚠️ WARNING: Could not extract real question IDs for ${student.student_id}. Start response format:`, Object.keys(startRes.data || {}));
    }
    // console.log(`✅ ${student.student_id} started the exam.`);
    
    // 3. SIMULATE ANSWERING QUESTIONS
    const answers = [];
    const options = ['A', 'B', 'C', 'D'];
    
    // Determine how many questions to answer (either the config limit or the total available)
    const questionsToAnswer = Math.min(QUESTIONS_TO_ANSWER, realQuestionIds.length > 0 ? realQuestionIds.length : 5);
    
    for (let i = 0; i < questionsToAnswer; i++) {
      await sleep(AUTOSAVE_INTERVAL_MS); // Wait 20 seconds between answers
      
      const randomAnswer = options[Math.floor(Math.random() * options.length)];
      
      // Use the real question ID if we found them, otherwise fallback to 1, 2, 3...
      const questionId = realQuestionIds.length > 0 ? realQuestionIds[i] : (i + 1);
      
      answers.push({ question_id: questionId, answer: randomAnswer });
      
      // Autosave
      const saveRes = await makeRequest(`/candidate/exams/${EXAM_ID}/save-answer`, 'POST', {
        question_id: questionId,
        answer: randomAnswer
      }, token);
      
      if (saveRes.status !== 200) {
        console.log(`⚠️ ${student.student_id} autosave failed for Q${questionId}: Status ${saveRes.status} | Response: ${JSON.stringify(saveRes.data)}`);
      }
    }

    // 4. SUBMIT EXAM
    await sleep(5000);
    const submitRes = await makeRequest(`/candidate/exams/${EXAM_ID}/submit`, 'POST', {
      answers: answers,
      violations: []
    }, token);

    if (submitRes.status === 200) {
      console.log(`🎉 ${student.student_id} submitted successfully!`);
    } else {
      console.log(`❌ ${student.student_id} submit failed: Status ${submitRes.status} | Response: ${JSON.stringify(submitRes.data)}`);
    }

  } catch (err) {
    console.log(`💥 CRITICAL CRASH for ${student.student_id}: ${err.message || 'Unknown Error'}`);
  }
}

// Main Execution
async function runLoadTest() {
  const students = await getRealStudents();
  
  console.log(`🚀 Starting Load Test with ${students.length} students...`);
  console.log(`⏳ Ramping up over ${RAMP_UP_TIME_MS / 1000} seconds...`);

  let activeUsers = 0;
  const promises = [];

  for (let i = 0; i < students.length; i++) {
    // Calculate delay to spread out logins evenly
    const delay = (RAMP_UP_TIME_MS / students.length) * i;
    
    const p = sleep(delay).then(() => {
      activeUsers++;
      return simulateStudent(students[i]).then(() => {
        activeUsers--;
      });
    });
    
    promises.push(p);
  }

  // Monitor active users
  const monitor = setInterval(() => {
    console.log(`📊 Active Virtual Users: ${activeUsers}`);
  }, 5000);

  await Promise.all(promises);
  clearInterval(monitor);
  console.log('🏁 Load Test Complete!');
}

runLoadTest();