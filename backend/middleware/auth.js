const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user is teacher or admin
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Teacher or admin access required' });
  }
  next();
};

// Check if user is candidate
const requireCandidate = (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({ error: 'Candidate access required' });
  }
  next();
};

// Log activity for audit
const logActivity = async (userId, userName, action, details, ipAddress) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, user_name, action, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [userId, userName, action, details, ipAddress]
    );
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  requireCandidate,
  logActivity
};

