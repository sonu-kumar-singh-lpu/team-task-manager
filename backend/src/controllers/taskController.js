const { validationResult } = require('express-validator');
const { pool } = require('../db');

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee } = req.query;

    let conditions = ['t.project_id = $1'];
    let params = [projectId];
    let idx = 2;

    if (status) { conditions.push(`t.status = $${idx++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${idx++}`); params.push(priority); }
    if (assignee) { conditions.push(`t.assignee_id = $${idx++}`); params.push(assignee); }

    const result = await pool.query(
      `SELECT t.*,
         u_assignee.name AS assignee_name, u_assignee.email AS assignee_email,
         u_creator.name AS creator_name
       FROM tasks t
       LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
       LEFT JOIN users u_creator ON t.created_by = u_creator.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      params
    );

    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/my  — tasks assigned to current user
const getMyTasks = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, p.name AS project_name,
         u_creator.name AS creator_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN users u_creator ON t.created_by = u_creator.id
       WHERE t.assignee_id = $1
       ORDER BY
         CASE WHEN t.due_date < NOW() AND t.status != 'done' THEN 0 ELSE 1 END,
         t.due_date ASC NULLS LAST`,
      [req.user.id]
    );
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/dashboard — summary stats
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projectFilter = isAdmin ? '' : `AND (p.owner_id = '${userId}' OR pm.user_id = '${userId}')`;

    const stats = await pool.query(
      `SELECT
         COUNT(DISTINCT p.id) AS total_projects,
         COUNT(t.id) AS total_tasks,
         COUNT(t.id) FILTER (WHERE t.status = 'todo') AS todo,
         COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress,
         COUNT(t.id) FILTER (WHERE t.status = 'review') AS review,
         COUNT(t.id) FILTER (WHERE t.status = 'done') AS done,
         COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') AS overdue
       FROM projects p
       LEFT JOIN tasks t ON t.project_id = p.id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       WHERE 1=1 ${isAdmin ? '' : `AND (p.owner_id = $1 OR pm.user_id = $1)`}`,
      isAdmin ? [] : [userId]
    );

    const overdueTasks = await pool.query(
      `SELECT t.*, p.name AS project_name, u.name AS assignee_name
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       LEFT JOIN project_members pm ON pm.project_id = p.id
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.due_date < NOW() AND t.status != 'done'
       ${isAdmin ? '' : 'AND (p.owner_id = $1 OR pm.user_id = $1)'}
       ORDER BY t.due_date ASC LIMIT 10`,
      isAdmin ? [] : [userId]
    );

    res.json({ stats: stats.rows[0], overdueTasks: overdueTasks.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { projectId } = req.params;
    const { title, description, assignee_id, priority = 'medium', due_date } = req.body;

    // Validate assignee is a project member
    if (assignee_id) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, assignee_id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a project member' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, project_id, assignee_id, created_by, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, projectId, assignee_id || null, req.user.id, priority, due_date || null]
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:taskId
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { taskId } = req.params;
    const { title, description, assignee_id, status, priority, due_date } = req.body;

    const result = await pool.query(
      `UPDATE tasks SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         assignee_id = COALESCE($3, assignee_id),
         status = COALESCE($4, status),
         priority = COALESCE($5, priority),
         due_date = COALESCE($6, due_date)
       WHERE id = $7 RETURNING *`,
      [title, description, assignee_id, status, priority, due_date, taskId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:taskId
const deleteTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [taskId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getMyTasks, getDashboard, createTask, updateTask, deleteTask };
