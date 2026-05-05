================================================================================
  TASKFLOW — Team Task Manager
  Full-Stack Web Application
================================================================================

LIVE URL:      https://team-task-manager-production-59d9.up.railway.app
GITHUB REPO:   https://github.com/yourusername/team-task-manager

--------------------------------------------------------------------------------
OVERVIEW
--------------------------------------------------------------------------------

TaskFlow is a full-stack team task management app where users can create
projects, assign tasks, track progress with role-based access control,
and visualize performance through a dedicated Analytics dashboard.

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

Frontend:
  - React 18 (Vite)
  - React Router v6
  - Axios for HTTP requests
  - Recharts for data visualization
  - date-fns for date formatting

Backend:
  - Node.js + Express
  - PostgreSQL (pg driver)
  - JWT authentication (jsonwebtoken)
  - bcryptjs for password hashing
  - express-validator for input validation

Database:
  - PostgreSQL (Railway plugin)
  - Auto-initializes schema on startup

Deployment:
  - Railway (Node + PostgreSQL)

--------------------------------------------------------------------------------
FEATURES
--------------------------------------------------------------------------------

Authentication:
  - Signup with name, email, password, role (admin/member)
  - Login with JWT token (7-day expiry)
  - Protected routes with auto-redirect
  - Auto-logout on token expiry

Role-Based Access Control (RBAC):
  - Global roles: Admin, Member
  - Project-level roles: Admin, Member
  - Admins can see all projects/users, manage roles
  - Members only see projects they belong to

Projects:
  - Create, view, update (name, description, status), delete
  - Status: active / archived / completed
  - Add/remove team members by email
  - Member roles per project (admin/member)

Tasks:
  - Create tasks inside projects
  - Fields: title, description, priority (low/medium/high),
    status (todo/in_progress/review/done), assignee, due date
  - Filter by status, priority, assignee
  - Edit and delete tasks
  - Overdue detection with visual alerts

Dashboard:
  - Total projects, tasks, in-progress count
  - Overdue task count (highlighted in red)
  - Task status breakdown with progress bars
  - List of overdue tasks with project names

My Tasks page:
  - All tasks assigned to the current user across all projects
  - Update task status inline with dropdown
  - Overdue warning alerts

Analytics page (unique feature):
  - Overall completion rate with gradient progress bar
  - Donut chart — task status breakdown with percentages
  - Bar chart — tasks by priority (high/medium/low)
  - Area chart — tasks created vs completed over last 14 days
  - Per-project progress bars with overdue flags
  - Team workload chart — in progress, done, overdue per member
  - Summary stat cards with color-coded indicators

Admin: Users page:
  - View all registered users
  - Search users by name or email
  - Change user roles (admin / member)

--------------------------------------------------------------------------------
DATABASE SCHEMA
--------------------------------------------------------------------------------

users          — id, name, email, password_hash, role, created_at
projects       — id, name, description, owner_id, status, created_at
project_members — id, project_id, user_id, role, joined_at
tasks          — id, title, description, project_id, assignee_id,
                 created_by, status, priority, due_date, created_at

--------------------------------------------------------------------------------
API ENDPOINTS
--------------------------------------------------------------------------------

Auth:
  POST /api/auth/signup
  POST /api/auth/login
  GET  /api/auth/me

Users (admin only):
  GET  /api/users
  GET  /api/users/search?q=
  PUT  /api/users/:id/role

Projects:
  GET    /api/projects
  POST   /api/projects
  GET    /api/projects/:id
  PUT    /api/projects/:id
  DELETE /api/projects/:id
  POST   /api/projects/:id/members
  DELETE /api/projects/:id/members/:userId

Tasks:
  GET    /api/projects/:id/tasks
  POST   /api/projects/:id/tasks
  PUT    /api/tasks/:id
  DELETE /api/tasks/:id
  GET    /api/tasks/my
  GET    /api/tasks/dashboard

Analytics:
  GET /api/analytics

Health:
  GET /health

--------------------------------------------------------------------------------
LOCAL DEVELOPMENT SETUP
--------------------------------------------------------------------------------

Prerequisites: Node.js 18+, PostgreSQL

1. Clone the repository
   git clone https://github.com/yourusername/team-task-manager
   cd team-task-manager

2. Set up backend environment
   cp backend/.env.example backend/.env
   Edit backend/.env with your PostgreSQL credentials and JWT secret

3. Create the database
   psql -U postgres
   CREATE DATABASE taskmanager;
   \q

4. Install dependencies
   cd backend && npm install
   cd ../frontend && npm install

5. Start development servers (two terminals)
   Terminal 1: cd backend && npm run dev
   Terminal 2: cd frontend && npm run dev

6. Open http://localhost:5173

The database schema initializes automatically when the backend starts.

--------------------------------------------------------------------------------
RAILWAY DEPLOYMENT
--------------------------------------------------------------------------------

1. Push code to GitHub

2. Create a new Railway project
   - Deploy from GitHub repo

3. Add PostgreSQL plugin in Railway dashboard

4. Set environment variables in Railway:
   DATABASE_URL   = (auto-set by Railway PostgreSQL plugin)
   JWT_SECRET     = (generate a strong random string)
   NODE_ENV       = production

5. Set commands in Railway settings:
   Build:  npm run build
   Start:  npm start

6. Generate domain in Railway Settings -> Networking

The app serves the React build as static files from Express in production,
so only one Railway service is needed.

--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

team-task-manager/
├── package.json              Root build scripts
├── railway.toml              Railway config
├── .gitignore
├── README.txt
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js          Express entry point
│       ├── db/
│       │   ├── index.js      PostgreSQL pool
│       │   └── schema.sql    Database schema
│       ├── middleware/
│       │   └── auth.js       JWT + RBAC middleware
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   ├── taskController.js
│       │   ├── userController.js
│       │   └── analyticsController.js
│       └── routes/
│           └── index.js      All API routes
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx            Router + auth guards
        ├── index.css          Global styles
        ├── context/
        │   └── AuthContext.jsx
        ├── utils/
        │   └── api.js         Axios client
        ├── components/
        │   └── Layout.jsx     Sidebar layout
        └── pages/
            ├── LoginPage.jsx
            ├── SignupPage.jsx
            ├── DashboardPage.jsx
            ├── ProjectsPage.jsx
            ├── ProjectDetailPage.jsx
            ├── TasksPage.jsx
            ├── AnalyticsPage.jsx
            └── UsersPage.jsx

--------------------------------------------------------------------------------
DEMO ACCOUNTS (for testing)
--------------------------------------------------------------------------------

Create via signup page. Recommended:
  Admin:  admin@test.com / password123  (role: admin)
  Member: member@test.com / password123 (role: member)

================================================================================
