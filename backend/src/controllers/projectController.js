const { validationResult } = require('express-validator');
const { pool } = require('../db');

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    let query, params;
    if (isAdmin) {
      query = `
        SELECT p.*, u.name AS owner_name,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        ORDER BY p.created_at DESC`;
      params = [];
    } else {
      query = `
        SELECT p.*, u.name AS owner_name, pm.role AS my_role,
          (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) AS task_count,
          (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) AS member_count
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        WHERE p.owner_id = $1 OR pm.user_id = $1
        ORDER BY p.created_at DESC`;
      params = [userId];
    }

    const result = await pool.query(query, params);
    res.json({ projects: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:projectId
const getProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT p.*, u.name AS owner_name FROM projects p
       JOIN users u ON p.owner_id = u.id WHERE p.id = $1`,
      [projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

    const members = await pool.query(
      `SELECT pm.role, pm.joined_at, u.id, u.name, u.email
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [projectId]
    );

    res.json({ project: result.rows[0], members: members.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const ownerId = req.user.id;

    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ownerId]
    );

    // Auto-add owner as admin member
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [result.rows[0].id, ownerId, 'admin']
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId
const updateProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    const { name, description, status } = req.body;

    const result = await pool.query(
      `UPDATE projects SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        status = COALESCE($3, status)
       WHERE id = $4 RETURNING *`,
      [name, description, status, projectId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/members
const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role = 'member' } = req.body;

    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = userResult.rows[0];

    try {
      await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, user.id, role]
      );
    } catch (e) {
      if (e.code === '23505') return res.status(409).json({ error: 'User already a member' });
      throw e;
    }

    res.status(201).json({ message: 'Member added', user, role });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/members/:userId
const removeMember = async (req, res, next) => {
  try {
    const { projectId, userId } = req.params;
    await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember };
