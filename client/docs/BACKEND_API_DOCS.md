# GiteaForge — Backend API Documentation

> **Complete guide for backend developers** to build the Express.js + MongoDB + Gitea API server
> that powers the GiteaForge frontend.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project Structure](#3-project-structure)
4. [Environment Variables](#4-environment-variables)
5. [Database Models (MongoDB/Mongoose)](#5-database-models)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Endpoints — Complete Reference](#7-api-endpoints)
   - [Auth Routes](#71-auth-routes)
   - [User Routes](#72-user-routes)
   - [Project Routes](#73-project-routes)
   - [Gitea Integration Routes](#74-gitea-integration-routes)
   - [Admin Routes](#75-admin-routes)
8. [Gitea Server Integration](#8-gitea-server-integration)
9. [Webhook Handler](#9-webhook-handler)
10. [File Upload Handling](#10-file-upload-handling)
11. [Middleware Reference](#11-middleware-reference)
12. [Error Handling](#12-error-handling)
13. [Frontend ↔ Backend Data Flow](#13-frontend--backend-data-flow)
14. [Deployment Checklist](#14-deployment-checklist)

---

## 1. Architecture Overview

```
┌────────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│                    │     │                   │     │                  │
│  React Frontend    │────▶│  Express Backend  │────▶│  MongoDB         │
│  (Vite + TS)       │ API │  (Node.js)        │     │  (Mongoose)      │
│  Port: 5173        │     │  Port: 5000       │     │  Port: 27017     │
│                    │     │                   │     │                  │
└────────────────────┘     └───────┬───────────┘     └──────────────────┘
                                   │
                                   │ Gitea API
                                   ▼
                           ┌───────────────────┐
                           │                   │
                           │  Gitea Server     │
                           │  (Self-hosted)    │
                           │  Port: 3000       │
                           │                   │
                           └───────────────────┘
```

### Request Flow
1. Frontend makes API call to Express backend (JWT in Authorization header)
2. Backend validates JWT, checks role permissions
3. Backend queries MongoDB for data
4. For repo operations, backend calls Gitea API using admin/user token
5. Gitea sends webhook events back to backend on push/PR events
6. Backend stores webhook data and frontend polls or uses WebSocket for updates

---

## 2. Tech Stack & Dependencies

```bash
# Initialize backend project
mkdir giteaforge-backend && cd giteaforge-backend
npm init -y

# Core
npm install express mongoose dotenv cors helmet morgan

# Auth
npm install bcryptjs jsonwebtoken passport passport-local

# Validation
npm install express-validator joi

# File upload
npm install multer

# Gitea API calls
npm install axios

# Utilities
npm install uuid slugify csv-parser archiver

# Dev
npm install -D nodemon typescript @types/node @types/express ts-node
```

---

## 3. Project Structure

```
giteaforge-backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # MongoDB connection
│   │   ├── gitea.ts           # Gitea API client config
│   │   └── env.ts             # Environment variable validation
│   ├── models/
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Milestone.ts
│   │   ├── ProgressUpdate.ts
│   │   ├── Feedback.ts
│   │   ├── ProjectFile.ts
│   │   ├── Batch.ts
│   │   ├── Course.ts
│   │   ├── AuditLog.ts
│   │   ├── GiteaSettings.ts
│   │   └── PushEvent.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── gitea.ts
│   │   └── admin.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── projectController.ts
│   │   ├── giteaController.ts
│   │   └── adminController.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── roleGuard.ts       # Role-based access
│   │   ├── validate.ts        # Request validation
│   │   ├── errorHandler.ts    # Global error handler
│   │   └── auditLog.ts        # Automatic audit logging
│   ├── services/
│   │   ├── giteaService.ts    # Gitea API wrapper
│   │   ├── emailService.ts    # Email notifications (optional)
│   │   └── webhookService.ts  # Webhook processing
│   ├── utils/
│   │   ├── apiError.ts        # Custom error class
│   │   └── helpers.ts
│   ├── webhooks/
│   │   └── giteaWebhook.ts   # POST /api/webhooks/gitea
│   └── app.ts                 # Express app setup
├── uploads/                   # Uploaded files directory
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 4. Environment Variables

Create a `.env` file in the backend root:

```env
# ─── Server ───
PORT=5000
NODE_ENV=development

# ─── MongoDB ───
MONGODB_URI=mongodb://localhost:27017/giteaforge

# ─── JWT ───
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-change-this
JWT_REFRESH_EXPIRES_IN=7d

# ─── Gitea ───
GITEA_BASE_URL=http://localhost:3000
GITEA_ADMIN_TOKEN=your-gitea-admin-api-token
GITEA_ORG_NAME=institute
GITEA_WEBHOOK_SECRET=your-webhook-secret

# ─── Frontend URL (for CORS) ───
FRONTEND_URL=http://localhost:5173

# ─── File Uploads ───
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50MB

# ─── Email (optional) ───
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@institute.edu
SMTP_PASS=email-password
```

---

## 5. Database Models

### 5.1 User Model

```typescript
// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;           // bcrypt hashed
  role: 'student' | 'professor' | 'admin';
  enrollmentId?: string;      // student enrollment number
  department?: string;
  batch?: string;
  giteaUsername?: string;
  giteaToken?: string;        // encrypted, user's Gitea personal access token
  giteaLinked: boolean;
  isActive: boolean;
  lastLogin?: Date;
  refreshTokens: string[];    // stored hashed refresh tokens
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password:      { type: String, required: true, minlength: 6 },
  role:          { type: String, enum: ['student', 'professor', 'admin'], required: true },
  enrollmentId:  { type: String, sparse: true },
  department:    { type: String },
  batch:         { type: String },
  giteaUsername:  { type: String },
  giteaToken:    { type: String },  // encrypt with crypto
  giteaLinked:   { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  lastLogin:     { type: Date },
  refreshTokens: [{ type: String }],
}, { timestamps: true });

// Hash password before save
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
```

### 5.2 Project Model

```typescript
// models/Project.ts
const ProjectSchema = new Schema({
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'submitted', 'approved', 'rejected'],
    default: 'draft'
  },
  student:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  professor:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teamMembers:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  batch:        { type: String, required: true },
  course:       { type: String, required: true },
  techStack:    [{ type: String }],

  // Gitea integration
  repoUrl:      { type: String },    // https://gitea.institute.edu/org/repo
  repoName:     { type: String },    // repo slug
  repoOwner:    { type: String },    // org or user
  giteaRepoId:  { type: Number },    // Gitea's internal repo ID
  cloneUrl:     { type: String },    // https clone URL
  sshUrl:       { type: String },    // ssh clone URL

  progress:     { type: Number, default: 0, min: 0, max: 100 },
  deadline:     { type: Date },
  lastPush:     { type: Date },
  grade:        { type: String },    // e.g., "A", "B+", "85/100"
  gradeComment: { type: String },
  submittedAt:  { type: Date },
  approvedAt:   { type: Date },
}, { timestamps: true });

// Index for efficient queries
ProjectSchema.index({ student: 1, status: 1 });
ProjectSchema.index({ professor: 1, status: 1 });
ProjectSchema.index({ batch: 1, course: 1 });
```

### 5.3 Milestone Model

```typescript
// models/Milestone.ts
const MilestoneSchema = new Schema({
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  title:       { type: String, required: true },
  description: { type: String },
  dueDate:     { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  completedAt:       { type: Date },
  professorComment:  { type: String },
  order:             { type: Number, default: 0 },
}, { timestamps: true });
```

### 5.4 Other Models

```typescript
// models/ProgressUpdate.ts
const ProgressUpdateSchema = new Schema({
  project:     { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  percentage:  { type: Number, required: true, min: 0, max: 100 },
  note:        { type: String },
  commitCount: { type: Number, default: 0 },
  weekStart:   { type: Date },
}, { timestamps: true });

// models/Feedback.ts
const FeedbackSchema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  author:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, { timestamps: true });

// models/ProjectFile.ts
const ProjectFileSchema = new Schema({
  project:      { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  filename:     { type: String, required: true },  // stored filename (uuid)
  originalName: { type: String, required: true },  // original filename
  mimeType:     { type: String },
  size:         { type: Number },
  uploadedBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  path:         { type: String, required: true },  // file system path
}, { timestamps: true });

// models/PushEvent.ts  (populated from Gitea webhooks)
const PushEventSchema = new Schema({
  project:   { type: Schema.Types.ObjectId, ref: 'Project' },
  repo:      { type: String, required: true },
  branch:    { type: String },
  commits:   [{
    sha:     { type: String },
    message: { type: String },
    author:  { type: String },
    url:     { type: String },
  }],
  pusher:    { type: String },
  giteaEventId: { type: String },
}, { timestamps: true });

// models/Batch.ts
const BatchSchema = new Schema({
  name:         { type: String, required: true },
  year:         { type: Number, required: true },
  course:       { type: String, required: true },
  department:   { type: String },
  professors:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  students:     [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

// models/Course.ts
const CourseSchema = new Schema({
  code:       { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  department: { type: String },
  credits:    { type: Number },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

// models/AuditLog.ts
const AuditLogSchema = new Schema({
  action:     { type: String, required: true },  // e.g., 'user.login'
  user:       { type: Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String },
  targetId:   { type: Schema.Types.ObjectId },
  details:    { type: String },
  ip:         { type: String },
}, { timestamps: true });

// models/GiteaSettings.ts  (singleton — only one document)
const GiteaSettingsSchema = new Schema({
  baseUrl:              { type: String, required: true },
  adminToken:           { type: String },  // encrypted
  orgName:              { type: String, default: 'institute' },
  defaultTeamPermission:{ type: String, default: 'write' },
  webhookSecret:        { type: String },  // encrypted
  webhookConfigured:    { type: Boolean, default: false },
  connectionStatus:     { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
  lastConnectionTest:   { type: Date },
}, { timestamps: true });
```

---

## 6. Authentication & Authorization

### 6.1 JWT Strategy

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * Verify JWT token from Authorization header.
 * Attaches user object to req.user
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
```

### 6.2 Role Guard

```typescript
// middleware/roleGuard.ts
/**
 * Usage: router.get('/admin/users', authenticate, roleGuard('admin'), getUsers)
 */
export const roleGuard = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 6.3 Token Generation

```typescript
// In authController.ts
const generateTokens = (userId: string) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { token, refreshToken };
};
```

---

## 7. API Endpoints

### 7.1 Auth Routes

| Method | Endpoint | Body | Response | Auth | Description |
|--------|----------|------|----------|------|-------------|
| `POST` | `/api/auth/login` | `{ email, password }` | `{ token, refreshToken, user }` | No | Login with email/password |
| `POST` | `/api/auth/login/gitea` | — | `{ redirectUrl }` | No | Start Gitea OAuth flow |
| `POST` | `/api/auth/login/gitea/callback` | `{ code, state }` | `{ token, refreshToken, user }` | No | Complete Gitea OAuth |
| `POST` | `/api/auth/register` | `{ name, email, password, role, ... }` | `{ message, user }` | No* | Register new account (*or admin-only) |
| `POST` | `/api/auth/logout` | `{ refreshToken }` | `{ message }` | Yes | Invalidate refresh token |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | `{ token }` | No | Get new access token |
| `POST` | `/api/auth/forgot-password` | `{ email }` | `{ message }` | No | Send reset email |
| `POST` | `/api/auth/reset-password` | `{ token, newPassword }` | `{ message }` | No | Reset password with token |
| `GET`  | `/api/auth/me` | — | `User` | Yes | Get current user profile |

**Controller logic for `POST /api/auth/login`:**
```typescript
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email, isActive: true });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  // 2. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  // 3. Generate tokens
  const { token, refreshToken } = generateTokens(user._id);

  // 4. Store hashed refresh token
  user.refreshTokens.push(await bcrypt.hash(refreshToken, 10));
  user.lastLogin = new Date();
  await user.save();

  // 5. Audit log
  await AuditLog.create({
    action: 'user.login',
    user: user._id,
    ip: req.ip,
  });

  // 6. Return response
  res.json({
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      giteaUsername: user.giteaUsername,
      giteaLinked: user.giteaLinked,
    },
  });
};
```

---

### 7.2 User Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/users` | Yes | Admin | List all users (paginated, filterable) |
| `GET` | `/api/users/:id` | Yes | Admin | Get user by ID |
| `POST` | `/api/users` | Yes | Admin | Create user (+ optionally create Gitea user) |
| `PATCH` | `/api/users/:id` | Yes | Admin | Update user |
| `DELETE` | `/api/users/:id` | Yes | Admin | Deactivate user |
| `POST` | `/api/users/bulk-import` | Yes | Admin | Import users from CSV |
| `GET` | `/api/users/professors` | Yes | Any | List professors (for dropdowns) |
| `GET` | `/api/users/students` | Yes | Admin/Prof | List students |
| `POST` | `/api/users/:id/link-gitea` | Yes | Self/Admin | Link Gitea account |
| `PATCH` | `/api/users/profile` | Yes | Any | Update own profile |
| `PATCH` | `/api/users/change-password` | Yes | Any | Change own password |

**Controller logic for `POST /api/users` (admin creates user):**
```typescript
export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role, enrollmentId, department, batch } = req.body;

  // 1. Check email not taken
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already exists' });

  // 2. Create user in MongoDB
  const user = await User.create({ name, email, password, role, enrollmentId, department, batch });

  // 3. Optionally create user in Gitea
  const giteaSettings = await GiteaSettings.findOne();
  if (giteaSettings?.baseUrl && giteaSettings?.adminToken) {
    try {
      const giteaUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '_');
      await giteaService.createUser({
        username: giteaUsername,
        email,
        password,  // or generate random + force change
        full_name: name,
      });
      user.giteaUsername = giteaUsername;
      user.giteaLinked = true;
      await user.save();
    } catch (err) {
      // Log but don't fail — user was created in MongoDB
      console.error('Gitea user creation failed:', err.message);
    }
  }

  // 4. Audit log
  await AuditLog.create({
    action: 'user.create',
    user: req.user._id,
    targetType: 'user',
    targetId: user._id,
    details: `Created ${role}: ${name}`,
  });

  res.status(201).json(user);
};
```

---

### 7.3 Project Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/projects` | Yes | All | List projects (role-filtered) |
| `GET` | `/api/projects/:id` | Yes | All | Get project detail |
| `POST` | `/api/projects` | Yes | Student | Create new project |
| `PATCH` | `/api/projects/:id` | Yes | Student/Admin | Update project |
| `DELETE` | `/api/projects/:id` | Yes | Admin | Delete project |
| `POST` | `/api/projects/:id/submit` | Yes | Student | Submit for review |
| `POST` | `/api/projects/:id/approve` | Yes | Professor | Approve project |
| `POST` | `/api/projects/:id/reject` | Yes | Professor | Reject / request changes |
| `GET` | `/api/projects/:id/milestones` | Yes | All | List milestones |
| `POST` | `/api/projects/:id/milestones` | Yes | Student | Create milestone |
| `PATCH` | `/api/projects/:id/milestones/:mid` | Yes | Student/Prof | Update milestone |
| `POST` | `/api/projects/:id/milestones/:mid/complete` | Yes | Student | Mark completed |
| `POST` | `/api/projects/:id/milestones/:mid/approve` | Yes | Professor | Approve milestone |
| `POST` | `/api/projects/:id/milestones/:mid/reject` | Yes | Professor | Reject milestone |
| `GET` | `/api/projects/:id/progress` | Yes | All | Get progress history |
| `POST` | `/api/projects/:id/progress` | Yes | Student | Update progress |
| `GET` | `/api/projects/:id/feedback` | Yes | All | Get feedback thread |
| `POST` | `/api/projects/:id/feedback` | Yes | All | Add comment |
| `GET` | `/api/projects/:id/files` | Yes | All | List uploaded files |
| `POST` | `/api/projects/:id/files` | Yes | Student | Upload file |
| `DELETE` | `/api/projects/:id/files/:fid` | Yes | Student/Admin | Delete file |
| `GET` | `/api/projects/:id/download-zip` | Yes | Prof/Admin | Download repo ZIP |

**Critical: Role-based project filtering in `GET /api/projects`:**
```typescript
export const getProjects = async (req: Request, res: Response) => {
  const { status, batch, course, search, page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

  // Build query based on role
  let query: any = {};

  if (req.user.role === 'student') {
    // Students only see their own projects
    query.student = req.user._id;
  } else if (req.user.role === 'professor') {
    // Professors only see assigned projects
    query.professor = req.user._id;
  }
  // Admin sees all — no filter

  // Apply optional filters
  if (status) query.status = status;
  if (batch) query.batch = batch;
  if (course) query.course = course;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .populate('student', 'name email')
    .populate('professor', 'name email')
    .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
    .skip((+page - 1) * +limit)
    .limit(+limit);

  res.json({
    data: projects,
    total,
    page: +page,
    limit: +limit,
    totalPages: Math.ceil(total / +limit),
  });
};
```

**Critical: `POST /api/projects` with Gitea repo creation:**
```typescript
export const createProject = async (req: Request, res: Response) => {
  const { title, description, batch, course, professorId, techStack, teamMemberIds, repoOption, existingRepoUrl } = req.body;

  // 1. Create project in MongoDB
  const project = await Project.create({
    title,
    description,
    student: req.user._id,
    professor: professorId,
    batch,
    course,
    techStack,
    teamMembers: teamMemberIds || [],
    status: 'draft',
  });

  // 2. Handle repo
  if (repoOption === 'create_new') {
    try {
      const repoSlug = slugify(title, { lower: true, strict: true });
      const giteaSettings = await GiteaSettings.findOne();

      // Create repo under organization in Gitea
      const repo = await giteaService.createOrgRepo(giteaSettings.orgName, {
        name: repoSlug,
        description: `Project: ${title} | Student: ${req.user.name}`,
        private: true,
        auto_init: true,
        default_branch: 'main',
      });

      // Add student as collaborator
      if (req.user.giteaUsername) {
        await giteaService.addCollaborator(giteaSettings.orgName, repoSlug, req.user.giteaUsername, 'write');
      }

      // Add professor as collaborator (read access)
      const professor = await User.findById(professorId);
      if (professor?.giteaUsername) {
        await giteaService.addCollaborator(giteaSettings.orgName, repoSlug, professor.giteaUsername, 'read');
      }

      // Update project with repo info
      project.repoUrl = repo.html_url;
      project.repoName = repo.name;
      project.repoOwner = giteaSettings.orgName;
      project.giteaRepoId = repo.id;
      project.cloneUrl = repo.clone_url;
      project.sshUrl = repo.ssh_url;
      await project.save();

    } catch (err) {
      // Don't fail project creation if Gitea fails
      console.error('Gitea repo creation failed:', err);
      // Frontend will show "Repo not linked" state
    }
  } else if (repoOption === 'link_existing' && existingRepoUrl) {
    project.repoUrl = existingRepoUrl;
    // Parse owner/repo from URL
    const match = existingRepoUrl.match(/\/([^/]+)\/([^/]+)$/);
    if (match) {
      project.repoOwner = match[1];
      project.repoName = match[2];
    }
    await project.save();
  }

  // 3. Audit log
  await AuditLog.create({
    action: 'project.create',
    user: req.user._id,
    targetType: 'project',
    targetId: project._id,
    details: `Created project: ${title}`,
  });

  // 4. Return populated project
  const populated = await Project.findById(project._id)
    .populate('student', 'name email')
    .populate('professor', 'name email');

  res.status(201).json(populated);
};
```

---

### 7.4 Gitea Integration Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/gitea/repos` | Yes | Student | Create repo in Gitea |
| `GET` | `/api/gitea/repos/:owner/:repo` | Yes | All | Get repo info |
| `GET` | `/api/gitea/repos/:owner/:repo/commits` | Yes | All | List commits |
| `GET` | `/api/gitea/repos/:owner/:repo/branches` | Yes | All | List branches |
| `GET` | `/api/gitea/repos/:owner/:repo/archive/:branch.zip` | Yes | Prof/Admin | Download ZIP |
| `GET` | `/api/gitea/user/repos` | Yes | Student | List user's repos |
| `GET` | `/api/gitea/activity` | Yes | All | Get push events |
| `GET` | `/api/gitea/settings` | Yes | Admin | Get Gitea config |
| `PATCH` | `/api/gitea/settings` | Yes | Admin | Update Gitea config |
| `POST` | `/api/gitea/test-connection` | Yes | Admin | Test Gitea connection |
| `POST` | `/api/gitea/setup-webhook` | Yes | Admin | Register org webhook |
| `POST` | `/api/webhooks/gitea` | No* | — | Receive Gitea webhook (*verified by secret) |

---

### 7.5 Admin Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/admin/dashboard` | Yes | Admin | Dashboard statistics |
| `GET` | `/api/admin/batches` | Yes | Admin | List batches |
| `POST` | `/api/admin/batches` | Yes | Admin | Create batch |
| `PATCH` | `/api/admin/batches/:id` | Yes | Admin | Update batch |
| `DELETE` | `/api/admin/batches/:id` | Yes | Admin | Delete batch |
| `POST` | `/api/admin/batches/:id/assign-professor` | Yes | Admin | Assign professor to batch |
| `POST` | `/api/admin/batches/:id/assign-students` | Yes | Admin | Assign students to batch |
| `GET` | `/api/admin/courses` | Yes | Admin | List courses |
| `POST` | `/api/admin/courses` | Yes | Admin | Create course |
| `PATCH` | `/api/admin/courses/:id` | Yes | Admin | Update course |
| `GET` | `/api/admin/audit-logs` | Yes | Admin | List audit logs |

---

## 8. Gitea Server Integration

### 8.1 Gitea API Service

```typescript
// services/giteaService.ts
import axios from 'axios';

class GiteaService {
  private baseUrl: string;
  private adminToken: string;

  constructor() {
    this.baseUrl = process.env.GITEA_BASE_URL || 'http://localhost:3000';
    this.adminToken = process.env.GITEA_ADMIN_TOKEN || '';
  }

  private get headers() {
    return { Authorization: `token ${this.adminToken}` };
  }

  // ─── User Management ───

  async createUser(data: { username: string; email: string; password: string; full_name: string }) {
    const res = await axios.post(`${this.baseUrl}/api/v1/admin/users`, {
      ...data,
      must_change_password: false,
      visibility: 'private',
    }, { headers: this.headers });
    return res.data;
  }

  // ─── Organization ───

  async createOrg(name: string, fullName: string) {
    const res = await axios.post(`${this.baseUrl}/api/v1/orgs`, {
      username: name,
      full_name: fullName,
      visibility: 'private',
    }, { headers: this.headers });
    return res.data;
  }

  // ─── Repository ───

  async createOrgRepo(orgName: string, data: {
    name: string; description: string; private: boolean; auto_init: boolean; default_branch: string;
  }) {
    const res = await axios.post(
      `${this.baseUrl}/api/v1/orgs/${orgName}/repos`,
      data,
      { headers: this.headers }
    );
    return res.data;
  }

  async addCollaborator(owner: string, repo: string, username: string, permission: string) {
    await axios.put(
      `${this.baseUrl}/api/v1/repos/${owner}/${repo}/collaborators/${username}`,
      { permission },
      { headers: this.headers }
    );
  }

  async getRepo(owner: string, repo: string) {
    const res = await axios.get(
      `${this.baseUrl}/api/v1/repos/${owner}/${repo}`,
      { headers: this.headers }
    );
    return res.data;
  }

  async getCommits(owner: string, repo: string, page = 1, limit = 30) {
    const res = await axios.get(
      `${this.baseUrl}/api/v1/repos/${owner}/${repo}/commits`,
      { headers: this.headers, params: { page, limit } }
    );
    return res.data;
  }

  async downloadArchive(owner: string, repo: string, branch = 'main') {
    const res = await axios.get(
      `${this.baseUrl}/api/v1/repos/${owner}/${repo}/archive/${branch}.zip`,
      { headers: this.headers, responseType: 'stream' }
    );
    return res.data;
  }

  // ─── Webhook ───

  async createOrgWebhook(orgName: string, callbackUrl: string, secret: string) {
    const res = await axios.post(
      `${this.baseUrl}/api/v1/orgs/${orgName}/hooks`,
      {
        type: 'gitea',
        active: true,
        config: {
          url: callbackUrl,
          content_type: 'json',
          secret,
        },
        events: ['push', 'create', 'delete', 'pull_request'],
      },
      { headers: this.headers }
    );
    return res.data;
  }

  // ─── Connection Test ───

  async testConnection() {
    const res = await axios.get(
      `${this.baseUrl}/api/v1/version`,
      { headers: this.headers, timeout: 5000 }
    );
    return res.data;
  }
}

export default new GiteaService();
```

### 8.2 Gitea Setup Checklist

1. **Install Gitea** on your server (Docker recommended)
2. **Create admin account** in Gitea
3. **Generate API token**: Gitea → Settings → Applications → Generate Token
4. **Create organization** (e.g., `institute`) for all project repos
5. **Set Gitea URL** and **admin token** in GiteaForge admin panel
6. **Test connection** from admin panel
7. **Setup webhook** from admin panel (auto-registers on the org)

---

## 9. Webhook Handler

```typescript
// webhooks/giteaWebhook.ts
import crypto from 'crypto';
import { Request, Response } from 'express';
import PushEvent from '../models/PushEvent';
import Project from '../models/Project';

/**
 * POST /api/webhooks/gitea
 * No JWT auth — verified by HMAC signature
 *
 * Gitea sends a X-Gitea-Signature header with HMAC-SHA256 of the body
 */
export const handleGiteaWebhook = async (req: Request, res: Response) => {
  // 1. Verify signature
  const signature = req.headers['x-gitea-signature'] as string;
  const secret = process.env.GITEA_WEBHOOK_SECRET;

  if (secret) {
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== computed) {
      return res.status(401).json({ message: 'Invalid signature' });
    }
  }

  const event = req.headers['x-gitea-event'] as string;
  const payload = req.body;

  // 2. Handle push event
  if (event === 'push') {
    const repoFullName = payload.repository?.full_name; // "org/repo-name"

    // Find the project linked to this repo
    const project = await Project.findOne({
      $or: [
        { repoUrl: { $regex: repoFullName } },
        { repoName: payload.repository?.name, repoOwner: payload.repository?.owner?.login },
      ],
    });

    // Store push event
    await PushEvent.create({
      project: project?._id,
      repo: repoFullName,
      branch: payload.ref?.replace('refs/heads/', ''),
      commits: payload.commits?.map((c: any) => ({
        sha: c.id?.substring(0, 7),
        message: c.message,
        author: c.author?.name,
        url: c.url,
      })),
      pusher: payload.pusher?.login,
    });

    // Update project's lastPush timestamp
    if (project) {
      project.lastPush = new Date();
      await project.save();
    }
  }

  res.status(200).json({ received: true });
};
```

---

## 10. File Upload Handling

```typescript
// middleware/upload.ts
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: +(process.env.MAX_FILE_SIZE || 52428800) }, // 50MB
});
```

---

## 11. Middleware Reference

| Middleware | File | Purpose |
|-----------|------|---------|
| `authenticate` | `middleware/auth.ts` | Verify JWT, attach `req.user` |
| `roleGuard(...roles)` | `middleware/roleGuard.ts` | Check user role |
| `validate(schema)` | `middleware/validate.ts` | Validate req.body with Joi |
| `errorHandler` | `middleware/errorHandler.ts` | Global error handler (returns JSON) |
| `auditLog(action)` | `middleware/auditLog.ts` | Auto-log actions to AuditLog |
| `upload.single('file')` | `middleware/upload.ts` | Handle file uploads |

### Express App Setup

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan('combined'));

// Static files (uploaded documents)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/gitea', require('./routes/gitea'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Error handler (must be last)
app.use(errorHandler);

export default app;
```

---

## 12. Error Handling

```typescript
// utils/apiError.ts
export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// middleware/errorHandler.ts
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

### Frontend Error States

The frontend API client (`src/api/client.ts`) handles these error responses:

| HTTP Code | Frontend Behavior |
|-----------|-------------------|
| `401` | Auto-refresh token, or redirect to login |
| `403` | Show "Insufficient permissions" toast |
| `404` | Show "Not found" state |
| `409` | Show "Already exists" message (e.g., duplicate email) |
| `422` | Show validation error messages from `errors` array |
| `500` | Show "Server error, try again" toast |

---

## 13. Frontend ↔ Backend Data Flow

### Flow 1: Student Creates Project

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│ CreateProject    │     │  Express API     │     │  MongoDB    │     │  Gitea API   │
│ (React Form)    │     │  /api/projects   │     │             │     │              │
└────────┬────────┘     └────────┬─────────┘     └──────┬──────┘     └──────┬───────┘
         │                       │                       │                   │
         │ POST /api/projects    │                       │                   │
         │ { title, desc, ...    │                       │                   │
         │   repoOption:         │                       │                   │
         │   'create_new' }      │                       │                   │
         │──────────────────────▶│                       │                   │
         │                       │ Create project doc    │                   │
         │                       │──────────────────────▶│                   │
         │                       │                       │                   │
         │                       │ POST /api/v1/orgs/    │                   │
         │                       │   {org}/repos         │                   │
         │                       │──────────────────────────────────────────▶│
         │                       │                       │                   │
         │                       │◀──────────────────────────────────────────│
         │                       │ { repo info }         │                   │
         │                       │                       │                   │
         │                       │ PUT collaborator      │                   │
         │                       │ (student=write,       │                   │
         │                       │  professor=read)      │                   │
         │                       │──────────────────────────────────────────▶│
         │                       │                       │                   │
         │                       │ Update project with   │                   │
         │                       │ repoUrl, cloneUrl     │                   │
         │                       │──────────────────────▶│                   │
         │                       │                       │                   │
         │◀──────────────────────│                       │                   │
         │ { project with repo } │                       │                   │
         │                       │                       │                   │
         │ Show "clone URL"      │                       │                   │
         │ and push instructions │                       │                   │
```

### Flow 2: Student Pushes Code → Professor Sees Activity

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│ Student  │     │  Gitea   │     │ Express API  │     │  MongoDB    │     │  Professor   │
│ (git)    │     │  Server  │     │  Webhook     │     │             │     │  Dashboard   │
└────┬─────┘     └────┬─────┘     └──────┬───────┘     └──────┬──────┘     └──────┬───────┘
     │                │                   │                     │                   │
     │ git push       │                   │                     │                   │
     │───────────────▶│                   │                     │                   │
     │                │                   │                     │                   │
     │                │ POST /api/webhooks│                     │                   │
     │                │   /gitea          │                     │                   │
     │                │──────────────────▶│                     │                   │
     │                │                   │                     │                   │
     │                │                   │ Verify HMAC sig     │                   │
     │                │                   │ Store PushEvent     │                   │
     │                │                   │ Update lastPush     │                   │
     │                │                   │────────────────────▶│                   │
     │                │                   │                     │                   │
     │                │                   │                     │ GET /api/gitea/   │
     │                │                   │                     │   activity        │
     │                │                   │                     │◀──────────────────│
     │                │                   │                     │                   │
     │                │                   │                     │──────────────────▶│
     │                │                   │                     │ Push events list  │
     │                │                   │                     │                   │
     │                │                   │                     │ Professor sees    │
     │                │                   │                     │ "New push" in     │
     │                │                   │                     │ activity feed     │
```

### Flow 3: Professor Reviews and Grades

```
Professor Dashboard → Click project → Activity tab (see commits)
→ Milestones tab → Approve/Reject milestone → Add comment
→ Grade tab → Enter rubric scores → Add feedback → Approve project
```

---

## 14. Deployment Checklist

### Server Requirements
- **Node.js** 18+ (for backend)
- **MongoDB** 6+ (or MongoDB Atlas)
- **Gitea** 1.20+ (Docker recommended)
- **Nginx** (reverse proxy for all services)

### Docker Compose (recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MongoDB
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  # Gitea
  gitea:
    image: gitea/gitea:latest
    environment:
      - GITEA__server__ROOT_URL=https://git.institute.edu
      - GITEA__server__DOMAIN=git.institute.edu
    volumes:
      - gitea_data:/data
    ports:
      - "3000:3000"
      - "2222:22"

  # Backend API
  backend:
    build: ./giteaforge-backend
    environment:
      - MONGODB_URI=mongodb://mongo:27017/giteaforge
      - GITEA_BASE_URL=http://gitea:3000
      - FRONTEND_URL=https://projects.institute.edu
    depends_on:
      - mongo
      - gitea
    ports:
      - "5000:5000"

  # Frontend (built static files served by nginx)
  frontend:
    build: ./giteaforge-frontend
    ports:
      - "80:80"

volumes:
  mongo_data:
  gitea_data:
```

### Nginx Config

```nginx
# /etc/nginx/sites-available/giteaforge
server {
    listen 443 ssl;
    server_name projects.institute.edu;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # File uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}

server {
    listen 443 ssl;
    server_name git.institute.edu;

    # Gitea
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Security Checklist
- [ ] Change all default secrets (JWT_SECRET, WEBHOOK_SECRET)
- [ ] Enable HTTPS for all services
- [ ] Set Gitea repos to private by default
- [ ] Restrict Gitea registration (admin-only user creation)
- [ ] Enable MongoDB authentication
- [ ] Set CORS to frontend domain only
- [ ] Rate-limit auth endpoints
- [ ] Encrypt Gitea tokens stored in MongoDB
- [ ] Enable audit logging
- [ ] Backup MongoDB and Gitea data daily

---

## Quick Start for Backend Developer

```bash
# 1. Clone and setup
git clone <repo-url> giteaforge-backend
cd giteaforge-backend
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your MongoDB URI, Gitea URL, secrets

# 3. Seed admin user
npm run seed
# Creates admin@institute.edu / admin123

# 4. Start dev server
npm run dev
# Server runs on http://localhost:5000

# 5. Test with frontend
# Frontend expects API at VITE_API_BASE_URL (default: http://localhost:5000/api)
```

---

## Frontend API Files Reference

The frontend already has complete API service files ready to connect:

| File | Purpose | API Methods |
|------|---------|-------------|
| `src/api/client.ts` | Axios instance with JWT interceptor | Base client |
| `src/api/auth.ts` | Authentication | login, register, logout, refresh, forgotPassword |
| `src/api/projects.ts` | Projects CRUD | getAll, getById, create, update, delete, submit, approve, reject, milestones, progress, feedback, files |
| `src/api/users.ts` | User management | getAll, create, update, delete, bulkImport, linkGitea, updateProfile |
| `src/api/gitea.ts` | Gitea integration | createRepo, getCommits, getBranches, downloadZip, getActivity, settings |
| `src/api/admin.ts` | Admin operations | dashboard, batches, courses, auditLogs |
| `src/hooks/useAuth.ts` | Auth state hook | login, logout, isAuthenticated, user |
| `src/hooks/useAPI.ts` | Data fetching hook | useAPI (GET), useMutation (POST/PATCH/DELETE) |

### How to Connect Frontend to Backend

1. Set `VITE_API_BASE_URL` in `.env` to your backend URL
2. Replace mock data in screen components with API calls using the hooks:

```typescript
// Example: Replace mock projects in StudentDashboard
import { useAPI } from '../hooks/useAPI';
import { projectsAPI } from '../api';

function StudentDashboard() {
  const { data, loading, error } = useAPI(
    () => projectsAPI.getAll({ status: 'in_progress' })
  );

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;

  return <ProjectTable projects={data.data} />;
}
```
