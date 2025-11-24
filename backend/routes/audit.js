const express = require('express');
const db = require('../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/audit-logs - List audit logs
router.get('/', async (req, res) => {
  try {
    const { user_id, action, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT *
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      params.push(user_id);
      query += ` AND user_id = $${params.length}`;
    }

    if (action) {
      params.push(`%${action}%`);
      query += ` AND action ILIKE $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    
    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;
    
    params.push(parseInt(offset));
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM audit_logs');
    
    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;

