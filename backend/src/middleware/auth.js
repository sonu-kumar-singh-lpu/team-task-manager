const jwt = require('jsonwebtoken');
const { pool } = require('../db');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
};

// Require global admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Require project-level admin role
const requireProjectAdmin = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Global admins bypass project-level check
    if (req.user.role === 'admin') return next();

    const result = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not a project member' });
    }
    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Project admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Require project membership (any role)
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.project_id;
    const userId = req.user.id;

    if (req.user.role === 'admin') return next();

    // Check if owner or member
    const result = await pool.query(
      `SELECT 1 FROM projects WHERE id = $1 AND owner_id = $2
       UNION
       SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not a project member' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireAdmin, requireProjectAdmin, requireProjectMember };
