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
  body('student_id').notEmpty().withMessage('Student ID required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { student_id, password } = req.body;

      // Find candidate by student_id
      const result = await db.query(
        'SELECT id, name, email, password, role, student_id, is_active FROM users WHERE student_id = $1 AND role = \'candidate\'',
        [student_id]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid student ID or password' });
      }

      const candidate = result.rows[0];

      // Check if account is active
      if (!candidate.is_active) {
        return res.status(403).json({ error: 'Account is deactivated. Please contact your teacher.' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, candidate.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid student ID or password' });
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

        // Calculate time remaining for resumed attempt
        // Consider both elapsed time AND exam end_date
        const examDetails = await client.query(`
          SELECT 
            e.duration,
            e.global_time_extension_minutes,
            e.end_date,
            ea.started_at,
            ea.time_extension_minutes,
            EXTRACT(EPOCH FROM (e.end_date - CURRENT_TIMESTAMP))/60 as minutes_until_exam_closes
          FROM exams e
          JOIN exam_attempts ea ON ea.exam_id = e.id
          WHERE e.id = $1 AND ea.id = $2
        `, [id, existingAttempt.rows[0].id]);
        
        const examData = examDetails.rows[0];
        const baseDuration = parseInt(examData.duration) || 0;
        const globalExtension = parseInt(examData.global_time_extension_minutes) || 0;
        const individualExtension = parseInt(examData.time_extension_minutes) || 0;
        const allocatedTime = baseDuration + globalExtension + individualExtension;
        const minutesUntilExamCloses = parseFloat(examData.minutes_until_exam_closes) || 0;
        
        // Use SQL to calculate elapsed time (avoids timezone issues)
        const timeCalc = await client.query(`
          SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 as elapsed_minutes
          FROM exam_attempts 
          WHERE id = $1
        `, [existingAttempt.rows[0].id]);
        
        const elapsedMinutes = parseFloat(timeCalc.rows[0]?.elapsed_minutes) || 0;
        
        // Calculate remaining based on allocated time minus elapsed
        const remainingFromAllocation = Math.max(0, allocatedTime - elapsedMinutes);
        
        // But also respect the exam's end_date - give whichever is less
        const actualRemaining = Math.min(remainingFromAllocation, minutesUntilExamCloses);
        const remainingSeconds = Math.max(0, Math.floor(actualRemaining * 60));
        
        console.log('📊 Resuming exam - Time info:', {
          allocatedTime: `${allocatedTime} minutes`,
          elapsedMinutes: elapsedMinutes.toFixed(2),
          remainingFromAllocation: `${remainingFromAllocation.toFixed(2)} minutes`,
          minutesUntilExamCloses: `${minutesUntilExamCloses.toFixed(2)} minutes`,
          actualRemaining: `${actualRemaining.toFixed(2)} minutes`,
          remainingSeconds,
          limitedByEndDate: remainingFromAllocation > minutesUntilExamCloses
        });
        
        await client.query('COMMIT');
        
        return res.json({
          attempt_id: existingAttempt.rows[0].id,
          questions: questions.rows,
          time_remaining_seconds: remainingSeconds,
          total_duration_minutes: Math.ceil(actualRemaining)
        });
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You have already completed this exam' });
      }
    }

    // Get exam details including status, schedule, and section distribution settings
    const examResult = await client.query(
      'SELECT questions_per_candidate, randomize_questions, randomize_options, status, start_date, end_date, title, enable_section_distribution, section_distribution FROM exams WHERE id = $1',
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

    // Get all questions for this exam (order by section_id if present, then by id)
    const allQuestions = await client.query(
      `SELECT * FROM questions 
       WHERE exam_id = $1 
       ORDER BY 
         CASE WHEN section_id IS NULL THEN 1 ELSE 0 END,
         section_id NULLS LAST,
         id`,
      [id]
    );

    // Check if exam has questions
    if (allQuestions.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This exam has no questions assigned yet' });
    }

    // Randomize and select questions
    let selectedQuestions = [];
    
    // Check if section-based distribution is enabled
    if (exam.enable_section_distribution && exam.section_distribution) {
      console.log('📊 Section-based distribution enabled:', exam.section_distribution);
      
      // Group questions by section
      const questionsBySection = {};
      allQuestions.rows.forEach(q => {
        const sectionName = q.section_id || 'Unsectioned';
        if (!questionsBySection[sectionName]) {
          questionsBySection[sectionName] = [];
        }
        questionsBySection[sectionName].push(q);
      });
      
      // Select questions from each section according to distribution
      const distribution = exam.section_distribution;
      
      for (const [sectionName, count] of Object.entries(distribution)) {
        const sectionQuestions = questionsBySection[sectionName] || [];
        
        console.log(`📚 Section "${sectionName}": ${sectionQuestions.length} available, selecting ${count}`);
        
        if (sectionQuestions.length < count) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: `Not enough questions in section "${sectionName}". Need ${count}, have ${sectionQuestions.length}` 
          });
        }
        
        // Randomize within section if randomize_questions is enabled
        let sectionSelection = [...sectionQuestions];
        if (exam.randomize_questions) {
          sectionSelection = shuffleArray(sectionSelection);
        }
        
        // Take the required number from this section
        selectedQuestions.push(...sectionSelection.slice(0, count));
      }
      
      // Shuffle the final selection to mix sections if randomize_questions is enabled
      if (exam.randomize_questions) {
        selectedQuestions = shuffleArray(selectedQuestions);
      }
      
      console.log(`✅ Selected ${selectedQuestions.length} questions using section distribution`);
      
    } else {
      // Original logic: Simple randomization without section distribution
      selectedQuestions = allQuestions.rows;
      
      if (exam.randomize_questions) {
        // Shuffle questions
        selectedQuestions = shuffleArray(selectedQuestions);
      }

      // Take only the required number of questions
      // Ensure we don't exceed available questions
      const maxQuestions = Math.min(exam.questions_per_candidate, selectedQuestions.length);
      selectedQuestions = selectedQuestions.slice(0, maxQuestions);
      
      console.log(`✅ Selected ${selectedQuestions.length} questions using simple randomization`);
    }
    
    if (selectedQuestions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No questions available for this exam' });
    }

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
    console.log(`📝 Assigning ${selectedQuestions.length} questions to candidate ${candidateId} for exam ${id}`);
    
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i];
      
      // Validate required fields
      if (!question.id) {
        throw new Error(`Question at index ${i} has no ID`);
      }
      if (!question.option_a || !question.option_b) {
        throw new Error(`Question ${question.id} is missing required options (A or B)`);
      }
      if (!question.correct_answer) {
        throw new Error(`Question ${question.id} has no correct answer`);
      }
      
      console.log(`💾 Storing Q${question.id} (Section: ${question.section_id || 'None'}) in exam_questions:`, {
        question_order: i + 1,
        shuffled_correct_answer: question.correct_answer,
        shuffled_option_a: question.option_a?.substring(0, 20),
        shuffled_option_b: question.option_b?.substring(0, 20),
        shuffled_option_c: question.option_c?.substring(0, 20) || 'NULL',
        shuffled_option_d: question.option_d?.substring(0, 20) || 'NULL'
      });
      
      try {
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
          question.option_c || null,
          question.option_d || null
        ]);
      } catch (insertError) {
        console.error(`❌ Failed to insert question ${question.id} at order ${i + 1}:`, insertError);
        throw new Error(`Failed to assign question ${question.id}: ${insertError.message}`);
      }
    }
    
    console.log(`✅ Successfully assigned all ${selectedQuestions.length} questions`);

    await client.query('COMMIT');

    // Ensure all question fields are properly formatted for mobile app
    const formattedQuestions = selectedQuestions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || null,
      option_d: q.option_d || null,
      correct_answer: q.correct_answer,
      is_multi_answer: q.is_multi_answer || false,
      section_id: q.section_id || null,
      instruction: q.instruction || null,
      passage: q.passage || null,
      points: q.points || 1,
      difficulty: q.difficulty || 'medium'
    }));

    console.log(`✅ Returning ${formattedQuestions.length} questions to mobile app`);
    console.log(`📊 Sample question fields:`, {
      id: formattedQuestions[0]?.id,
      has_section: !!formattedQuestions[0]?.section_id,
      has_instruction: !!formattedQuestions[0]?.instruction,
      has_passage: !!formattedQuestions[0]?.passage
    });

    // Calculate initial time remaining (includes any pre-existing extensions)
    // Also consider the exam's end_date to ensure student doesn't exceed the exam window
    const examTimeDetails = await client.query(`
      SELECT 
        e.duration,
        e.global_time_extension_minutes,
        e.end_date,
        ea.time_extension_minutes,
        EXTRACT(EPOCH FROM (e.end_date - CURRENT_TIMESTAMP))/60 as minutes_until_exam_closes
      FROM exams e
      JOIN exam_attempts ea ON ea.exam_id = e.id
      WHERE e.id = $1 AND ea.id = $2
    `, [id, attemptId]);
    
    const timeData = examTimeDetails.rows[0];
    const baseDuration = parseInt(timeData.duration) || 0;
    const globalExtension = parseInt(timeData.global_time_extension_minutes) || 0;
    const individualExtension = parseInt(timeData.time_extension_minutes) || 0;
    const allocatedTime = baseDuration + globalExtension + individualExtension;
    const minutesUntilExamCloses = parseFloat(timeData.minutes_until_exam_closes) || 0;
    
    // Give student the minimum of: allocated time OR time remaining until exam closes
    const totalDuration = Math.min(allocatedTime, Math.ceil(minutesUntilExamCloses));
    const timeRemainingSeconds = Math.max(0, totalDuration * 60);
    
    console.log(`⏱️ Time calculation for new exam start:`, {
      baseDuration,
      globalExtension,
      individualExtension,
      allocatedTime: `${allocatedTime} minutes`,
      minutesUntilExamCloses: `${minutesUntilExamCloses.toFixed(2)} minutes`,
      givenTime: `${totalDuration} minutes (${timeRemainingSeconds} seconds)`,
      limited: allocatedTime > minutesUntilExamCloses
    });

    res.json({
      attempt_id: attemptId,
      questions: formattedQuestions,
      time_remaining_seconds: timeRemainingSeconds,
      total_duration_minutes: totalDuration
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(rollbackError => {
      console.error('Rollback error:', rollbackError);
    });
    
    console.error('❌ Start exam error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    // Log additional context if available
    if (error.detail) {
      console.error('❌ Error detail:', error.detail);
    }
    if (error.hint) {
      console.error('❌ Error hint:', error.hint);
    }
    
    res.status(500).json({ 
      error: 'Failed to start exam',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack
      } : undefined
    });
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
        q.is_multi_answer,
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
    const isMultiAnswer = questionResult.rows[0].is_multi_answer;
    
    // For multi-answer questions, sort both answers before comparing
    let isCorrect;
    if (isMultiAnswer && correctAnswer.includes(',')) {
      const correctSorted = correctAnswer.split(',').sort().join(',');
      const answerSorted = (answer || '').split(',').sort().join(',');
      isCorrect = correctSorted === answerSorted;
    } else {
      isCorrect = correctAnswer === answer;
    }
    
    console.log(`🎯 Answer validation for Q${question_id}:`, {
      candidate_answer: answer,
      original_correct: questionResult.rows[0].original_correct_answer,
      shuffled_correct: questionResult.rows[0].shuffled_correct_answer,
      used_correct_answer: correctAnswer,
      is_multi_answer: isMultiAnswer,
      is_correct: isCorrect,
      has_shuffled_data: !!questionResult.rows[0].shuffled_correct_answer
    });

    // Validate answer format before saving
    if (answer && answer.length > 10) {
      return res.status(400).json({ error: 'Answer is too long. Maximum 10 characters allowed.' });
    }
    
    // Normalize answer format (sort multi-answer values)
    let normalizedAnswer = answer || null;
    if (normalizedAnswer && normalizedAnswer.includes(',')) {
      const answers = normalizedAnswer.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
      normalizedAnswer = answers.sort().join(',');
    } else if (normalizedAnswer) {
      normalizedAnswer = normalizedAnswer.trim().toUpperCase();
    }
    
    console.log(`💾 Saving answer for Q${question_id}:`, {
      original_answer: answer,
      normalized_answer: normalizedAnswer,
      is_correct: isCorrect,
      is_multi_answer: isMultiAnswer
    });

    // Insert or update answer
    await db.query(`
      INSERT INTO exam_answers (attempt_id, question_id, answer, is_correct)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (attempt_id, question_id) 
      DO UPDATE SET answer = $3, is_correct = $4, answered_at = CURRENT_TIMESTAMP
    `, [attemptId, question_id, normalizedAnswer, isCorrect]);

    res.json({ message: 'Answer saved successfully' });
  } catch (error) {
    console.error('❌ Save answer error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
    console.error('❌ Error hint:', error.hint);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to save answer',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint
      } : undefined
    });
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

    // Calculate time taken (in minutes) - use SQL to avoid timezone issues
    const timeResult = await client.query(`
      SELECT ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60) as time_taken_minutes
      FROM exam_attempts WHERE id = $1
    `, [attemptId]);
    const timeTaken = parseInt(timeResult.rows[0]?.time_taken_minutes) || 0;

    // Save all answers
    for (const ans of answers) {
      if (ans.answer) {
        // Get correct answer (use shuffled version if available)
        const questionResult = await client.query(`
          SELECT 
            q.correct_answer as original_correct_answer,
            q.is_multi_answer,
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
          const isMultiAnswer = questionResult.rows[0].is_multi_answer;
          
          // For multi-answer questions, sort both answers before comparing
          let isCorrect;
          if (isMultiAnswer && correctAnswer.includes(',')) {
            const correctSorted = correctAnswer.split(',').sort().join(',');
            const answerSorted = (ans.answer || '').split(',').sort().join(',');
            isCorrect = correctSorted === answerSorted;
          } else {
            isCorrect = correctAnswer === ans.answer;
          }
          
          console.log(`🎯 Final validation for Q${ans.question_id}:`, {
            candidate_answer: ans.answer,
            original_correct: questionResult.rows[0].original_correct_answer,
            shuffled_correct: questionResult.rows[0].shuffled_correct_answer,
            used_correct_answer: correctAnswer,
            is_multi_answer: isMultiAnswer,
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
  
  // Handle multi-answer questions (correct_answer might be "A,B,D")
  const correctAnswers = question.correct_answer.split(',');
  const correctOptions = options.filter(opt => correctAnswers.includes(opt.label));
  
  // Shuffle the options
  const shuffledOptions = shuffleArray(options);
  
  // Find new positions of all correct answers
  const newCorrectLabels = correctOptions.map(correctOpt => {
    const newIndex = shuffledOptions.indexOf(correctOpt);
    return ['A', 'B', 'C', 'D'][newIndex];
  }).sort(); // Sort to maintain consistent format (e.g., "A,B,D" not "D,B,A")
  
  const newCorrectAnswer = newCorrectLabels.join(',');
  
  // Create new question object with shuffled options
  return {
    ...question,
    option_a: shuffledOptions[0] ? shuffledOptions[0].text : null,
    option_b: shuffledOptions[1] ? shuffledOptions[1].text : null,
    option_c: shuffledOptions[2] ? shuffledOptions[2].text : null,
    option_d: shuffledOptions[3] ? shuffledOptions[3].text : null,
    correct_answer: newCorrectAnswer,
    original_correct_answer: question.correct_answer // Keep track of original for debugging
  };
}

// GET /api/candidate/exams/:id/time-remaining - Get current time remaining with extensions
router.get('/exams/:id/time-remaining', authenticateToken, requireCandidate, async (req, res) => {
  try {
    const { id } = req.params;
    const candidateId = req.user.id;

    // Check if candidate is assigned to this exam
    const assignmentCheck = await db.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, candidateId]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Get exam and attempt details - ONLY for THIS candidate
    // Also include end_date to ensure time doesn't exceed exam window
    const result = await db.query(`
      SELECT 
        e.id as exam_id,
        e.duration as base_duration,
        e.global_time_extension_minutes,
        e.end_date,
        ea.started_at,
        ea.time_extension_minutes,
        ea.status,
        ea.candidate_id,
        EXTRACT(EPOCH FROM (e.end_date - CURRENT_TIMESTAMP))/60 as minutes_until_exam_closes
      FROM exams e
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.id AND ea.candidate_id = $2
      WHERE e.id = $1
    `, [id, candidateId]);
    
    console.log('🔍 Query result:', {
      exam_id: result.rows[0]?.exam_id,
      candidate_id: result.rows[0]?.candidate_id,
      requested_candidate: candidateId,
      started_at: result.rows[0]?.started_at,
      status: result.rows[0]?.status
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = result.rows[0];

    // Convert to integers to ensure proper calculation
    const baseDuration = parseInt(exam.base_duration) || 0;
    const globalExtension = parseInt(exam.global_time_extension_minutes) || 0;
    const individualExtension = parseInt(exam.time_extension_minutes) || 0;
    const allocatedTime = baseDuration + globalExtension + individualExtension;
    const minutesUntilExamCloses = parseFloat(exam.minutes_until_exam_closes) || 0;

    console.log('⏱️ Time calculation for exam:', exam.exam_id || 'undefined', '/ candidate:', exam.candidate_id || 'undefined');
    console.log('   Requested by candidate:', candidateId);
    console.log('   Base duration:', baseDuration, 'minutes');
    console.log('   Global extension:', globalExtension, 'minutes');
    console.log('   Individual extension:', individualExtension, 'minutes');
    console.log('   Allocated time:', allocatedTime, 'minutes');
    console.log('   Minutes until exam closes:', minutesUntilExamCloses.toFixed(2), 'minutes');

    // If exam not started yet, return available time (min of allocated vs time until closes)
    if (!exam.started_at || exam.status !== 'in_progress') {
      console.log('   Status: Not started or not in progress');
      const availableTime = Math.min(allocatedTime, Math.ceil(minutesUntilExamCloses));
      const availableSeconds = Math.max(0, availableTime * 60);
      
      return res.json({
        total_duration_minutes: availableTime,
        time_remaining_seconds: availableSeconds,
        base_duration: baseDuration,
        global_extension: globalExtension,
        individual_extension: individualExtension,
        status: exam.status || 'not_started',
        limited_by_end_date: allocatedTime > minutesUntilExamCloses
      });
    }

    // Calculate time remaining for active exam
    // Consider both elapsed time AND exam end_date
    const timeCalc = await db.query(`
      SELECT 
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - $1))/60 as elapsed_minutes
      FROM exam_attempts 
      WHERE exam_id = $2 AND candidate_id = $3
      LIMIT 1
    `, [exam.started_at, id, candidateId]);
    
    const elapsedMinutes = parseFloat(timeCalc.rows[0]?.elapsed_minutes) || 0;
    
    // Calculate remaining based on allocated time minus elapsed
    const remainingFromAllocation = Math.max(0, allocatedTime - elapsedMinutes);
    
    // But also respect the exam's end_date - give whichever is less
    const actualRemaining = Math.min(remainingFromAllocation, minutesUntilExamCloses);
    const remainingSeconds = Math.max(0, Math.floor(actualRemaining * 60));

    console.log('   Started at:', exam.started_at);
    console.log('   Elapsed (from SQL):', elapsedMinutes.toFixed(2), 'minutes');
    console.log('   Remaining from allocation:', remainingFromAllocation.toFixed(2), 'minutes');
    console.log('   Actual remaining (respecting end_date):', actualRemaining.toFixed(2), 'minutes (' + remainingSeconds + ' seconds)');
    console.log('   Limited by end_date:', remainingFromAllocation > minutesUntilExamCloses);

    res.json({
      total_duration_minutes: Math.ceil(actualRemaining),
      time_remaining_seconds: remainingSeconds,
      elapsed_minutes: Math.floor(elapsedMinutes),
      base_duration: baseDuration,
      global_extension: globalExtension,
      individual_extension: individualExtension,
      status: exam.status,
      limited_by_end_date: remainingFromAllocation > minutesUntilExamCloses
    });
  } catch (error) {
    console.error('Get time remaining error:', error);
    res.status(500).json({ error: 'Failed to get time remaining' });
  }
});

// POST /api/candidate/exams/:id/verify-pin - Verify PIN for an exam
router.post('/exams/:id/verify-pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN is required' });
    }

    // Check if candidate is assigned to this exam
    const assignmentCheck = await db.query(
      'SELECT 1 FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, req.user.id]
    );

    if (assignmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not assigned to this exam' });
    }

    // Get exam PIN
    const examResult = await db.query(
      'SELECT exam_pin, require_pin_check FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const { exam_pin, require_pin_check } = examResult.rows[0];

    if (!require_pin_check) {
      return res.json({ success: true, message: 'PIN check not required for this exam' });
    }

    if (pin !== exam_pin) {
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    res.json({ success: true, message: 'PIN verified successfully' });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({ error: 'Failed to verify PIN' });
  }
});

module.exports = router;

