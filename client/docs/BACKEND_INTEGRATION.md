# GiteaForge — Backend Integration Guide

> **For backend developers.** This explains exactly what the frontend sends, 
> what it expects back, and how to wire everything together.

---

## How the Frontend Works Now

The frontend uses a **smart data service** (`src/services/dataService.ts`) that:

1. **Tries the real API** at `VITE_API_BASE_URL` (default: `http://localhost:5000/api`)
2. **Falls back to mock data** if the API is unreachable
3. **Remembers** if the API is down and retries every 30 seconds

This means the frontend **works without a backend** (demo mode) but automatically 
uses real data **the moment a backend is available**. No code changes needed.

---

## What You Need to Build

### Express Server with these routes:

```
POST   /api/auth/login              → Login
POST   /api/auth/register           → Register
GET    /api/auth/me                 → Get current user from JWT
POST   /api/auth/logout             → Invalidate refresh token
POST   /api/auth/refresh            → Get new access token
POST   /api/auth/forgot-password    → Send reset email
POST   /api/auth/reset-password     → Reset with token

GET    /api/projects                → List projects (role-filtered)
GET    /api/projects/:id            → Get project detail
POST   /api/projects                → Create project + Gitea repo
PATCH  /api/projects/:id            → Update project
DELETE /api/projects/:id            → Delete project
POST   /api/projects/:id/submit     → Submit for review
POST   /api/projects/:id/approve    → Approve (professor)
POST   /api/projects/:id/reject     → Reject (professor)

GET    /api/projects/:id/milestones             → List milestones
POST   /api/projects/:id/milestones             → Create milestone
PATCH  /api/projects/:id/milestones/:mid        → Update milestone
POST   /api/projects/:id/milestones/:mid/complete → Mark complete
POST   /api/projects/:id/milestones/:mid/approve  → Approve (prof)
POST   /api/projects/:id/milestones/:mid/reject   → Reject (prof)

GET    /api/projects/:id/progress   → Get progress history
POST   /api/projects/:id/progress   → Update progress

GET    /api/projects/:id/feedback   → Get comments
POST   /api/projects/:id/feedback   → Add comment

GET    /api/projects/:id/files      → List uploaded files
POST   /api/projects/:id/files      → Upload file (multipart)
DELETE /api/projects/:id/files/:fid → Delete file

GET    /api/users                   → List users (admin)
POST   /api/users                   → Create user (admin)
PATCH  /api/users/:id               → Update user
DELETE /api/users/:id               → Delete user
POST   /api/users/bulk-import       → CSV import (admin)
GET    /api/users/professors        → List professors (dropdown)
PATCH  /api/users/profile           → Update own profile
PATCH  /api/users/change-password   → Change own password

GET    /api/gitea/activity          → Push events from webhooks
GET    /api/gitea/repos/:o/:r/commits → Proxy Gitea commits
GET    /api/gitea/settings          → Gitea config (admin)
PATCH  /api/gitea/settings          → Update Gitea config
POST   /api/gitea/test-connection   → Test Gitea connection
POST   /api/webhooks/gitea          → Receive Gitea webhooks

GET    /api/admin/dashboard         → System stats
GET    /api/admin/batches           → List batches
POST   /api/admin/batches           → Create batch
GET    /api/admin/audit-logs        → System logs

GET    /api/chat/conversations                      → List chats
GET    /api/chat/conversations/:id/messages          → Get messages
POST   /api/chat/conversations/:id/messages          → Send message
POST   /api/chat/conversations/:id/attachments       → Send file
PUT    /api/chat/conversations/:id/read              → Mark as read
GET    /api/chat/unread-count                        → Unread total
POST   /api/chat/conversations                       → Create conversation
```

---

## Exact Request/Response Formats

### 1. POST /api/auth/login

**Frontend sends:**
```json
{
  "email": "rahul@ignou.ac.in",
  "password": "mypassword123"
}
```

**Backend must return:**
```json
{
  "token": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Rahul Sharma",
    "email": "rahul@ignou.ac.in",
    "role": "student",
    "giteaUsername": "rahul",
    "giteaLinked": true
  }
}
```

The frontend stores `token` in `localStorage.giteaforge_token` and sends it 
as `Authorization: Bearer <token>` on every subsequent request.

---

### 2. GET /api/projects

**Frontend sends:** JWT token in header + optional query params:
```
GET /api/projects?status=in_progress&batch=BCA-2024&page=1&limit=20
```

**Role-based filtering:**
- Student: backend MUST only return projects where `student._id === req.user._id`
- Professor: only return projects where `professor._id === req.user._id`  
- Admin: return all

**Backend must return:**
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "E-Commerce Platform",
      "description": "A full-stack e-commerce application...",
      "status": "in_progress",
      "student": { "_id": "u1", "name": "Rahul Sharma", "email": "rahul@ignou.ac.in" },
      "professor": { "_id": "u4", "name": "Dr. Anita Desai", "email": "anita@ignou.ac.in" },
      "batch": "BCA-2024",
      "course": "BCA",
      "techStack": ["React", "Node.js", "MongoDB"],
      "repoUrl": "https://gitea.ignou.local/rahul/ecommerce",
      "repoName": "ecommerce",
      "progress": 65,
      "deadline": "2025-03-15",
      "lastPush": "2 hours ago",
      "createdAt": "2024-11-01T00:00:00Z",
      "updatedAt": "2025-01-10T00:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 3. POST /api/projects

**Frontend sends:**
```json
{
  "title": "My New Project",
  "description": "Project description here",
  "batch": "BCA-2024",
  "course": "BCA-2024",
  "professorId": "507f1f77bcf86cd799439011",
  "techStack": ["React", "Node.js"],
  "repoOption": "create_new",
  "existingRepoUrl": null
}
```

**When `repoOption` is `"create_new"`**, the backend must:
1. Create project in MongoDB
2. Call Gitea API to create a private repo
3. Add student as collaborator (write)
4. Add professor as collaborator (read)
5. Save repo URL back to project
6. Return created project

**When `repoOption` is `"link_existing"`**, save the `existingRepoUrl` as `repoUrl`.

---

### 4. POST /api/projects/:id/feedback

**Frontend sends:**
```json
{
  "content": "Great progress on the authentication module!"
}
```

**Backend must return:**
```json
{
  "_id": "new-feedback-id",
  "projectId": "project-id",
  "author": { "_id": "u4", "name": "Dr. Anita Desai", "role": "professor" },
  "content": "Great progress on the authentication module!",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

The frontend uses this for the **feedback thread** — both students and professors 
can post comments. It's like a simple chat within the project detail page.

---

### 5. Chat Endpoints

#### GET /api/chat/conversations

**Returns all conversations for the logged-in user:**
```json
[
  {
    "_id": "conv1",
    "participants": [
      { "_id": "u1", "name": "Rahul Sharma", "role": "student" },
      { "_id": "u4", "name": "Dr. Anita Desai", "role": "professor" }
    ],
    "project": { "_id": "p1", "title": "E-Commerce Platform" },
    "lastMessage": { "text": "Please update the progress report", "sender": "u4", "createdAt": "2025-01-15T16:00:00Z" },
    "unreadCount": 2,
    "createdAt": "2024-11-01T00:00:00Z",
    "updatedAt": "2025-01-15T16:00:00Z"
  }
]
```

#### POST /api/chat/conversations/:id/messages

**Frontend sends:**
```json
{
  "text": "I have pushed the updated code.",
  "type": "text"
}
```

**Backend must return:**
```json
{
  "_id": "msg123",
  "conversationId": "conv1",
  "sender": { "_id": "u1", "name": "Rahul Sharma", "role": "student" },
  "text": "I have pushed the updated code.",
  "type": "text",
  "read": false,
  "createdAt": "2025-01-15T16:05:00Z"
}
```

**The frontend sends messages optimistically** — it shows the message immediately 
in the UI and calls the API in the background. If the API fails, the message is 
still shown (it was added locally).

#### WebSocket (Optional but Recommended)

For real-time chat, add a WebSocket server:

```javascript
// Backend WebSocket events:
// Client → Server:
//   { type: "authenticate", token: "jwt..." }
//   { type: "typing", conversationId: "conv1" }
//
// Server → Client:
//   { type: "new_message", message: { ... } }
//   { type: "message_read", messageId: "msg123" }
//   { type: "user_online", userId: "u1" }
//   { type: "user_offline", userId: "u1" }
//   { type: "typing", conversationId: "conv1", userId: "u4" }
```

---

### 6. POST /api/projects/:id/approve

**Frontend sends:**
```json
{
  "grade": "A",
  "comment": "Excellent work on the implementation"
}
```

---

### 7. Admin Dashboard Stats

#### GET /api/admin/dashboard

**Returns:**
```json
{
  "totalStudents": 45,
  "totalProfessors": 8,
  "totalProjects": 52,
  "activeProjects": 28,
  "submittedProjects": 12,
  "approvedProjects": 10,
  "reposCreated": 40,
  "giteaStatus": "connected"
}
```

---

### 8. Gitea Test Connection

#### POST /api/gitea/test-connection

**Backend calls** `GET {GITEA_URL}/api/v1/version` with admin token.

**Returns:**
```json
{
  "success": true,
  "version": "1.21.0",
  "message": "Connection successful"
}
```

---

## Error Response Format

All errors should return:
```json
{
  "message": "Human-readable error message",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

The frontend's API client (`src/api/client.ts`) maps HTTP status codes:
| Status | Frontend Shows |
|--------|---------------|
| 401    | "Session expired. Please log in again." → redirects to login |
| 403    | "You do not have permission for this action." |
| 404    | "The requested resource was not found." |
| 422    | Shows validation errors from `errors` array |
| 429    | "Too many requests. Please try again later." |
| 500    | "A server error occurred. Please try again later." |

---

## MongoDB Schemas (Quick Reference)

```javascript
// User
{ name, email, password(hashed), role(student|professor|admin), 
  enrollmentId, department, batch, giteaUsername, giteaToken, giteaLinked,
  isActive, lastLogin, refreshTokens[] }

// Project
{ title, description, status(draft|in_progress|submitted|approved|rejected),
  student(ref:User), professor(ref:User), teamMembers[ref:User],
  batch, course, techStack[], repoUrl, repoName, repoOwner, giteaRepoId,
  cloneUrl, sshUrl, progress(0-100), deadline, lastPush, grade, gradeComment,
  submittedAt, approvedAt }

// Milestone
{ project(ref:Project), title, description, dueDate,
  status(pending|in_progress|completed|approved|rejected),
  completedAt, professorComment, order }

// Feedback
{ project(ref:Project), author(ref:User), content }

// ProjectFile
{ project(ref:Project), filename, originalName, mimeType, size,
  uploadedBy(ref:User), path }

// PushEvent (from Gitea webhooks)
{ project(ref:Project), repo, branch, 
  commits[{sha, message, author, url}], pusher }

// Conversation
{ participants[ref:User], project(ref:Project), lastMessage, unreadCounts }

// Message
{ conversation(ref:Conversation), sender(ref:User), text, type, 
  fileName, fileSize, fileUrl, read }

// Batch
{ name, year, course, department, professors[ref:User], 
  students[ref:User], isActive }

// AuditLog
{ action, user(ref:User), targetType, targetId, details, ip }

// GiteaSettings (singleton)
{ baseUrl, adminToken(encrypted), orgName, defaultTeamPermission,
  webhookSecret(encrypted), webhookConfigured, connectionStatus }
```

---

## How to Start

```bash
mkdir giteaforge-backend && cd giteaforge-backend
npm init -y
npm install express mongoose dotenv cors helmet bcryptjs jsonwebtoken multer axios slugify
npm install -D nodemon

# Create .env
echo 'PORT=5000
MONGODB_URI=mongodb://localhost:27017/giteaforge
JWT_SECRET=change-this-to-random-string
GITEA_BASE_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=your-gitea-token
FRONTEND_URL=http://localhost:5173' > .env

# Start
npx nodemon index.js
```

The frontend will automatically detect the backend at `localhost:5000` and start 
using real data instead of mock data. No frontend code changes needed.

---

## JWT Authentication Flow

```
1. User submits email + password
2. Backend verifies credentials, generates JWT + refresh token
3. Frontend stores both in localStorage
4. Every API request includes: Authorization: Bearer <jwt>
5. On 401: frontend tries POST /api/auth/refresh with refresh token
6. If refresh fails: frontend clears storage, redirects to login
```

---

## Gitea Webhook Flow

```
1. Student pushes code to Gitea repo
2. Gitea sends POST /api/webhooks/gitea with:
   - X-Gitea-Signature header (HMAC-SHA256)
   - JSON body with push event data
3. Backend verifies signature
4. Backend creates PushEvent document
5. Backend updates project.lastPush
6. Frontend picks up new activity on next page load
```

---

## File Uploads

The frontend sends files as `multipart/form-data` with field name `"file"`.

Allowed types: PDF, PPT, PPTX, ZIP, PNG, JPEG, TXT
Max size: 25 MB

Backend should:
1. Use `multer` for handling multipart uploads
2. Store files in `./uploads/` directory
3. Generate UUID filenames
4. Save metadata to ProjectFile collection
5. Serve files at `GET /uploads/:filename`
