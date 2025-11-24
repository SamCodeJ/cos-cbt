const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken, logActivity } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/login - Login
router.post('/login',
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const result = await db.query(
        'SELECT id, name, email, password, role, is_active FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check if account is active
      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user.id, user.role);

      // Log activity
      await logActivity(user.id, user.name, 'user.login', 'User logged in', req.ip);

      // Return user data (without password)
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// POST /api/auth/logout - Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await logActivity(req.user.id, req.user.name, 'user.logout', 'User logged out', req.ip);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, student_id, profile_picture, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// PUT /api/auth/profile - Update own profile
router.put('/profile',
  authenticateToken,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email } = req.body;

      // Check if email is being changed and if it already exists
      if (email) {
        const emailCheck = await db.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), req.user.id]
        );

        if (emailCheck.rows.length > 0) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Build dynamic update query
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

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      params.push(req.user.id);
      updateQuery += updates.join(', ') + `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`;
      updateQuery += ' RETURNING id, name, email, role, student_id, profile_picture, created_at';

      const result = await db.query(updateQuery, params);

      await logActivity(
        req.user.id,
        req.user.name,
        'profile.update',
        'Updated own profile',
        req.ip
      );

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// POST /api/auth/upload-profile-picture - Upload profile picture
router.post('/upload-profile-picture',
  authenticateToken,
  upload.single('profile_picture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Get user's current profile picture
      const userResult = await db.query(
        'SELECT profile_picture FROM users WHERE id = $1',
        [req.user.id]
      );

      // Delete old profile picture if exists
      if (userResult.rows.length > 0 && userResult.rows[0].profile_picture) {
        const oldFilePath = path.join(__dirname, '..', userResult.rows[0].profile_picture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Store relative path in database
      const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;

      // Update user's profile picture
      const result = await db.query(
        'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, student_id, profile_picture, created_at',
        [profilePicturePath, req.user.id]
      );

      await logActivity(
        req.user.id,
        req.user.name,
        'profile.picture_update',
        'Updated profile picture',
        req.ip
      );

      res.json({
        message: 'Profile picture uploaded successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      // Delete uploaded file if database update fails
      if (req.file) {
        const filePath = path.join(__dirname, '../uploads/profile-pictures', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
);

// DELETE /api/auth/profile-picture - Delete profile picture
router.delete('/profile-picture', authenticateToken, async (req, res) => {
  try {
    // Get user's current profile picture
    const userResult = await db.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profilePicture = userResult.rows[0].profile_picture;

    if (!profilePicture) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', profilePicture);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update database
    const result = await db.query(
      'UPDATE users SET profile_picture = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, student_id, profile_picture, created_at',
      [req.user.id]
    );

    await logActivity(
      req.user.id,
      req.user.name,
      'profile.picture_delete',
      'Deleted profile picture',
      req.ip
    );

    res.json({
      message: 'Profile picture deleted successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

// PUT /api/auth/password - Change own password
router.put('/password',
  authenticateToken,
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { current_password, new_password } = req.body;

      // Get current password hash
      const userResult = await db.query(
        'SELECT password FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(current_password, userResult.rows[0].password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);

      // Update password
      await db.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, req.user.id]
      );

      await logActivity(
        req.user.id,
        req.user.name,
        'password.change',
        'Changed own password',
        req.ip
      );

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;

