const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, requireAdmin, logActivity } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ==========================================
// CANDIDATE ROUTES (Must come before /:id)
// ==========================================

// POST /api/teachers/candidates/bulk-delete - Bulk delete candidates
router.post('/candidates/bulk-delete', async (req, res) => {
  const client = await db.getClient();
  try {
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ error: 'Candidate IDs array is required' });
    }

    await client.query('BEGIN');

    // Make sure we only delete candidates
    await client.query('DELETE FROM users WHERE id = ANY($1::int[]) AND role = $2', [candidateIds, 'candidate']);
    
    await client.query('COMMIT');

    await logActivity(
      req.user.id,
      req.user.name,
      'candidate.bulk_delete',
      `Deleted ${candidateIds.length} candidates`,
      req.ip
    );

    res.json({ message: 'Candidates deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk delete candidates error:', error);
    res.status(500).json({ error: 'Failed to delete candidates' });
  } finally {
    client.release();
  }
});

// GET /api/teachers/candidates/all - Get all candidates
router.get('/candidates/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.student_id,
        u.is_active,
        u.created_at,
        COUNT(DISTINCT ec.exam_id) as exam_count,
        COUNT(DISTINCT ea.id) as attempts_count
      FROM users u
      LEFT JOIN exam_candidates ec ON u.id = ec.candidate_id
      LEFT JOIN exam_attempts ea ON u.id = ea.candidate_id
      WHERE u.role = 'candidate'
      GROUP BY u.id, u.name, u.email, u.student_id, u.is_active, u.created_at
      ORDER BY u.created_at DESC
    `);

    // Ensure count fields are returned as numbers
    const candidates = result.rows.map(candidate => ({
      ...candidate,
      exam_count: parseInt(candidate.exam_count) || 0,
      attempts_count: parseInt(candidate.attempts_count) || 0
    }));

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// PUT /api/teachers/candidates/:id - Update candidate
router.put('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, password } = req.body;

    // Check if candidate exists
    const existingCandidate = await db.query(
      'SELECT id, email, student_id FROM users WHERE id = $1 AND role = \'candidate\'',
      [id]
    );

    if (existingCandidate.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // If email is being changed, check if it's already taken by another user
    if (email && email.toLowerCase() !== existingCandidate.rows[0].email) {
      const emailCheck = await db.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email.toLowerCase(), id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Validate student_id is provided (cannot be empty for candidates)
    if (student_id !== undefined && (!student_id || student_id.trim() === '')) {
      return res.status(400).json({ error: 'Student ID cannot be empty' });
    }

    let updateQuery = 'UPDATE users SET ';
    const params = [];
    const updates = [];

    if (name) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (email) {
      params.push(email.toLowerCase());
      updates.push(`email = $${params.length}`);
    }

    if (student_id !== undefined) {
      params.push(student_id);
      updates.push(`student_id = $${params.length}`);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(hashedPassword);
      updates.push(`password = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    updateQuery += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`;
    updateQuery += ' RETURNING id, name, email, student_id, is_active, created_at';

    const result = await db.query(updateQuery, params);

    await logActivity(
      req.user.id,
      req.user.name,
      'candidate.update',
      `Updated candidate: ${result.rows[0].email}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// POST /api/teachers/candidates/:id/toggle-status - Toggle candidate active status
router.post('/candidates/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    const existingCandidate = await db.query(
      'SELECT id, name, email, is_active FROM users WHERE id = $1 AND role = \'candidate\'',
      [id]
    );

    if (existingCandidate.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const newStatus = !existingCandidate.rows[0].is_active;

    await db.query(
      'UPDATE users SET is_active = $1 WHERE id = $2',
      [newStatus, id]
    );

    await logActivity(
      req.user.id,
      req.user.name,
      'candidate.status_change',
      `${newStatus ? 'Activated' : 'Deactivated'} candidate: ${existingCandidate.rows[0].email}`,
      req.ip
    );

    res.json({ message: `Candidate ${newStatus ? 'activated' : 'deactivated'} successfully`, is_active: newStatus });
  } catch (error) {
    console.error('Toggle candidate status error:', error);
    res.status(500).json({ error: 'Failed to toggle candidate status' });
  }
});

// ==========================================
// TEACHER ROUTES
// ==========================================

// GET /api/teachers - List all teachers
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id, name, email, role, is_active, created_at,
        (SELECT COUNT(*) FROM exams WHERE teacher_id = users.id) as exam_count
      FROM users
      WHERE role IN ('teacher', 'admin')
      ORDER BY created_at DESC
    `);

    // Ensure exam_count is returned as a number
    const teachers = result.rows.map(teacher => ({
      ...teacher,
      exam_count: parseInt(teacher.exam_count) || 0
    }));

    res.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// GET /api/teachers/:id - Get single teacher
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT 
        id, name, email, role, is_active, created_at,
        (SELECT COUNT(*) FROM exams WHERE teacher_id = users.id) as exam_count
      FROM users
      WHERE id = $1 AND role IN ('teacher', 'admin')
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = result.rows[0];
    // Ensure exam_count is returned as a number
    teacher.exam_count = parseInt(teacher.exam_count) || 0;

    res.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// POST /api/teachers - Create teacher
router.post('/',
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    try {
      console.log('Attempting to create teacher with data:', { 
        name: req.body.name, 
        email: req.body.email,
        hasPassword: !!req.body.password 
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        console.log('Email already exists:', email);
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create teacher
      const result = await db.query(`
        INSERT INTO users (name, email, password, role, is_active)
        VALUES ($1, $2, $3, 'teacher', true)
        RETURNING id, name, email, role, is_active, created_at
      `, [name, email.toLowerCase(), hashedPassword]);

      await logActivity(
        req.user.id,
        req.user.name,
        'teacher.create',
        `Created teacher account: ${email}`,
        req.ip
      );

      console.log('Teacher created successfully:', result.rows[0].email);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create teacher error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      res.status(500).json({ error: 'Failed to create teacher', details: error.message });
    }
  }
);

// PUT /api/teachers/:id - Update teacher
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Check if teacher exists
    const existingTeacher = await db.query(
      'SELECT id FROM users WHERE id = $1 AND role IN (\'teacher\', \'admin\')',
      [id]
    );

    if (existingTeacher.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    let updateQuery = 'UPDATE users SET ';
    const params = [];
    const updates = [];

    if (name) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }

    if (email) {
      params.push(email.toLowerCase());
      updates.push(`email = $${params.length}`);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(hashedPassword);
      updates.push(`password = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    updateQuery += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`;
    updateQuery += ' RETURNING id, name, email, role, is_active, created_at';

    const result = await db.query(updateQuery, params);

    await logActivity(
      req.user.id,
      req.user.name,
      'teacher.update',
      `Updated teacher ID: ${id}`,
      req.ip
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// POST /api/teachers/:id/deactivate - Deactivate teacher
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot deactivate yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Check if teacher exists
    const existingTeacher = await db.query(
      'SELECT name, email FROM users WHERE id = $1 AND role IN (\'teacher\', \'admin\')',
      [id]
    );

    if (existingTeacher.rows.length === 0) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    await db.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );

    await logActivity(
      req.user.id,
      req.user.name,
      'teacher.deactivate',
      `Deactivated teacher: ${existingTeacher.rows[0].email}`,
      req.ip
    );

    res.json({ message: 'Teacher deactivated successfully' });
  } catch (error) {
    console.error('Deactivate teacher error:', error);
    res.status(500).json({ error: 'Failed to deactivate teacher' });
  }
});

module.exports = router;
