const { pool } = require('../db');

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const projectFilter = isAdmin
      ? ''
      : `AND (p.owner_id = '${userId}' OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = '${userId}'))`;

    const statusBreakdown = await pool.query(`
      SELECT t.status, COUNT(*) as count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1 ${projectFilter}
      GROUP BY t.status
      ORDER BY count DESC
    `);

    const priorityBreakdown = await pool.query(`
      SELECT t.priority, COUNT(*) as count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1 ${projectFilter}
      GROUP BY t.priority
    `);

    const tasksOverTime = await pool.query(`
      SELECT
        DATE(t.created_at) as date,
        COUNT(*) as created,
        COUNT(*) FILTER (WHERE t.status = 'done') as completed
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.created_at >= NOW() - INTERVAL '14 days'
      ${projectFilter}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `);

    const projectProgress = await pool.query(`
      SELECT
        p.id,
        p.name,
        COUNT(t.id) as total,
        COUNT(t.id) FILTER (WHERE t.status = 'done') as done,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress,
        COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') as overdue
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE 1=1 ${projectFilter}
      GROUP BY p.id, p.name
      ORDER BY total DESC
      LIMIT 8
    `);

    const teamWorkload = await pool.query(`
      SELECT
        u.name,
        u.id,
        COUNT(t.id) as total,
        COUNT(t.id) FILTER (WHERE t.status = 'done') as done,
        COUNT(t.id) FILTER (WHERE t.status = 'in_progress') as in_progress,
        COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') as overdue
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      ${isAdmin ? '' : `WHERE u.id IN (
        SELECT DISTINCT user_id FROM project_members WHERE project_id IN (
          SELECT id FROM projects WHERE owner_id = '${userId}'
          UNION
          SELECT project_id FROM project_members WHERE user_id = '${userId}'
        )
      )`}
      GROUP BY u.id, u.name
      HAVING COUNT(t.id) > 0
      ORDER BY total DESC
      LIMIT 8
    `);

    const totals = await pool.query(`
      SELECT
        COUNT(DISTINCT p.id) as projects,
        COUNT(t.id) as tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'done') as completed,
        COUNT(t.id) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') as overdue,
        ROUND(
          CASE WHEN COUNT(t.id) > 0
            THEN COUNT(t.id) FILTER (WHERE t.status = 'done') * 100.0 / COUNT(t.id)
            ELSE 0
          END, 1
        ) as completion_rate
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE 1=1 ${projectFilter}
    `);

    res.json({
      statusBreakdown: statusBreakdown.rows,
      priorityBreakdown: priorityBreakdown.rows,
      tasksOverTime: tasksOverTime.rows,
      projectProgress: projectProgress.rows,
      teamWorkload: teamWorkload.rows,
      totals: totals.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };