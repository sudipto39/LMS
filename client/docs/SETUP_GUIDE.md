# GiteaForge — How to Connect Frontend to Backend (Simple Guide)

> This is a plain English guide for developers. No jargon. Just steps.

---

## What You Have Right Now

The frontend (this project) is a **complete UI** that currently runs on **fake/mock data**.
It looks real but doesn't talk to any server yet. All the data you see (users, projects,
milestones, activity) is hardcoded in `src/data.ts`.

To make it **actually work**, you need 3 things running:

```
1. MongoDB        — stores all your data (users, projects, etc.)
2. Express Server — your backend API that the frontend talks to
3. Gitea Server   — hosts the Git repositories (self-hosted GitHub alternative)
```

The frontend already has all the API calling code written and ready.
It just needs a real backend to talk to.

---

## The Big Picture (How It All Connects)

```
   YOUR BROWSER                YOUR SERVER
┌────────────────┐       ┌──────────────────┐
│                │       │                  │
│  React App     │──────▶│  Express API     │──────▶ MongoDB (data)
│  (this code)   │ HTTP  │  (you build)     │
│  Port 5173     │       │  Port 5000       │──────▶ Gitea (repos)
│                │       │                  │        Port 3000
└────────────────┘       └──────────────────┘
```

- The React app makes HTTP requests (GET, POST, etc.) to the Express server
- The Express server reads/writes data in MongoDB
- When a student creates a project, Express also calls Gitea to create a Git repo
- When someone pushes code to Gitea, Gitea sends a webhook to Express

---

## Step-by-Step Setup

### STEP 1: Install MongoDB

**Option A: Local install**
```bash
# Mac
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

**Option B: Use Docker (easier)**
```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

**Option C: Use MongoDB Atlas (cloud — free tier)**
- Go to https://cloud.mongodb.com
- Create a free cluster
- Get the connection string like: `mongodb+srv://user:pass@cluster.mongodb.net/giteaforge`

**How to verify it works:**
```bash
# If installed locally:
mongosh
# You should see a prompt. Type "show dbs" to see databases.
```

---

### STEP 2: Install Gitea

**Using Docker (recommended):**
```bash
docker run -d \
  --name gitea \
  -p 3000:3000 \
  -p 2222:22 \
  -v gitea_data:/data \
  gitea/gitea:latest
```

**Then set it up:**
1. Open http://localhost:3000 in your browser
2. It shows a setup page. Keep defaults, click "Install Gitea"
3. Create an admin account (remember the username/password)
4. After login, go to: Settings → Applications → Generate Token
5. Copy that token — you'll need it later
6. Create an Organization (e.g., "institute") — this is where all student repos go

**How to verify it works:**
- Open http://localhost:3000 — you should see the Gitea dashboard

---

### STEP 3: Create the Backend (Express Server)

Create a new folder for your backend:

```bash
mkdir giteaforge-backend
cd giteaforge-backend
npm init -y
```

