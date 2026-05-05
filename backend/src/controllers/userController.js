const { pool } = require('../db');

// GET /api/users — admin only
const getUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:userId/role — admin only
const updateUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/search?q=email — for adding members
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const result = await pool.query(
      `SELECT id, name, email FROM users
       WHERE email ILIKE $1 OR name ILIKE $1
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateUserRole, searchUsers };
