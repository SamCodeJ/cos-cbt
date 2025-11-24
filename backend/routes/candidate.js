const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireCandidate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/candidate/auth/login - Candidate login (mobile)
router.post('/auth/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find candidate
      const result = await db.query(
        'SELECT id, name, email, password, role, student_id, is_active FROM users WHERE email = $1 AND role = \'candidate\'',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const candidate = result.rows[0];

      // Check if account is active
      if (!candidate.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, candidate.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(candidate.id, candidate.role);

      // Return candidate data (without password)
      res.json({
        token,
        candidate: {
          id: candidate.id,
          name: candidate.name,
          email: candidate.email,
          student_id: candidate.student_id
        }
      });
    } catch (error) {
      console.error('Candidate login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// All routes below require authentication
router.use(authenticateToken);
router.use(requireCandidate);

// GET /api/candidate/exams - Get assigned exams
router.get('/exams', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        e.*,
        u.name as teacher_name,
        CASE 
          WHEN ea.id IS NOT NULL THEN true 
          ELSE false 
        END as has_taken
      FROM exam_candidates ec
      JOIN exams e ON ec.exam_id = e.id
      JOIN users u ON e.teacher_id = u.id
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.id 
        AND ea.candidate_id = ec.candidate_id 
        AND ea.status IN ('submitted', 'auto_submitted')
      WHERE ec.candidate_id = $1
      ORDER BY e.start_date DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get candidate exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/candidate/exams/:id - Get exam details
router.get('/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if candidate is assigned to this exam
    const assignmentCheck = await db.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    const result = await db.query(`
      SELECT 
        e.*,
        u.name as teacher_name
      FROM exams e
      JOIN users u ON e.teacher_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get exam details error:', error);
    res.status(500).json({ error: 'Failed to fetch exam details' });
  }
});

// POST /api/candidate/exams/:id/start - Start exam
router.post('/exams/:id/start', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const candidateId = req.user.id;

    // Check if candidate is assigned to this exam
    const assignmentCheck = await client.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, candidateId]
    );

    if (assignmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Check if already started
    const existingAttempt = await client.query(
      'SELECT id, status FROM exam_attempts WHERE exam_id = $1 AND candidate_id = $2',
      [id, candidateId]
    );

    if (existingAttempt.rows.length > 0) {
      if (existingAttempt.rows[0].status === 'in_progress') {
        // Resume existing attempt
        const questions = await client.query(`
          SELECT q.*
          FROM exam_questions eq
          JOIN questions q ON eq.question_id = q.id
          WHERE eq.exam_id = $1 AND eq.candidate_id = $2
          ORDER BY eq.question_order
        `, [id, candidateId]);

        await client.query('COMMIT');
        
        return res.json({
          attempt_id: existingAttempt.rows[0].id,
          questions: questions.rows
        });
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You have already completed this exam' });
      }
    }

    // Get exam details
    const examResult = await client.query(
      'SELECT questions_per_candidate, randomize_questions FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = examResult.rows[0];

    // Get all questions for this exam
    const allQuestions = await client.query(
      'SELECT * FROM questions WHERE exam_id = $1',
      [id]
    );

    // Randomize and select questions
    let selectedQuestions = allQuestions.rows;
    
    if (exam.randomize_questions) {
      // Shuffle questions
      selectedQuestions = shuffleArray(selectedQuestions);
    }

    // Take only the required number of questions
    selectedQuestions = selectedQuestions.slice(0, exam.questions_per_candidate);

    // Create exam attempt
    const attemptResult = await client.query(`
      INSERT INTO exam_attempts (exam_id, candidate_id, total_questions, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING id
    `, [id, candidateId, selectedQuestions.length]);

    const attemptId = attemptResult.rows[0].id;

    // Assign questions to candidate
    for (let i = 0; i < selectedQuestions.length; i++) {
      await client.query(`
        INSERT INTO exam_questions (exam_id, candidate_id, question_id, question_order)
        VALUES ($1, $2, $3, $4)
      `, [id, candidateId, selectedQuestions[i].id, i + 1]);
    }

    await client.query('COMMIT');

    res.json({
      attempt_id: attemptId,
      questions: selectedQuestions
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Start exam error:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  } finally {
    client.release();
  }
});

// POST /api/candidate/exams/:id/save-answer - Save answer
router.post('/exams/:id/save-answer', async (req, res) => {
  try {
    const { id } = req.params;
    const { question_id, answer } = req.body;

    // Check if candidate is assigned to this exam
    const assignmentCheck = await db.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Get attempt ID
    const attemptResult = await db.query(
      'SELECT id FROM exam_attempts WHERE exam_id = $1 AND candidate_id = $2 AND status = \'in_progress\'',
      [id, req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active exam attempt found' });
    }

    const attemptId = attemptResult.rows[0].id;

    // Get correct answer
    const questionResult = await db.query(
      'SELECT correct_answer FROM questions WHERE id = $1',
      [question_id]
    );

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isCorrect = questionResult.rows[0].correct_answer === answer;

    // Insert or update answer
    await db.query(`
      INSERT INTO exam_answers (attempt_id, question_id, answer, is_correct)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET answer = $3, is_correct = $4, answered_at = CURRENT_TIMESTAMP
    `, [attemptId, question_id, answer, isCorrect]);

    res.json({ message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// POST /api/candidate/exams/:id/submit - Submit exam
router.post('/exams/:id/submit', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { answers, violations } = req.body;

    // Check if candidate is assigned to this exam
    const assignmentCheck = await client.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Get attempt
    const attemptResult = await client.query(
      'SELECT id, started_at, total_questions FROM exam_attempts WHERE exam_id = $1 AND candidate_id = $2 AND status = \'in_progress\'',
      [id, req.user.id]
    );

    if (attemptResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active exam attempt found' });
    }

    const attempt = attemptResult.rows[0];
    const attemptId = attempt.id;

    // Calculate time taken (in minutes)
    const startTime = new Date(attempt.started_at);
    const endTime = new Date();
    const timeTaken = Math.round((endTime - startTime) / 60000); // Convert to minutes

    // Save all answers
    for (const ans of answers) {
      if (ans.answer) {
        const questionResult = await client.query(
          'SELECT correct_answer FROM questions WHERE id = $1',
          [ans.question_id]
        );

        if (questionResult.rows.length > 0) {
          const isCorrect = questionResult.rows[0].correct_answer === ans.answer;

          await client.query(`
            INSERT INTO exam_answers (attempt_id, question_id, answer, is_correct)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (attempt_id, question_id) 
            DO UPDATE SET answer = $3, is_correct = $4
          `, [attemptId, ans.question_id, ans.answer, isCorrect]);
        }
      }
    }

    // Count correct answers
    const correctCount = await client.query(
      'SELECT COUNT(*) as correct FROM exam_answers WHERE attempt_id = $1 AND is_correct = true',
      [attemptId]
    );

    const correctAnswers = parseInt(correctCount.rows[0].correct);
    const scorePercentage = (correctAnswers / attempt.total_questions) * 100;

    // Get pass mark
    const examResult = await client.query(
      'SELECT pass_mark FROM exams WHERE id = $1',
      [id]
    );
    const passMark = examResult.rows[0].pass_mark;
    const passed = scorePercentage >= passMark;

    // Save violations
    if (violations && violations.length > 0) {
      for (const violation of violations) {
        await client.query(`
          INSERT INTO exam_violations (attempt_id, violation_type, description, timestamp)
          VALUES ($1, $2, $3, $4)
        `, [attemptId, violation.type, violation.description, violation.timestamp]);
      }
    }

    // Update attempt
    await client.query(`
      UPDATE exam_attempts SET
        submitted_at = CURRENT_TIMESTAMP,
        time_taken = $1,
        score_percentage = $2,
        correct_answers = $3,
        passed = $4,
        violations_count = $5,
        status = 'submitted'
      WHERE id = $6
    `, [timeTaken, scorePercentage, correctAnswers, passed, violations?.length || 0, attemptId]);

    await client.query('COMMIT');

    res.json({
      message: 'Exam submitted successfully',
      score_percentage: scorePercentage,
      correct_answers: correctAnswers,
      total_questions: attempt.total_questions,
      passed,
      time_taken: timeTaken
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  } finally {
    client.release();
  }
});

// GET /api/candidate/exams/:id/result - Get exam result
router.get('/exams/:id/result', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate is assigned to this exam
    const assignmentCheck = await db.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Get exam settings
    const examResult = await db.query(
      'SELECT show_results FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (!examResult.rows[0].show_results) {
      return res.status(403).json({ 
        error: 'Results are not available yet. Your teacher will share them when ready.' 
      });
    }

    // Get result
    const result = await db.query(`
      SELECT 
        ea.*,
        e.pass_mark,
        e.title as exam_title,
        e.subject as exam_subject
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.exam_id = $1 AND ea.candidate_id = $2 
        AND ea.status IN ('submitted', 'auto_submitted')
    `, [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const attemptId = result.rows[0].id;

    // Get answers with questions
    const answersResult = await db.query(`
      SELECT 
        ans.answer as your_answer,
        ans.is_correct,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer
      FROM exam_answers ans
      JOIN questions q ON ans.question_id = q.id
      WHERE ans.attempt_id = $1
      ORDER BY q.id
    `, [attemptId]);

    // Get violations
    const violationsResult = await db.query(
      'SELECT * FROM exam_violations WHERE attempt_id = $1 ORDER BY timestamp',
      [attemptId]
    );

    res.json({
      ...result.rows[0],
      answers: answersResult.rows,
      violations: violationsResult.rows,
      show_question_review: true
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = router;

