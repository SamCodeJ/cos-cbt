const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireTeacher, logActivity } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requireTeacher);

// GET /api/exams - List exams
router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT 
        e.*,
        u.name as teacher_name,
        (SELECT COUNT(*) FROM exam_candidates WHERE exam_id = e.id) as candidate_count
      FROM exams e
      LEFT JOIN users u ON e.teacher_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Teachers only see their own exams
    if (req.user.role === 'teacher') {
      params.push(req.user.id);
      query += ` AND e.teacher_id = $${params.length}`;
    }

    query += ' ORDER BY e.created_at DESC';

    const result = await db.query(query, params);
    
    // Ensure candidate_count is returned as a number
    const exams = result.rows.map(exam => ({
      ...exam,
      candidate_count: parseInt(exam.candidate_count) || 0
    }));
    
    res.json(exams);
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get single exam
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        e.*,
        u.name as teacher_name,
        (SELECT COUNT(*) FROM exam_candidates WHERE exam_id = e.id) as candidate_count
      FROM exams e
      LEFT JOIN users u ON e.teacher_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const exam = result.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && exam.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Ensure candidate_count is returned as a number
    exam.candidate_count = parseInt(exam.candidate_count) || 0;

    res.json(exam);
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
});

// POST /api/exams - Create exam
router.post('/',
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('duration').isInt({ min: 10 }).withMessage('Duration must be at least 10 minutes'),
  body('questions_per_candidate').isInt({ min: 1 }).withMessage('Must have at least 1 question'),
  body('pass_mark').isFloat({ min: 0, max: 100 }).withMessage('Pass mark must be between 0-100'),
  body('start_date').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid start date format'),
  body('end_date').notEmpty().withMessage('End date is required').isISO8601().withMessage('Invalid end date format'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.array() 
        });
      }

      const {
        title,
        subject,
        duration,
        questions_per_candidate,
        pass_mark,
        start_date,
        end_date,
        show_results,
        randomize_questions,
        randomize_options,
        enforce_screen_lock,
        status = 'draft'
      } = req.body;

      // Validate that end_date is after start_date
      if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: [{ msg: 'End date must be after start date', param: 'end_date' }]
        });
      }

      console.log('Creating exam with data:', {
        teacher_id: req.user.id,
        title,
        subject,
        duration,
        questions_per_candidate,
        pass_mark,
        start_date,
        start_date_type: typeof start_date,
        end_date,
        end_date_type: typeof end_date,
        show_results,
        randomize_questions,
        randomize_options,
        enforce_screen_lock,
        status
      });

      const result = await db.query(`
        INSERT INTO exams (
          teacher_id, title, subject, duration, questions_per_candidate,
          pass_mark, start_date, end_date, show_results, randomize_questions,
          randomize_options, enforce_screen_lock, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        req.user.id, title, subject, duration, questions_per_candidate,
        pass_mark, start_date, end_date, show_results, randomize_questions,
        randomize_options, enforce_screen_lock, status
      ]);

      console.log('Exam created successfully:', result.rows[0].id);

      await logActivity(
        req.user.id,
        req.user.name,
        'exam.create',
        `Created exam: ${title}`,
        req.ip
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create exam error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        error: 'Failed to create exam',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// PUT /api/exams/:id - Update exam
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      title,
      subject,
      duration,
      questions_per_candidate,
      pass_mark,
      start_date,
      end_date,
      show_results,
      randomize_questions,
      randomize_options,
      enforce_screen_lock,
      status
    } = req.body;

      // Validate that end_date is after start_date (if both are provided)
      if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
        return res.status(400).json({ 
          error: 'Validation failed',
          errors: [{ msg: 'End date must be after start date', param: 'end_date' }]
        });
      }

      console.log('📅 Dates being updated:', {
        start_date,
        end_date,
        start_parsed: start_date ? new Date(start_date).toString() : null,
        end_parsed: end_date ? new Date(end_date).toString() : null
      });

      const result = await db.query(`
      UPDATE exams SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        duration = COALESCE($3, duration),
        questions_per_candidate = COALESCE($4, questions_per_candidate),
        pass_mark = COALESCE($5, pass_mark),
        start_date = COALESCE($6, start_date),
        end_date = COALESCE($7, end_date),
        show_results = COALESCE($8, show_results),
        randomize_questions = COALESCE($9, randomize_questions),
        randomize_options = COALESCE($10, randomize_options),
        enforce_screen_lock = COALESCE($11, enforce_screen_lock),
        status = COALESCE($12, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `, [
      title, subject, duration, questions_per_candidate, pass_mark,
      start_date, end_date, show_results, randomize_questions,
      randomize_options, enforce_screen_lock, status, id
    ]);

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.update',
      `Updated exam: ${result.rows[0].title}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// DELETE /api/exams/:id - Delete exam
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(
      'SELECT teacher_id, title FROM exams WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query('DELETE FROM exams WHERE id = $1', [id]);

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.delete',
      `Deleted exam: ${checkResult.rows[0].title}`,
      req.ip
    );

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// POST /api/exams/:id/duplicate - Duplicate exam
router.post('/:id/duplicate', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Get original exam
    const examResult = await client.query(
      'SELECT * FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found' });
    }

    const originalExam = examResult.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && originalExam.teacher_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create duplicate exam
    const newExamResult = await client.query(`
      INSERT INTO exams (
        teacher_id, title, subject, duration, questions_per_candidate,
        total_questions, pass_mark, start_date, end_date, show_results,
        randomize_questions, randomize_options, enforce_screen_lock, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
      RETURNING *
    `, [
      req.user.id,
      `${originalExam.title} (Copy)`,
      originalExam.subject,
      originalExam.duration,
      originalExam.questions_per_candidate,
      originalExam.total_questions,
      originalExam.pass_mark,
      originalExam.start_date,
      originalExam.end_date,
      originalExam.show_results,
      originalExam.randomize_questions,
      originalExam.randomize_options,
      originalExam.enforce_screen_lock
    ]);

    const newExamId = newExamResult.rows[0].id;

    // Duplicate questions
    await client.query(`
      INSERT INTO questions (
        exam_id, subject, difficulty, question_text, option_a, option_b,
        option_c, option_d, correct_answer, points
      )
      SELECT $1, subject, difficulty, question_text, option_a, option_b,
             option_c, option_d, correct_answer, points
      FROM questions
      WHERE exam_id = $2
    `, [newExamId, id]);

    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.duplicate',
      `Duplicated exam: ${originalExam.title}`,
      req.ip
    );

    res.status(201).json(newExamResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Duplicate exam error:', error);
    res.status(500).json({ error: 'Failed to duplicate exam' });
  } finally {
    client.release();
  }
});

// GET /api/exams/:id/candidates - Get exam candidates
router.get('/:id/candidates', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const examResult = await db.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT u.id, u.name, u.email, u.student_id, ec.assigned_at
      FROM exam_candidates ec
      JOIN users u ON ec.candidate_id = u.id
      WHERE ec.exam_id = $1
      ORDER BY u.name
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// POST /api/exams/:id/candidates - Add candidates to exam
router.post('/:id/candidates', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { candidates } = req.body;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Candidates array is required' });
    }

    // Check permission
    const examResult = await client.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process candidates
    const addedCandidates = [];
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    
    // Helper function to generate random password
    const generatePassword = () => {
      return crypto.randomBytes(4).toString('hex'); // 8 character password
    };
    
    for (const candidate of candidates) {
      const { name, email, student_id, password } = candidate;
      
      // Check if user exists
      let userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      let candidateId;
      let candidatePassword = password || generatePassword(); // Use provided password or generate one
      
      if (userResult.rows.length === 0) {
        // Create new candidate user with custom password
        const hashedPassword = await bcrypt.hash(candidatePassword, 10);
        
        const newUserResult = await client.query(`
          INSERT INTO users (name, email, password, role, student_id)
          VALUES ($1, $2, $3, 'candidate', $4)
          RETURNING id
        `, [name, email.toLowerCase(), hashedPassword, student_id]);
        
        candidateId = newUserResult.rows[0].id;
      } else {
        candidateId = userResult.rows[0].id;
        
        // Update password if provided and user already exists
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10);
          await client.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, candidateId]
          );
        }
      }

      // Add to exam_candidates
      try {
        await client.query(`
          INSERT INTO exam_candidates (exam_id, candidate_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [id, candidateId]);
        
        addedCandidates.push({ 
          id: candidateId, 
          name, 
          email, 
          student_id, 
          password: candidatePassword // Return the plain password for teacher to share
        });
      } catch (err) {
        console.log('Candidate already assigned:', email);
      }
    }

    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.add_candidates',
      `Added ${addedCandidates.length} candidates to exam ${id}`,
      req.ip
    );

    res.status(201).json({ message: 'Candidates added successfully', count: addedCandidates.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add candidates error:', error);
    res.status(500).json({ error: 'Failed to add candidates' });
  } finally {
    client.release();
  }
});

// DELETE /api/exams/:id/candidates/:candidateId - Remove candidate from exam
router.delete('/:id/candidates/:candidateId', async (req, res) => {
  try {
    const { id, candidateId } = req.params;
    
    // Check permission
    const examResult = await db.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove candidate from exam
    await db.query(
      'DELETE FROM exam_candidates WHERE exam_id = $1 AND candidate_id = $2',
      [id, candidateId]
    );

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.remove_candidate',
      `Removed candidate ${candidateId} from exam ${id}`,
      req.ip
    );

    res.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Remove candidate error:', error);
    res.status(500).json({ error: 'Failed to remove candidate' });
  }
});

// GET /api/exams/:id/questions - Get exam questions
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const examResult = await db.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT *
      FROM questions
      WHERE exam_id = $1
      ORDER BY id
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/exams/:id/questions - Add or replace questions for exam
router.post('/:id/questions', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { questions, replace = false } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Questions array is required' });
    }

    // Check permission
    const examResult = await client.query(
      'SELECT teacher_id, subject FROM exams WHERE id = $1',
      [id]
    );

    if (examResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    // If replace flag is true, clear existing questions first
    if (replace) {
      await client.query('DELETE FROM questions WHERE exam_id = $1', [id]);
    }

    // Add questions
    for (const question of questions) {
      const {
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        points,
        difficulty,
        subject
      } = question;

      await client.query(`
        INSERT INTO questions (
          exam_id, subject, difficulty, question_text, option_a, option_b,
          option_c, option_d, correct_answer, points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        id,
        subject || examResult.rows[0].subject,
        difficulty || 'medium',
        question_text,
        option_a,
        option_b,
        option_c || null,
        option_d || null,
        correct_answer,
        points || 1
      ]);
    }

    // Update total_questions count
    await client.query(`
      UPDATE exams
      SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id = $1)
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'exam.add_questions',
      `Added ${questions.length} questions to exam ${id}`,
      req.ip
    );

    res.status(201).json({ message: 'Questions added successfully', count: questions.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Add questions error:', error);
    res.status(500).json({ error: 'Failed to add questions' });
  } finally {
    client.release();
  }
});

module.exports = router;

