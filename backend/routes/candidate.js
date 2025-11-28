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

    // Add availability information to each exam
    const now = new Date();
    const examsWithAvailability = result.rows.map(exam => {
      const startDate = new Date(exam.start_date);
      const endDate = new Date(exam.end_date);
      
      let is_available = exam.status === 'active' && now >= startDate && now <= endDate;
      let availability_message = null;
      
      if (exam.status !== 'active') {
        if (exam.status === 'scheduled') {
          availability_message = `Starts ${startDate.toLocaleString()}`;
        } else if (exam.status === 'draft') {
          availability_message = 'Not yet published';
        } else if (exam.status === 'completed') {
          availability_message = 'Completed';
        }
        is_available = false;
      } else if (now < startDate) {
        availability_message = `Starts ${startDate.toLocaleString()}`;
        is_available = false;
      } else if (now > endDate) {
        availability_message = `Ended ${endDate.toLocaleString()}`;
        is_available = false;
      }
      
      return {
        ...exam,
        is_available,
        availability_message
      };
    });

    res.json(examsWithAvailability);
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

    const exam = result.rows[0];
    
    // Add availability information
    const now = new Date();
    const startDate = new Date(exam.start_date);
    const endDate = new Date(exam.end_date);
    
    exam.is_available = exam.status === 'active' && now >= startDate && now <= endDate;
    exam.availability_message = null;
    
    if (exam.status !== 'active') {
      if (exam.status === 'scheduled') {
        exam.availability_message = `Starts on ${startDate.toLocaleString()}`;
      } else if (exam.status === 'draft') {
        exam.availability_message = 'Not yet published';
      } else if (exam.status === 'completed') {
        exam.availability_message = 'Exam has ended';
      }
    } else if (now < startDate) {
      exam.availability_message = `Starts on ${startDate.toLocaleString()}`;
      exam.is_available = false;
    } else if (now > endDate) {
      exam.availability_message = `Ended on ${endDate.toLocaleString()}`;
      exam.is_available = false;
    }

    res.json(exam);
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

    // Get exam details including status and schedule
    const examResult = await client.query(
      'SELECT questions_per_candidate, randomize_questions, randomize_options, status, start_date, end_date, title FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = examResult.rows[0];
    const now = new Date();
    const startDate = new Date(exam.start_date);
    const endDate = new Date(exam.end_date);

    // Check if exam is active
    if (exam.status !== 'active') {
      await client.query('ROLLBACK');
      let message = 'This exam is not available yet';
      if (exam.status === 'draft') {
        message = 'This exam is still in draft. Please wait for your teacher to activate it.';
      } else if (exam.status === 'scheduled') {
        message = `This exam is scheduled to start on ${startDate.toLocaleString()}. Please wait until the scheduled time.`;
      } else if (exam.status === 'completed') {
        message = 'This exam has been completed and is no longer available.';
      }
      return res.status(403).json({ error: message });
    }

    // Check if current time is within exam window
    if (now < startDate) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: `This exam starts on ${startDate.toLocaleString()}. Please try again at that time.` 
      });
    }

    if (now > endDate) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: `This exam ended on ${endDate.toLocaleString()}. You can no longer take this exam.` 
      });
    }

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

    // Randomize options if enabled
    console.log('🔀 Randomize options enabled:', exam.randomize_options);
    if (exam.randomize_options) {
      selectedQuestions = selectedQuestions.map(question => {
        const originalQuestion = { ...question };
        const shuffledQuestion = randomizeQuestionOptions(question);
        
        console.log(`🎲 Question ${question.id} shuffling:`, {
          original: {
            correct_answer: originalQuestion.correct_answer,
            option_a: originalQuestion.option_a?.substring(0, 20),
            option_b: originalQuestion.option_b?.substring(0, 20),
            option_c: originalQuestion.option_c?.substring(0, 20),
            option_d: originalQuestion.option_d?.substring(0, 20)
          },
          shuffled: {
            correct_answer: shuffledQuestion.correct_answer,
            option_a: shuffledQuestion.option_a?.substring(0, 20),
            option_b: shuffledQuestion.option_b?.substring(0, 20),
            option_c: shuffledQuestion.option_c?.substring(0, 20),
            option_d: shuffledQuestion.option_d?.substring(0, 20)
          }
        });
        
        return shuffledQuestion;
      });
    }

    // Create exam attempt
    const attemptResult = await client.query(`
      INSERT INTO exam_attempts (exam_id, candidate_id, total_questions, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING id
    `, [id, candidateId, selectedQuestions.length]);

    const attemptId = attemptResult.rows[0].id;

    // Assign questions to candidate with shuffled options
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      
      console.log(`💾 Storing Q${question.id} in exam_questions:`, {
        shuffled_correct_answer: question.correct_answer,
        shuffled_option_a: question.option_a?.substring(0, 20),
        shuffled_option_b: question.option_b?.substring(0, 20),
        shuffled_option_c: question.option_c?.substring(0, 20),
        shuffled_option_d: question.option_d?.substring(0, 20)
      });
      
      await client.query(`
        INSERT INTO exam_questions (
          exam_id, candidate_id, question_id, question_order, 
          shuffled_correct_answer, shuffled_option_a, shuffled_option_b, 
          shuffled_option_c, shuffled_option_d
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        id, 
        candidateId, 
        question.id, 
        i + 1, 
        question.correct_answer,
        question.option_a,
        question.option_b,
        question.option_c,
        question.option_d
      ]);
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

    // Get correct answer (use shuffled version if available)
    const questionResult = await db.query(`
      SELECT 
        q.correct_answer as original_correct_answer,
        eq.shuffled_correct_answer,
        COALESCE(eq.shuffled_correct_answer, q.correct_answer) as correct_answer,
        eq.shuffled_option_a,
        eq.shuffled_option_b,
        eq.shuffled_option_c,
        eq.shuffled_option_d
      FROM questions q
      LEFT JOIN exam_questions eq ON eq.question_id = q.id 
        AND eq.exam_id = $1 
        AND eq.candidate_id = $2
      WHERE q.id = $3
    `, [id, req.user.id, question_id]);

    if (questionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const correctAnswer = questionResult.rows[0].correct_answer;
    const isCorrect = correctAnswer === answer;
    
    console.log(`🎯 Answer validation for Q${question_id}:`, {
      candidate_answer: answer,
      original_correct: questionResult.rows[0].original_correct_answer,
      shuffled_correct: questionResult.rows[0].shuffled_correct_answer,
      used_correct_answer: correctAnswer,
      is_correct: isCorrect,
      has_shuffled_data: !!questionResult.rows[0].shuffled_correct_answer
    });

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
        // Get correct answer (use shuffled version if available)
        const questionResult = await client.query(`
          SELECT 
            q.correct_answer as original_correct_answer,
            eq.shuffled_correct_answer,
            COALESCE(eq.shuffled_correct_answer, q.correct_answer) as correct_answer
          FROM questions q
          LEFT JOIN exam_questions eq ON eq.question_id = q.id 
            AND eq.exam_id = $1 
            AND eq.candidate_id = $2
          WHERE q.id = $3
        `, [id, req.user.id, ans.question_id]);

        if (questionResult.rows.length > 0) {
          const correctAnswer = questionResult.rows[0].correct_answer;
          const isCorrect = correctAnswer === ans.answer;
          
          console.log(`🎯 Final validation for Q${ans.question_id}:`, {
            candidate_answer: ans.answer,
            original_correct: questionResult.rows[0].original_correct_answer,
            shuffled_correct: questionResult.rows[0].shuffled_correct_answer,
            used_correct_answer: correctAnswer,
            is_correct: isCorrect,
            has_shuffled_data: !!questionResult.rows[0].shuffled_correct_answer
          });

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
    const passMark = parseFloat(examResult.rows[0].pass_mark);
    const passed = scorePercentage >= passMark;
    
    console.log('📊 Exam submission - Pass/Fail calculation:', {
      scorePercentage,
      passMark,
      passed,
      comparison: `${scorePercentage} >= ${passMark} = ${passed}`
    });

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
      score_percentage: parseFloat(scorePercentage.toFixed(2)),
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

    // Get answers with questions (use shuffled options if available)
    const answersResult = await db.query(`
      SELECT 
        ans.answer as your_answer,
        ans.is_correct,
        q.question_text,
        COALESCE(eq.shuffled_option_a, q.option_a) as option_a,
        COALESCE(eq.shuffled_option_b, q.option_b) as option_b,
        COALESCE(eq.shuffled_option_c, q.option_c) as option_c,
        COALESCE(eq.shuffled_option_d, q.option_d) as option_d,
        COALESCE(eq.shuffled_correct_answer, q.correct_answer) as correct_answer
      FROM exam_answers ans
      JOIN questions q ON ans.question_id = q.id
      LEFT JOIN exam_questions eq ON eq.question_id = q.id 
        AND eq.exam_id = $2
        AND eq.candidate_id = $3
      WHERE ans.attempt_id = $1
      ORDER BY eq.question_order
    `, [attemptId, id, req.user.id]);

    // Get violations
    const violationsResult = await db.query(
      'SELECT * FROM exam_violations WHERE attempt_id = $1 ORDER BY timestamp',
      [attemptId]
    );

    // Ensure numeric types for comparison
    const resultData = result.rows[0];
    const response = {
      ...resultData,
      score_percentage: parseFloat(resultData.score_percentage),
      pass_mark: parseFloat(resultData.pass_mark),
      correct_answers: parseInt(resultData.correct_answers),
      total_questions: parseInt(resultData.total_questions),
      time_taken: parseInt(resultData.time_taken),
      violations_count: parseInt(resultData.violations_count),
      passed: resultData.passed, // This is already boolean from database
      answers: answersResult.rows,
      violations: violationsResult.rows,
      show_question_review: true
    };
    
    console.log('📊 Result data being sent:', {
      score_percentage: response.score_percentage,
      pass_mark: response.pass_mark,
      passed: response.passed,
      types: {
        score_percentage: typeof response.score_percentage,
        pass_mark: typeof response.pass_mark,
        passed: typeof response.passed
      }
    });

    res.json(response);
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

// Helper function to randomize question options
function randomizeQuestionOptions(question) {
  // Create array of options with their labels
  const options = [];
  
  if (question.option_a) options.push({ label: 'A', text: question.option_a });
  if (question.option_b) options.push({ label: 'B', text: question.option_b });
  if (question.option_c) options.push({ label: 'C', text: question.option_c });
  if (question.option_d) options.push({ label: 'D', text: question.option_d });
  
  // Remember which option is correct
  const correctOption = options.find(opt => opt.label === question.correct_answer);
  
  // Shuffle the options
  const shuffledOptions = shuffleArray(options);
  
  // Find new position of correct answer
  const newCorrectLabel = ['A', 'B', 'C', 'D'][shuffledOptions.indexOf(correctOption)];
  
  // Create new question object with shuffled options
  return {
    ...question,
    option_a: shuffledOptions[0] ? shuffledOptions[0].text : null,
    option_b: shuffledOptions[1] ? shuffledOptions[1].text : null,
    option_c: shuffledOptions[2] ? shuffledOptions[2].text : null,
    option_d: shuffledOptions[3] ? shuffledOptions[3].text : null,
    correct_answer: newCorrectLabel,
    original_correct_answer: question.correct_answer // Keep track of original for debugging
  };
}

module.exports = router;

