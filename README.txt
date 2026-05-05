================================================================================
  TASKFLOW — Team Task Manager
  Full-Stack Web Application
================================================================================

LIVE URL:      https://your-app.up.railway.app  (update after deploy)
GITHUB REPO:   https://github.com/yourusername/team-task-manager

--------------------------------------------------------------------------------
OVERVIEW
--------------------------------------------------------------------------------

TaskFlow is a full-stack team task management app where users can create
projects, assign tasks, and track progress with role-based access control.

--------------------------------------------------------------------------------
TECH STACK
--------------------------------------------------------------------------------

Frontend:
  - React 18 (Vite)
  - React Router v6
  - Axios for HTTP requests
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

Role-Based Access Control (RBAC):
  - Global roles: Admin, Member
  - Project-level roles: Admin, Member
  - Admins can see all projects/users, manage roles
  - Members only see projects they belong to

Projects:
  - Create, view, update (name, description, status), delete
  - Status: active / archived / completed
  - Add/remove team members with email
  - Member roles per project

Tasks:
  - Create tasks inside projects
  - Fields: title, description, priority (low/medium/high),
    status (todo/in_progress/review/done), assignee, due date
  - Filter by status, priority, assignee
  - Edit and delete tasks

Dashboard:
  - Total projects, tasks, in-progress count
  - Overdue task count (highlighted in red)
  - Task status breakdown with progress bars
  - List of overdue tasks

My Tasks page:
  - See all tasks assigned to the current user across all projects
  - Update task status inline
  - Overdue warning alerts

Admin: Users page:
  - View all registered users
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
   # Edit backend/.env with your local PostgreSQL credentials and JWT secret

3. Install dependencies
   cd backend && npm install
   cd ../frontend && npm install

4. Start development servers (two terminals)
   Terminal 1: cd backend && npm run dev
   Terminal 2: cd frontend && npm run dev

5. Open http://localhost:5173

The database schema initializes automatically when the backend starts.

--------------------------------------------------------------------------------
RAILWAY DEPLOYMENT
--------------------------------------------------------------------------------

1. Push code to GitHub

2. Create a new Railway project
   railway login
   railway init

3. Add a PostgreSQL plugin in Railway dashboard

4. Set environment variables in Railway:
   DATABASE_URL   = (auto-set by Railway PostgreSQL plugin)
   JWT_SECRET     = (generate a strong random string)
   NODE_ENV       = production
   PORT           = (auto-set by Railway)

5. Set build command in Railway:
   Build:  npm run build
   Start:  npm start

6. Deploy
   git push origin main
   # Railway auto-deploys on push

The app serves the React build as static files from Express in production,
so only one Railway service is needed.

--------------------------------------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------------------------------------

team-task-manager/
├── package.json              Root build scripts
├── railway.toml              Railway config
├── .gitignore
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
│       │   └── userController.js
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
            └── UsersPage.jsx

--------------------------------------------------------------------------------
DEMO ACCOUNTS (for testing)
--------------------------------------------------------------------------------

Create via signup page. Recommended:
  Admin:  admin@test.com / password123  (role: admin)
  Member: member@test.com / password123 (role: member)

================================================================================