Install packages:
```bash
npm install express mongoose dotenv cors helmet morgan
npm install bcryptjs jsonwebtoken
npm install express-validator
npm install multer
npm install axios
npm install uuid slugify
npm install -D nodemon
```

Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/giteaforge
JWT_SECRET=pick-a-long-random-string-here-abc123xyz
JWT_EXPIRES_IN=24h
GITEA_BASE_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=paste-your-gitea-token-here
GITEA_ORG_NAME=institute
FRONTEND_URL=http://localhost:5173
```

Create the main server file `index.js`:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Allow frontend to talk to this server
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Your routes will go here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/projects', require('./routes/projects'));
// ... etc

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'GiteaForge API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Add to `package.json` scripts:
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

Start it:
```bash
npm run dev
```

**How to verify it works:**
- Open http://localhost:5000/api/health
- You should see: `{"status":"ok","message":"GiteaForge API is running"}`

---

### STEP 4: Connect Frontend to Backend

In the frontend project (this project), the `.env` file already has:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

That's it. The frontend is already configured to talk to `localhost:5000`.

**What's already done for you in the frontend:**

| File | What it does |
|------|-------------|
| `src/api/client.ts` | Sets up HTTP requests, automatically adds the login token to every request |
| `src/api/auth.ts` | Functions to call login, register, logout endpoints |
| `src/api/projects.ts` | Functions to call all project-related endpoints |
| `src/api/users.ts` | Functions to call user management endpoints |
| `src/api/gitea.ts` | Functions to call Gitea-related endpoints |
| `src/api/admin.ts` | Functions to call admin endpoints |
| `src/hooks/useAuth.ts` | React hook for login/logout state |
| `src/hooks/useAPI.ts` | React hook for loading data with loading/error states |

---

### STEP 5: Build Backend Routes (What the Backend Dev Needs to Do)

The backend developer needs to create API endpoints that match what the frontend expects.
Here's exactly what each endpoint should do:

#### 5A. Authentication Routes

**POST /api/auth/login**
- Frontend sends: `{ email: "rahul@ignou.ac.in", password: "mypassword" }`
- Backend should:
  1. Find user in MongoDB by email
  2. Check if password matches (use bcryptjs to compare)
  3. Create a JWT token
  4. Send back: `{ token: "jwt...", refreshToken: "...", user: { _id, name, email, role } }`

**POST /api/auth/register**
- Frontend sends: `{ name, email, password, role, enrollmentId, department, batch }`
- Backend should:
  1. Check email doesn't already exist
  2. Hash the password with bcryptjs
  3. Save user to MongoDB
  4. Send back: `{ message: "Account created", user: {...} }`

**GET /api/auth/me**
- Frontend sends: JWT token in header (automatic — client.ts does this)
- Backend should:
  1. Verify the JWT token
  2. Find the user in MongoDB
  3. Send back the user object (without password)

**POST /api/auth/logout**
- Frontend sends: `{ refreshToken }`
- Backend should: remove that refresh token from the user's stored tokens

#### 5B. Project Routes

**GET /api/projects**
- Automatically filters by role:
  - If student: only return their projects
  - If professor: only return projects assigned to them
  - If admin: return all projects
- Supports query params: `?status=in_progress&batch=BCA-2024&page=1&limit=20`
- Send back: `{ data: [...projects], total: 5, page: 1, totalPages: 1 }`

**POST /api/projects**
- Frontend sends: `{ title, description, batch, course, professorId, techStack, repoOption }`
- Backend should:
  1. Save project to MongoDB
  2. If `repoOption === 'create_new'`:
     - Call Gitea API to create a private repo
     - Add student as collaborator (write access)
     - Add professor as collaborator (read access)
     - Save repo URL back to the project
  3. Send back the created project

**GET /api/projects/:id**
- Find project by ID, populate student and professor names
- Send back the project object

**POST /api/projects/:id/submit**
- Change project status to "submitted"
- Set submittedAt timestamp

**POST /api/projects/:id/approve**
- Professor approves. Change status to "approved"
- Optionally save grade and comment

**POST /api/projects/:id/reject**
- Professor rejects. Change status to "rejected"
- Save the rejection comment

#### 5C. Milestone Routes

**GET /api/projects/:id/milestones**
- Return all milestones for that project

**POST /api/projects/:id/milestones**
- Create a new milestone: `{ title, description, dueDate, order }`

**POST /api/projects/:id/milestones/:mid/complete**
- Student marks as completed (status → "completed", set completedAt)

**POST /api/projects/:id/milestones/:mid/approve**
- Professor approves milestone (status → "approved")

**POST /api/projects/:id/milestones/:mid/reject**
- Professor rejects milestone (status → "rejected", save comment)

#### 5D. Feedback Routes

**GET /api/projects/:id/feedback**
- Return all comments for that project, sorted by date

**POST /api/projects/:id/feedback**
- Add a comment: `{ content: "Great work on..." }`
- Save who wrote it (from JWT token)

#### 5E. File Upload Routes

**POST /api/projects/:id/files**
- Accept file upload (use multer middleware)
- Save file to `./uploads/` folder
- Save file info to MongoDB (name, size, type, path)

**GET /api/projects/:id/files**
- Return list of uploaded files for that project

#### 5F. User Management Routes (Admin only)

**GET /api/users**
- Return all users (paginated)
- Support filters: `?role=student&batch=BCA-2024`

**POST /api/users**
- Admin creates a user
- Optionally create matching Gitea account

**POST /api/users/bulk-import**
- Accept CSV file upload
- Parse CSV and create users in bulk

#### 5G. Gitea Routes

**GET /api/gitea/repos/:owner/:repo/commits**
- Backend calls Gitea API: `GET /api/v1/repos/:owner/:repo/commits`
- Forward the response to the frontend

**POST /api/webhooks/gitea**
- Gitea calls this when someone pushes code
- Verify the webhook signature
- Save the push event to MongoDB
- Update the project's `lastPush` timestamp

#### 5H. Admin Routes

**GET /api/admin/dashboard**
- Return counts: total users, projects, active projects, etc.

**GET /api/admin/batches**
- Return all batches

**POST /api/admin/batches**
- Create a new batch

**GET /api/admin/audit-logs**
- Return system logs (who did what, when)

---

### STEP 6: Replace Mock Data with Real API Calls

Once the backend is running, you need to change the frontend screens to use
real data instead of mock data. Here's how:

**Current code (using fake data):**
```typescript
// In StudentDashboard component
import { mockProjects } from '@/data';

function StudentDashboard() {
  const studentProjects = mockProjects.filter(p => p.studentId === 'u1');
  return <ProjectTable projects={studentProjects} />;
}
```

**Change it to (using real API):**
```typescript
// In StudentDashboard component
import { useAPI } from '@/hooks/useAPI';
import { projectsAPI } from '@/api';

function StudentDashboard() {
  const { data, loading, error } = useAPI(
    () => projectsAPI.getAll({ status: 'in_progress' })
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <ProjectTable projects={data.data} />;
}
```

**For the login page, change:**
```typescript
// Current: just sets a role and navigates
const handleLogin = (role) => { setRole(role); setPage('dashboard'); };

// Change to: actually call the API
import { useAuth } from '@/hooks/useAuth';

function Login() {
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async () => {
    try {
      const user = await login(email, password);
      // user.role will be 'student', 'professor', or 'admin'
      // Navigate to the right dashboard
    } catch (err) {
      // Show error message
    }
  };
}
```

**Do this screen by screen:**
1. Start with Login (most important — everything else needs auth)
2. Then Dashboard (GET /api/projects)
3. Then Create Project (POST /api/projects)
4. Then Project Detail (GET /api/projects/:id)
5. Then everything else

---

### STEP 7: Set Up the Gitea Webhook

This makes it so the system knows when a student pushes code.

1. In your backend, create a route: `POST /api/webhooks/gitea`
2. In Gitea, go to the Organization → Settings → Webhooks → Add Webhook
3. Set the URL to: `http://your-server:5000/api/webhooks/gitea`
4. Set Content Type to: `application/json`
5. Set a Secret (same as your GITEA_WEBHOOK_SECRET in .env)
6. Select events: Push, Create, Pull Request
7. Click "Add Webhook"

Now when anyone pushes code, Gitea will call your backend, and your backend
can save the push event and update the project's "last push" time.

---

### STEP 8: Deploy Everything

For a college/institute server, the simplest setup:

**Using Docker Compose (recommended):**

Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  gitea:
    image: gitea/gitea:latest
    volumes:
      - gitea_data:/data
    ports:
      - "3000:3000"
      - "2222:22"

  backend:
    build: ./giteaforge-backend
    environment:
      - MONGODB_URI=mongodb://mongo:27017/giteaforge
      - GITEA_BASE_URL=http://gitea:3000
    ports:
      - "5000:5000"
    depends_on:
      - mongo
      - gitea

  frontend:
    build: ./giteaforge-frontend
    ports:
      - "80:80"

volumes:
  mongo_data:
  gitea_data:
```

Then just run:
```bash
docker-compose up -d
```

Everything starts up and connects to each other automatically.

**Put an Nginx reverse proxy in front for HTTPS:**
- `projects.college.edu` → frontend (port 80)
- `projects.college.edu/api` → backend (port 5000)
- `git.college.edu` → Gitea (port 3000)

---

## Quick Reference: What Calls What

```
FRONTEND                    BACKEND                     DATABASE/GITEA
────────                    ───────                     ──────────────

User clicks "Login"    →    POST /api/auth/login    →   Check MongoDB users
                       ←    { token, user }         ←   Return user data

User opens Dashboard   →    GET /api/projects       →   Query MongoDB projects
                       ←    { data: [...] }         ←   Return filtered list

Student creates project →   POST /api/projects      →   Save to MongoDB
                                                    →   Call Gitea: create repo
                       ←    { project with repo }   ←   Return created project

Student pushes code    →    (goes to Gitea directly via git push)
Gitea sends webhook    →    POST /api/webhooks/gitea →  Save push event to MongoDB
                                                    →   Update project.lastPush

Professor opens project →   GET /api/projects/:id   →   Query MongoDB
                       ←    { project details }     ←   Return project

Professor approves     →    POST /api/projects/:id/approve → Update MongoDB
                       ←    { updated project }     ←   Return updated project
```

---

## Common Mistakes to Avoid

1. **CORS errors**: Make sure your backend has `cors({ origin: 'http://localhost:5173' })`
2. **JWT not sent**: The frontend client (`src/api/client.ts`) automatically adds it — just make sure you store the token in localStorage after login
3. **Gitea connection fails**: Make sure the Gitea URL in your .env is reachable from the backend server (not from the browser)
4. **Webhook not working**: The webhook URL must be reachable by the Gitea server (use internal network IP, not localhost if they're on different machines)
5. **File uploads fail**: Make sure the `uploads/` folder exists and has write permissions
6. **MongoDB connection string**: If using Docker, use the container name (`mongo`) not `localhost`

---

## Files You Don't Need to Touch

These frontend files are already done and work:
- `src/api/*` — All API service files (ready to call your backend)
- `src/hooks/*` — React hooks for auth and data fetching
- `src/components/*` — All UI components
- `.env` — Already configured for localhost:5000

---

## Files the Backend Dev Needs to Create

```
giteaforge-backend/
├── index.js              ← Main server file
├── .env                  ← Environment variables
├── package.json          ← Dependencies
├── models/
│   ├── User.js           ← User schema (name, email, password, role)
│   ├── Project.js        ← Project schema (title, status, repo info)
│   ├── Milestone.js      ← Milestone schema (title, due date, status)
│   ├── Feedback.js       ← Comment schema (author, content)
│   ├── PushEvent.js      ← Webhook data (commits, branch)
│   └── AuditLog.js       ← System logs
├── routes/
│   ├── auth.js           ← Login, register, logout
│   ├── projects.js       ← CRUD + milestones + feedback
│   ├── users.js          ← User management (admin)
│   ├── gitea.js          ← Gitea proxy routes
│   ├── admin.js          ← Admin dashboard, batches
│   └── webhooks.js       ← Gitea webhook receiver
├── middleware/
│   ├── auth.js           ← JWT verification
│   └── roleGuard.js      ← Role checking
├── services/
│   └── giteaService.js   ← Gitea API wrapper (axios calls)
└── uploads/              ← Uploaded files go here
```

---

## That's It!

The order to build things:
1. MongoDB + basic Express server (30 min)
2. User model + auth routes (login/register) (2 hours)
3. Project model + CRUD routes (2 hours)
4. Connect frontend login to real API (30 min)
5. Connect frontend dashboard to real API (1 hour)
6. Gitea integration (2 hours)
7. Webhooks (1 hour)
8. File uploads (1 hour)
9. Admin routes (2 hours)
10. Testing and bug fixes (ongoing)

Total estimated time for a backend dev: **2-3 days** for a working prototype.

The detailed technical docs with all schemas, controller code, and Gitea service
code are in `BACKEND_API_DOCS.md`.
