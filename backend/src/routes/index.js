const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { signup, login, getMe } = require('../controllers/authController');
const { getProjects, getProject, createProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');
const { getTasks, getMyTasks, getDashboard, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getUsers, updateUserRole, searchUsers } = require('../controllers/userController');
const { getAnalytics } = require('../controllers/analyticsController');
const { authenticate, requireAdmin, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

// ── Auth routes ──────────────────────────────────────────────────────────────
router.post('/auth/signup', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], signup);

router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.get('/auth/me', authenticate, getMe);

// ── User routes ───────────────────────────────────────────────────────────────
router.get('/users', authenticate, requireAdmin, getUsers);
router.get('/users/search', authenticate, searchUsers);
router.put('/users/:userId/role', authenticate, requireAdmin, updateUserRole);

// ── Dashboard & My Tasks ──────────────────────────────────────────────────────
router.get('/tasks/dashboard', authenticate, getDashboard);
router.get('/tasks/my', authenticate, getMyTasks);

// ── Project routes ────────────────────────────────────────────────────────────
router.get('/projects', authenticate, getProjects);
router.post('/projects', authenticate, [
  body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Project name required'),
], createProject);

router.get('/projects/:projectId', authenticate, requireProjectMember, getProject);
router.put('/projects/:projectId', authenticate, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 2, max: 200 }),
  body('status').optional().isIn(['active', 'archived', 'completed']),
], updateProject);
router.delete('/projects/:projectId', authenticate, requireProjectAdmin, deleteProject);

// Project members
router.post('/projects/:projectId/members', authenticate, requireProjectAdmin, addMember);
router.delete('/projects/:projectId/members/:userId', authenticate, requireProjectAdmin, removeMember);

// ── Task routes ───────────────────────────────────────────────────────────────
router.get('/projects/:projectId/tasks', authenticate, requireProjectMember, getTasks);
router.post('/projects/:projectId/tasks', authenticate, requireProjectMember, [
  body('title').trim().isLength({ min: 2, max: 300 }).withMessage('Task title required'),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isISO8601(),
], createTask);

router.put('/tasks/:taskId', authenticate, updateTask);
router.delete('/tasks/:taskId', authenticate, deleteTask);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', authenticate, getAnalytics);

module.exports = router;