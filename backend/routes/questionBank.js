const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireTeacher, logActivity } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireTeacher);

// GET /api/question-bank - List questions from question bank
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    
    let query = `
      SELECT q.*, e.title as exam_title
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE 1=1
    `;
    const params = [];

    // Teachers only see questions from their exams
    if (req.user.role === 'teacher') {
      params.push(req.user.id);
      query += ` AND e.teacher_id = $${params.length}`;
    }

    if (subject) {
      params.push(subject);
      query += ` AND q.subject = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      query += ` AND q.difficulty = $${params.length}`;
    }

    query += ' ORDER BY q.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get question bank error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// GET /api/question-bank/:id - Get single question
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT q.*, e.title as exam_title, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = result.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && question.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

// POST /api/question-bank - Create question
router.post('/',
  body('question_text').trim().notEmpty().withMessage('Question text is required'),
  body('option_a').trim().notEmpty().withMessage('Option A is required'),
  body('option_b').trim().notEmpty().withMessage('Option B is required'),
  body('correct_answer').isIn(['A', 'B', 'C', 'D']).withMessage('Valid correct answer required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        exam_id,
        subject,
        difficulty,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        points
      } = req.body;

      // If exam_id provided, check permission
      if (exam_id) {
        const examResult = await db.query(
          'SELECT teacher_id FROM exams WHERE id = $1',
          [exam_id]
        );

        if (examResult.rows.length === 0) {
          return res.status(404).json({ error: 'Exam not found' });
        }

        if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      const result = await db.query(`
        INSERT INTO questions (
          exam_id, subject, difficulty, question_text, option_a, option_b,
          option_c, option_d, correct_answer, points
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        exam_id || null,
        subject,
        difficulty || 'medium',
        question_text,
        option_a,
        option_b,
        option_c || null,
        option_d || null,
        correct_answer,
        points || 1
      ]);

      await logActivity(
        req.user.id,
        req.user.name,
        'question.create',
        `Created question: ${question_text.substring(0, 50)}...`,
        req.ip
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ error: 'Failed to create question' });
    }
  }
);

// PUT /api/question-bank/:id - Update question
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(`
      SELECT q.*, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      subject,
      difficulty,
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      points
    } = req.body;

    const result = await db.query(`
      UPDATE questions SET
        subject = COALESCE($1, subject),
        difficulty = COALESCE($2, difficulty),
        question_text = COALESCE($3, question_text),
        option_a = COALESCE($4, option_a),
        option_b = COALESCE($5, option_b),
        option_c = COALESCE($6, option_c),
        option_d = COALESCE($7, option_d),
        correct_answer = COALESCE($8, correct_answer),
        points = COALESCE($9, points),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `, [
      subject, difficulty, question_text, option_a, option_b,
      option_c, option_d, correct_answer, points, id
    ]);

    await logActivity(
      req.user.id,
      req.user.name,
      'question.update',
      `Updated question ID: ${id}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /api/question-bank/:id - Delete question
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission
    const checkResult = await db.query(`
      SELECT q.*, e.teacher_id
      FROM questions q
      LEFT JOIN exams e ON q.exam_id = e.id
      WHERE q.id = $1
    `, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (req.user.role === 'teacher' && checkResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.query('DELETE FROM questions WHERE id = $1', [id]);

    await logActivity(
      req.user.id,
      req.user.name,
      'question.delete',
      `Deleted question ID: ${id}`,
      req.ip
    );

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// POST /api/question-bank/bulk-import - Bulk import questions
router.post('/bulk-import', async (req, res) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Questions array is required' });
    }

    let imported = 0;

    for (const question of questions) {
      try {
        await client.query(`
          INSERT INTO questions (
            exam_id, subject, difficulty, question_text, option_a, option_b,
            option_c, option_d, correct_answer, points
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          question.exam_id || null,
          question.subject,
          question.difficulty || 'medium',
          question.question_text,
          question.option_a,
          question.option_b,
          question.option_c || null,
          question.option_d || null,
          question.correct_answer,
          question.points || 1
        ]);
        imported++;
      } catch (err) {
        console.log('Failed to import question:', err.message);
      }
    }

    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'question.bulk_import',
      `Imported ${imported} questions`,
      req.ip
    );

    res.status(201).json({
      message: 'Questions imported successfully',
      imported,
      total: questions.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
  } finally {
    client.release();
  }
});

module.exports = router;

