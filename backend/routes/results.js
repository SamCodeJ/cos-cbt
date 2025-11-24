const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireTeacher } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and teacher role
router.use(authenticateToken);
router.use(requireTeacher);

// GET /api/results - List results
router.get('/', async (req, res) => {
  try {
    const { exam_id } = req.query;
    
    let query = `
      SELECT 
        ea.*,
        u.name as candidate_name,
        u.email as candidate_email,
        u.student_id,
        e.title as exam_title,
        e.subject as exam_subject,
        e.pass_mark
      FROM exam_attempts ea
      JOIN users u ON ea.candidate_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.status IN ('submitted', 'auto_submitted')
    `;
    const params = [];

    // Teachers only see results from their exams
    if (req.user.role === 'teacher') {
      params.push(req.user.id);
      query += ` AND e.teacher_id = $${params.length}`;
    }

    if (exam_id) {
      params.push(exam_id);
      query += ` AND ea.exam_id = $${params.length}`;
    }

    query += ' ORDER BY ea.submitted_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// GET /api/results/:id - Get single result with detailed breakdown
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get result
    const resultQuery = await db.query(`
      SELECT 
        ea.*,
        u.name as candidate_name,
        u.email as candidate_email,
        u.student_id,
        e.title as exam_title,
        e.subject as exam_subject,
        e.pass_mark,
        e.teacher_id
      FROM exam_attempts ea
      JOIN users u ON ea.candidate_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.id = $1
    `, [id]);

    if (resultQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = resultQuery.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && result.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get answers
    const answersQuery = await db.query(`
      SELECT 
        ans.id,
        ans.answer,
        ans.is_correct,
        ans.answered_at,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.points
      FROM exam_answers ans
      JOIN questions q ON ans.question_id = q.id
      WHERE ans.attempt_id = $1
      ORDER BY q.id
    `, [id]);

    // Get violations
    const violationsQuery = await db.query(`
      SELECT *
      FROM exam_violations
      WHERE attempt_id = $1
      ORDER BY timestamp
    `, [id]);

    res.json({
      ...result,
      answers: answersQuery.rows,
      violations: violationsQuery.rows
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

// GET /api/results/exam/:examId - Get results by exam
router.get('/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    // Check permission
    const examResult = await db.query(
      'SELECT teacher_id FROM exams WHERE id = $1',
      [examId]
    );

    if (examResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && examResult.rows[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(`
      SELECT 
        ea.*,
        u.name as candidate_name,
        u.email as candidate_email,
        u.student_id
      FROM exam_attempts ea
      JOIN users u ON ea.candidate_id = u.id
      WHERE ea.exam_id = $1 AND ea.status IN ('submitted', 'auto_submitted')
      ORDER BY ea.score_percentage DESC
    `, [examId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get exam results error:', error);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// GET /api/results/:id/transcript - Generate PDF transcript
router.get('/:id/transcript', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get result data (reuse the detailed GET endpoint logic)
    const resultQuery = await db.query(`
      SELECT 
        ea.*,
        u.name as candidate_name,
        u.email as candidate_email,
        u.student_id,
        e.title as exam_title,
        e.subject as exam_subject,
        e.pass_mark,
        e.teacher_id
      FROM exam_attempts ea
      JOIN users u ON ea.candidate_id = u.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE ea.id = $1
    `, [id]);

    if (resultQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = resultQuery.rows[0];

    // Check permission
    if (req.user.role === 'teacher' && result.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For now, return JSON (PDF generation would require jsPDF on server)
    // In production, you'd generate an actual PDF here
    res.json({
      message: 'Transcript data (PDF generation not implemented in this demo)',
      data: result
    });
    
    // TODO: Implement actual PDF generation using jsPDF or similar library
  } catch (error) {
    console.error('Get transcript error:', error);
    res.status(500).json({ error: 'Failed to generate transcript' });
  }
});

module.exports = router;

