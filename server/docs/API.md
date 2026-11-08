# GiteaForge LMS — API Documentation

> **Generated from source code analysis.**  
> Fields marked ⚠️ indicate inferred behaviour or known caveats discovered during analysis.

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Versioning](#base-url--versioning)
3. [Authentication & Security](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Model](#error-model)
6. [Resources](#resources)
   - [Health](#health)
   - [Auth](#auth)
   - [Users](#users)
   - [Courses](#courses)
   - [Batches & Rosters](#batches)
   - [Projects](#projects)
   - [Milestones & Rubrics](#milestones)
   - [Supervisors](#supervisors)
   - [Admin](#admin)
   - [Activities](#activities)
   - [Gitea (Repository Proxy)](#gitea-repository-proxy)
   - [Webhooks](#webhooks)
   - [Code Execution & Sandbox](#code-execution--sandbox)
   - [Lab Assignments & Autograding](#lab-assignments--autograding)
   - [Problem Statement Bank](#problem-statement-bank)
   - [Continuous Evaluation Register](#continuous-evaluation-register)
   - [File Storage & Presigned URLs](#file-storage--presigned-urls)
7. [Role-Based Access Control](#role-reference)
8. [Data Models](#data-models)
9. [Security Hardening & Mitigations](#security-hardening--mitigations)

---

## Overview

GiteaForge is a Learning Management System backend that integrates with a self-hosted [Gitea](https://gitea.io) instance. It manages users (students, supervisors, admins), courses, batches, student projects with linked Git repositories, milestone tracking, and activity feeds.

**Tech stack:** Node.js · Express · TypeScript · Prisma (PostgreSQL) · Redis · Gitea API · Resend (email)

---

## Base URL & Versioning

```
http://localhost:5000/api/v1
```

All application endpoints are prefixed with `/api/v1`. The port defaults to `5000` and is configurable via the `PORT` environment variable.

Static uploaded files are served at:

```
http://localhost:5000/uploads/<filename>
```

---

## Authentication

### Mechanism

The API uses a **dual-token JWT scheme**:

| Token | Transport | Lifetime (default) | Purpose |
|---|---|---|---|
| Access token | `Authorization: Bearer <token>` header | 15 minutes | Authenticate every protected request |
| Refresh token | `refreshToken` httpOnly cookie | 7 days | Obtain a new access token without re-login |

Refresh tokens are stored in **Redis** (key `refresh:<userId>`). Only one refresh token per user is valid at a time — issuing a new one (login / verify-email) invalidates the previous one.

### Sending the Access Token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload

```json
// Access token claims
{ "id": "clxyz...", "role": "STUDENT" }

// Refresh token claims
{ "id": "clxyz..." }
```

### Email Verification

Email verification is **feature-flagged** via the `EMAIL_VERIFICATION` environment variable (default: `false`).

- When **disabled**: registration immediately creates a verified account and returns full user data.
- When **enabled**: registration sends a 6-digit OTP via email (Resend); the client must call `POST /auth/verify-email` before the account is usable.

---

## Rate Limiting

| Scope | Window | Dev limit | Prod limit |
|---|---|---|---|
| `/api/v1/auth/*` | 15 min | 100 req | 10 req |
| `/api/v1/*` (all other) | 15 min | 1000 req | 100 req |

Rate limit headers follow the `RateLimit-*` standard (RFC draft). Legacy `X-RateLimit-*` headers are disabled.

---

## Error Model

All errors follow a consistent JSON envelope:

```json
{
  "status": "fail",      // "fail" for 4xx, "error" for 5xx
  "message": "Human-readable description"
}
```

Validation errors (Zod) return `400` with a `message` describing the first failing field.

### HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request / Validation error |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (authenticated but insufficient role/ownership) |
| `404` | Not Found |
| `409` | Conflict (e.g. duplicate email, unique constraint) |
| `429` | Too Many Requests |
| `500` | Internal Server Error |

### Prisma-mapped errors

| Prisma code | HTTP | Message |
|---|---|---|
| `P2002` (unique violation) | `409` | `A record with this <field> already exists` |
| `P2025` (record not found) | `404` | `Record not found` |
| `P2003` (foreign key) | `400` | `Related record not found` |

---

## Resources

### Health

#### `GET /`

Returns API status. No authentication required.

**Response `200`**
```json
{
  "status": "success",
  "message": "GiteaForge API is running 🚀",
  "env": "development"
}
```

#### `GET /health`

Liveness probe. No authentication required.

**Response `200`**
```json
{
  "status": "ok",
  "uptime": 3600.12,
  "timestamp": "2025-01-15T10:00:00.000Z"
}
```

---

### Auth

Base path: `/api/v1/auth`  
Rate limit: 10 req / 15 min (production).

#### `POST /auth/register`

Register a new user account.

**Request body**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "Secret1!",
  "role": "STUDENT"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | string | ✅ | 2–50 characters |
| `email` | string | ✅ | Valid email, lowercased |
| `password` | string | ✅ | Min 8 chars, ≥1 uppercase, ≥1 digit, ≥1 special char |
| `role` | `"STUDENT"` \| `"SUPERVISOR"` | ❌ | Defaults to `"STUDENT"`. `"ADMIN"` cannot be self-assigned. |

**Response `201` — email verification disabled**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": { "userId": "clxyz..." }
}
```

**Response `201` — email verification enabled**
```json
{
  "status": "success",
  "message": "Registration successful. Please check your email for the verification code.",
  "data": { "userId": "clxyz..." }
}
```

**Errors:** `400` validation, `409` email already registered.

---

#### `POST /auth/verify-email`

Verify email with the 6-digit OTP sent during registration. Only available when `EMAIL_VERIFICATION=true`.

**Request body**
```json
{
  "email": "alice@example.com",
  "code": "482910"
}
```

| Field | Type | Validation |
|---|---|---|
| `email` | string | Valid email |
| `code` | string | Exactly 6 digits |

**Response `200`** — same as login (issues tokens).

**Errors:** `400` code expired (OTP TTL: 10 min) or invalid, `400` if verification is disabled.

---

#### `POST /auth/login`

Authenticate and receive tokens.

**Request body**
```json
{
  "email": "alice@example.com",
  "password": "Secret1!"
}
```

**Response `200`**
```json
{
  "status": "success",
  "accessToken": "eyJ...",
  "data": {
    "user": {
      "id": "clxyz...",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "STUDENT",
      "isEmailVerified": true,
      "giteaUsername": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  }
}
```

The `refreshToken` is set as an `httpOnly` cookie (`SameSite=Strict`, `Secure` in production).

**Errors:** `401` invalid credentials.

---

#### `POST /auth/refresh-token`

Exchange a valid refresh token cookie for a new access token.

**Requires:** `refreshToken` cookie (set automatically by login/verify-email).  
No request body needed.

**Response `200`**
```json
{
  "status": "success",
  "accessToken": "eyJ..."
}
```

**Errors:** `401` missing, invalid, expired, or revoked refresh token.

---

#### `POST /auth/forgot-password`

Request a password reset OTP. Always returns the same message to prevent email enumeration.

**Request body**
```json
{ "email": "alice@example.com" }
```

**Response `200`**
```json
{
  "status": "success",
  "message": "If that email exists, a reset code has been sent"
}
```

---

#### `PATCH /auth/reset-password`

Reset password using the OTP received by email.

**Request body**
```json
{
  "email": "alice@example.com",
  "code": "123456",
  "password": "NewSecret2@",
  "confirmPassword": "NewSecret2@"
}
```

| Field | Validation |
|---|---|
| `password` | Same rules as registration |
| `confirmPassword` | Must match `password` |

**Response `200`**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Errors:** `400` code expired or invalid.

> ⚠️ **Caveat:** The `resetPasswordSchema` validates a `params.token` field, but the route is `PATCH /auth/reset-password` with no URL parameter. The schema's `params` block is never populated — the `token` validation is dead code. The actual reset uses `email` + `code` from the body.

---

#### `POST /auth/logout`

🔒 **Requires authentication.**

Revokes the refresh token in Redis and clears the cookie.

**Response `200`**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### Users

Base path: `/api/v1/users`  
All routes require authentication (`Bearer` token).

#### `GET /users/me`

Get the currently authenticated user's profile.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "clxyz...",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "role": "STUDENT",
    "isEmailVerified": true,
    "giteaUsername": "alice",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-10T00:00:00.000Z"
  }
}
```

---

#### `PATCH /users/updateMe`

Update the authenticated user's own profile.

**Request body** (all fields optional)
```json
{
  "name": "Alice J. Smith",
  "giteaUsername": "alice-smith"
}
```

> ⚠️ **Important:** A student must set `giteaUsername` before they can create a project. The Gitea username must match an existing account on the configured Gitea instance.

**Response `200`** — updated user object (same shape as `GET /users/me`).

---

#### `GET /users/supervisors`

List all users with role `SUPERVISOR`. Available to any authenticated user.

**Response `200`**
```json
{
  "status": "success",
  "count": 2,
  "data": [
    { "id": "cl...", "name": "Dr. Bob", "email": "bob@example.com" }
  ]
}
```

---

#### `GET /users/getAllUsers`

🔒 **Role: ADMIN only.**

List all users ordered by `createdAt` descending.

**Response `200`**
```json
{
  "status": "success",
  "count": 42,
  "data": [ /* array of user objects */ ]
}
```

---

#### `GET /users/:id`

🔒 **Role: ADMIN only.**

Get a single user by ID.

**Response `200`** — single user object.  
**Errors:** `404` user not found.

---

### Courses

Base path: `/api/v1/courses`  
All routes require authentication.

#### `GET /courses/allcourses`

List all courses with batch count.

**Response `200`**
```json
{
  "status": "success",
  "count": 3,
  "data": [
    {
      "id": "cl...",
      "title": "Web Development",
      "description": "Full-stack web dev course",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "_count": { "batches": 2 }
    }
  ]
}
```

---

#### `GET /courses/:id`

Get a single course including its batches.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "cl...",
    "title": "Web Development",
    "description": "...",
    "createdAt": "...",
    "updatedAt": "...",
    "batches": [
      { "id": "cl...", "name": "Batch 2025-A", "courseId": "cl...", "createdAt": "..." }
    ]
  }
}
```

**Errors:** `404` course not found.

---

#### `POST /courses/create`

🔒 **Role: ADMIN only.**

Create a new course.

**Request body**
```json
{
  "title": "Mobile Development",
  "description": "iOS and Android development"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Non-empty string |
| `description` | ❌ | Optional |

**Response `201`** — created course object.  
**Errors:** `400` missing title.

---

#### `PATCH /courses/:id`

🔒 **Role: ADMIN only.**

Update a course. All fields optional.

**Request body**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response `200`** — updated course object.

---

#### `DELETE /courses/:id`

🔒 **Role: ADMIN only.**

Delete a course. Cascades to batches (and their enrollments/projects via DB cascade).

**Response `200`**
```json
{
  "status": "success",
  "message": "Course deleted successfully"
}
```

---

### Projects

Base path: `/api/v1/projects`  
All routes require authentication.

#### `POST /projects/create`

🔒 **Role: STUDENT only.**

Create a new project. This also:
1. Creates a Git repository on the Gitea instance under the student's Gitea username.
2. Registers a webhook on that repository pointing back to `POST /api/v1/webhooks/gitea`.

**Prerequisite:** The authenticated student must have `giteaUsername` set on their profile.

**Request body**
```json
{
  "title": "My Final Project",
  "description": "A full-stack e-commerce app",
  "batchId": "cl...",
  "repoName": "my-final-project"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Non-empty |
| `batchId` | ✅ | Must reference an existing batch |
| `description` | ❌ | Optional |
| `repoName` | ❌ | Sanitized to lowercase alphanumeric + hyphens. Defaults to `title` if omitted. |

**Response `201`**
```json
{
  "status": "success",
  "data": {
    "id": "cl...",
    "title": "My Final Project",
    "description": "A full-stack e-commerce app",
    "repoName": "my-final-project",
    "repoUrl": "https://gitea.example.com/alice/my-final-project",
    "ownerId": "cl...",
    "supervisorId": null,
    "batchId": "cl...",
    "createdAt": "...",
    "updatedAt": "...",
    "owner": { "id": "cl...", "name": "Alice", "email": "alice@example.com" },
    "supervisor": null,
    "batch": { "id": "cl...", "name": "Batch 2025-A" },
    "_count": { "milestones": 0 }
  }
}
```

**Errors:** `400` missing title/batchId, `400` no Gitea username set, `400` Gitea API failure.

> ⚠️ **Caveat:** The webhook URL is constructed as `${CLIENT_URL}/api/v1/webhooks/gitea`. This uses `CLIENT_URL` (the frontend origin) rather than the server's own URL. If the frontend and backend are on different hosts, the webhook will point to the wrong server.

---

#### `GET /projects/me`

🔒 **Role: STUDENT only.**

List all projects owned by the authenticated student.

**Response `200`**
```json
{
  "status": "success",
  "count": 1,
  "data": [ /* array of project objects */ ]
}
```

---

#### `GET /projects/supervised`

🔒 **Role: SUPERVISOR or ADMIN.**

List all projects where the authenticated user is the assigned supervisor.

**Response `200`** — same shape as `GET /projects/me`.

---

#### `GET /projects/:id`

🔒 **Authenticated.** Access restricted to: project owner, assigned supervisor, or ADMIN.

Get a single project with full details including milestones and last 10 activities.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "id": "cl...",
    "title": "...",
    "milestones": [ /* ordered by createdAt asc */ ],
    "activities": [ /* last 10, ordered by createdAt desc */ ],
    "owner": { ... },
    "supervisor": { ... },
    "batch": { ... },
    "_count": { "milestones": 3 }
  }
}
```

**Errors:** `404` not found, `403` no access.

---

#### `PATCH /projects/:id`

🔒 **Role: STUDENT only.** Must be the project owner.

Update project title and/or description. Repository name/URL cannot be changed after creation.

**Request body** (all optional)
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response `200`** — updated project object.  
**Errors:** `404` not found, `403` not the owner.

---

### Milestones

Milestone routes are mounted at `/api/v1` (not `/api/v1/milestones`).

#### `POST /projects/:projectId/milestones`

🔒 **Role: STUDENT only.** Must be the project owner.

Create a new milestone for a project.

**Request body**
```json
{
  "title": "Phase 1 — Requirements",
  "description": "Gather and document all requirements",
  "dueDate": "2025-03-01T00:00:00.000Z"
}
```

| Field | Required | Notes |
|---|---|---|
| `title` | ✅ | Non-empty |
| `description` | ❌ | Optional |
| `dueDate` | ❌ | ISO 8601 datetime string |

**Response `201`**
```json
{
  "status": "success",
  "data": {
    "id": "cl...",
    "title": "Phase 1 — Requirements",
    "description": "...",
    "dueDate": "2025-03-01T00:00:00.000Z",
    "status": "PENDING",
    "projectId": "cl...",
    "feedback": null,
    "submittedAt": null,
    "reviewedAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `400` missing title, `404` project not found, `403` not the owner.

---

#### `GET /projects/:projectId/milestones`

🔒 **Authenticated.** Any authenticated user can fetch milestones for a project.

> ⚠️ **Caveat:** No ownership/role check is performed. Any authenticated user can read milestones for any project ID.

**Response `200`**
```json
{
  "status": "success",
  "count": 3,
  "data": [ /* milestones ordered by createdAt asc */ ]
}
```

---

#### `PATCH /milestones/:id/submit`

🔒 **Role: STUDENT only.** Must be the project owner.

Submit a milestone for review. Accepts optional file attachments.

**Content-Type:** `multipart/form-data`

| Form field | Type | Notes |
|---|---|---|
| `files` | file (multiple) | Up to 5 files. PDF, JPG, PNG only. Max 5 MB each. |

> ⚠️ **Caveat:** Uploaded files are saved to the `uploads/` directory on disk but their paths/URLs are **not** stored in the database or returned in the response. The milestone record is updated to `SUBMITTED` status only. File metadata is effectively lost after upload.

**Response `200`** — updated milestone object with `status: "SUBMITTED"`.  
**Errors:** `404` not found, `403` not the owner, `400` already approved.

---

#### `PATCH /milestones/:id/approve`

🔒 **Role: SUPERVISOR or ADMIN.** Supervisor must be assigned to the project.

Approve a submitted milestone.

**Request body** (optional)
```json
{ "feedback": "Great work! Well documented." }
```

**Response `200`** — updated milestone with `status: "APPROVED"`.  
**Errors:** `404` not found, `403` not the assigned supervisor or admin.

---

#### `PATCH /milestones/:id/reject`

🔒 **Role: SUPERVISOR or ADMIN.** Supervisor must be assigned to the project.

Reject a submitted milestone.

**Request body** (optional)
```json
{ "feedback": "Please revise the architecture diagram." }
```

**Response `200`** — updated milestone with `status: "REJECTED"`.

---

#### `GET /me/submissions`

🔒 **Role: STUDENT only.**

List all milestones the authenticated student has submitted (status: SUBMITTED, APPROVED, or REJECTED).

**Response `200`**
```json
{
  "status": "success",
  "count": 5,
  "data": [
    {
      "id": "cl...",
      "title": "Phase 1",
      "status": "APPROVED",
      "submittedAt": "...",
      "project": { "id": "cl...", "title": "My Final Project" }
    }
  ]
}
```

---

### Supervisors

Base path: `/api/v1/supervisors`

#### `GET /supervisors/allsupervisors`

🔒 **Authenticated.** Any role.

List all supervisors (id, name, email only).

**Response `200`**
```json
{
  "status": "success",
  "count": 5,
  "data": [
    { "id": "cl...", "name": "Dr. Bob", "email": "bob@example.com" }
  ]
}
```

> ⚠️ **Duplication:** `GET /users/supervisors` returns the same data. Both endpoints exist.

---

#### `GET /supervisors/dashboard`

🔒 **Role: SUPERVISOR or ADMIN.**

Get supervisor dashboard summary.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "totalProjects": 4,
    "pendingMilestones": 2,
    "recentActivity": [ /* last 10 activity records */ ]
  }
}
```

---

#### `GET /supervisors/projects`

🔒 **Role: SUPERVISOR or ADMIN.**

List projects assigned to the authenticated supervisor.

**Response `200`** — array of project objects with owner info and milestone count.

---

#### `GET /supervisors/milestones/pending`

🔒 **Role: SUPERVISOR or ADMIN.**

List all milestones with status `SUBMITTED` for the supervisor's assigned projects, ordered by `submittedAt` ascending (oldest first).

**Response `200`** — array of milestone objects with nested project and owner info.

---

#### `PATCH /supervisors/milestones/:id/review`

🔒 **Role: SUPERVISOR or ADMIN.**

Review a milestone (approve or reject) in a single call.

**Request body**
```json
{
  "status": "APPROVED",
  "feedback": "Excellent work."
}
```

| Field | Required | Values |
|---|---|---|
| `status` | ✅ | `"APPROVED"` or `"REJECTED"` |
| `feedback` | ❌ | Optional string |

**Response `200`**
```json
{
  "status": "success",
  "message": "Milestone approved successfully",
  "data": { /* updated milestone */ }
}
```

**Errors:** `400` invalid status value, `404` not found, `403` not the assigned supervisor.

> ⚠️ **Duplication:** `PATCH /milestones/:id/approve` and `PATCH /milestones/:id/reject` perform the same operations as this endpoint. Three separate routes exist for the same functionality.

---

#### `GET /supervisors/activity`

🔒 **Role: SUPERVISOR or ADMIN.**

Get the last 20 activity events across all projects assigned to the supervisor.

**Response `200`** — array of activity objects.

---

### Admin

Base path: `/api/v1/admin`  
🔒 **All routes: ADMIN only.**

#### `GET /admin/stats`

Get platform-wide statistics.

**Response `200`**
```json
{
  "status": "success",
  "data": {
    "totalUsers": 120,
    "totalStudents": 100,
    "totalSupervisors": 18,
    "totalProjects": 45,
    "totalMilestones": 210,
    "pendingMilestones": 12
  }
}
```

---

#### `GET /admin/projects`

List all projects with optional filters.

**Query parameters**

| Param | Type | Description |
|---|---|---|
| `supervisorId` | string | Filter by assigned supervisor ID |
| `ownerId` | string | Filter by student owner ID |

**Response `200`** — array of project objects with owner, supervisor, and milestone count.

---

#### `PATCH /admin/projects/:id/assign-supervisor`

Assign a supervisor to a project.

**Request body**
```json
{ "supervisorId": "cl..." }
```

The user referenced by `supervisorId` must exist and have role `SUPERVISOR`.

**Response `200`** — updated project with owner and supervisor info.  
**Errors:** `400` missing supervisorId, `404` supervisor not found or wrong role.

---

### Activities

Base path: `/api/v1/activities`  
All routes require authentication.

Activity types logged by the system: `PROJECT_CREATED`, `MILESTONE_SUBMITTED`, `MILESTONE_APPROVED`, `MILESTONE_REJECTED`, `PUSH` (from Gitea webhook).

#### `GET /activities/me`

Get the last 20 activity events for the authenticated user.

**Response `200`**
```json
{
  "status": "success",
  "data": [
    {
      "id": "cl...",
      "type": "MILESTONE_SUBMITTED",
      "payload": { "milestoneTitle": "Phase 1" },
      "userId": "cl...",
      "projectId": "cl...",
      "createdAt": "...",
      "user": { "id": "cl...", "name": "Alice", "role": "STUDENT" },
      "project": { "id": "cl...", "title": "My Final Project" }
    }
  ]
}
```

---

#### `GET /activities/project/:projectId`

Get all activity events for a specific project (no limit).

> ⚠️ **Caveat:** No access control check — any authenticated user can query activity for any project ID.

**Response `200`** — array of activity objects with `count`.

---

#### `GET /activities/supervisor`

🔒 **Role: SUPERVISOR only.**

Get the last 30 activity events across the supervisor's assigned projects.

**Response `200`** — array of activity objects.

---

#### `GET /activities/admin`

🔒 **Role: ADMIN only.**

Get the last 50 activity events platform-wide.

**Response `200`** — array of activity objects.

---

### Gitea (Repository Proxy)

Base path: `/api/v1/gitea`  
All routes require authentication.

These endpoints proxy requests to the configured Gitea instance.

#### `POST /gitea/repos`

🔒 **Role: STUDENT only.**

Create a standalone Gitea repository (not linked to a project record).

> ⚠️ **Caveat:** This endpoint passes `req.user!.id` (the internal DB user ID) as the Gitea owner, not `giteaUsername`. This will likely fail unless the Gitea username happens to equal the CUID. This endpoint appears to be a leftover/incomplete implementation. Use `POST /projects/create` to create a project with a linked repository instead.

**Request body**
```json
{
  "name": "my-repo",
  "description": "Optional description"
}
```

**Response `201`** — Gitea repository object.

---

#### `GET /gitea/repos/:owner/:repo`

Get repository metadata from Gitea.

**Path params:** `owner` (Gitea username), `repo` (repository name).

**Response `200`** — Gitea repository object.

---

#### `GET /gitea/repos/:owner/:repo/commits`

List commits for a repository.

**Query params:**

| Param | Default | Description |
|---|---|---|
| `limit` | `20` | Number of commits to return |

**Response `200`** — array of Gitea commit objects.

---

#### `GET /gitea/repos/:owner/:repo/branches`

List branches for a repository.

**Response `200`** — array of Gitea branch objects.

---

### Webhooks

Base path: `/api/v1/webhooks`

> **Important:** The webhook router is registered **before** `express.json()` in `app.ts` so it can read the raw request body for HMAC signature verification.

#### `POST /webhooks/gitea`

Receives push event webhooks from Gitea. **Not authenticated via JWT.**

**Verification:** HMAC-SHA256 signature in the `X-Gitea-Signature` header (format: `sha256=<hex>`). The secret is configured via `GITEA_WEBHOOK_SECRET`.

**Supported events:** `push` only (other events are silently ignored).

**Headers**

| Header | Description |
|---|---|
| `X-Gitea-Signature` | `sha256=<HMAC-SHA256 of raw body>` |
| `X-Gitea-Event` | Event type (e.g. `push`) |
| `Content-Type` | `application/json` |

**Behaviour on push:**
1. Validates HMAC signature (timing-safe comparison).
2. Responds `200 { received: true }` immediately (async processing).
3. Looks up the project by `repository.name`.
4. Logs one `PUSH` activity record per commit.

**Response `200`**
```json
{ "received": true }
```

**Response `401`** — invalid signature.

---

### Batches

Mounted at `/api/v1/batches`.

#### `GET /batches/courses`
Public endpoint returning active courses with id, code, title, and duration for registration dropdowns.

#### `GET /batches/courses/:courseId/batches`
Public endpoint returning active batches for a given course ID for registration dropdowns.

#### `GET /batches`
Returns all batches with course details and enrolled student counts. Requires authentication (`STUDENT`, `SUPERVISOR`, `ADMIN`).

#### `POST /batches`
Creates an academic batch cohort. Requires `ADMIN`.
- **Request Body:** `{ name: string, courseId: string, startYear: number, endYear: number }`

#### `DELETE /batches/:id`
Deletes a batch. Requires `ADMIN`.

#### `GET /batches/:id/students`
Returns student roster for a specific batch. Requires `ADMIN`.

#### `POST /batches/:id/students`
Enrolls a student into a batch. Requires `ADMIN`.
- **Request Body:** `{ userId: string }`

#### `DELETE /batches/:id/students/:userId`
Removes a student from a batch cohort. Requires `ADMIN`.

---

### Code Execution & Sandbox

Mounted at `/api/v1/execute`. Requires authenticated and email-verified user (`protect`, `requireVerifiedEmail`).

#### `POST /execute`
Executes code inside an ephemeral sandbox container (Judge0 CE) or fallback sandbox runner.
- **Request Body:**
```json
{
  "language": "python",
  "sourceCode": "print('Hello, GiteaForge!')",
  "stdin": ""
}
```
- **Supported Languages:** `python`, `javascript`, `typescript`, `cpp`, `c`, `java`, `go`, `rust`, `csharp`.
- **Response `200`:**
```json
{
  "status": "success",
  "data": {
    "stdout": "Hello, GiteaForge!\n",
    "stderr": null,
    "compile_output": null,
    "status": { "id": 3, "description": "Accepted" },
    "time": "0.024",
    "memory": 3120
  }
}
```

#### `GET /execute/languages`
Returns list of all supported programming languages, compiler versions, and Judge0 language IDs.

#### `GET /execute/templates/:language`
Returns starter boilerplate code template for the specified programming language.

---

### Lab Assignments & Autograding

Mounted at `/api/v1/lab-assignments`. Requires authenticated and email-verified user.

#### `GET /lab-assignments`
Lists lab assignments filtered by the current user's batch and role. Students see assignments for their enrolled batch.

#### `GET /lab-assignments/:id`
Retrieves single assignment details. Student view automatically strips hidden test cases; supervisors/admins see all rubrics and test definitions.

#### `POST /lab-assignments/:id/run`
Runs code against public test cases only without submitting.
- **Request Body:** `{ code: string, language: string }`

#### `POST /lab-assignments/:id/submit`
Submits source code for official evaluation against both public and hidden test cases. Evaluates test scores, memory, and runtime.
- **Request Body:** `{ code: string, language: string }`

#### `POST /lab-assignments/:id/submit-report`
Submits a PDF lab report / documentation deliverable via `multipart/form-data`.
- **Form Data:** `file` (PDF, max 10MB), `studentNotes` (optional).

#### `POST /lab-assignments/:id/request-reupload`
Student requests permission to resubmit an evaluated or locked lab assignment.
- **Request Body:** `{ reason: string }`

#### `PATCH /lab-assignments/submissions/:submissionId/reupload-permission`
Supervisor or Admin reviews student resubmission request (`APPROVED` or `REJECTED`).
- **Request Body:** `{ status: "APPROVED" | "REJECTED", notes?: string }`

#### `POST /lab-assignments`
Creates a new laboratory experiment. Requires `SUPERVISOR` or `ADMIN`.
- **Request Body:**
```json
{
  "title": "Implementation of Dijkstra Algorithm",
  "objective": "Graph traversal and shortest path computation",
  "description": "Implement Dijkstra using a min-heap priority queue...",
  "subject": "Data Structures & Algorithms",
  "batchId": "cuid...",
  "submissionType": "CODING",
  "language": "cpp",
  "starterCode": "#include <iostream>...",
  "testCases": [
    { "input": "5 6\n1 2 2...", "expectedOutput": "0 2 3...", "isHidden": false, "weight": 20 }
  ],
  "timeLimit": 2.0,
  "memoryLimit": 128000,
  "totalPoints": 100,
  "dueDate": "2026-12-15T23:59:59Z"
}
```

#### `PATCH /lab-assignments/:id`
Updates assignment details, dates, or test cases. Requires `SUPERVISOR` or `ADMIN`.

#### `DELETE /lab-assignments/:id`
Deletes an assignment. Requires `SUPERVISOR` or `ADMIN`.

#### `GET /lab-assignments/:id/submissions`
Returns submission roster for all students in the batch for this lab. Requires `SUPERVISOR` or `ADMIN`.

#### `PATCH /lab-assignments/submissions/:submissionId/grade`
Manually adjusts scores, sets notebook/performance/viva marks, and leaves supervisor feedback.
- **Request Body:**
```json
{
  "score": 95,
  "manualScoreAdjust": 5,
  "notebookScore": 2.0,
  "performanceScore": 2.0,
  "vivaScore": 10.0,
  "supervisorFeedback": "Clean graph representation and optimal runtime."
}
```

#### Folder Management Endpoints
- `PATCH /lab-assignments/folders/rename` — Renames subject directory (`SUPERVISOR` / `ADMIN`).
- `PATCH /lab-assignments/folders/status` — Toggles active status of all labs in a subject folder.
- `POST /lab-assignments/folders/delete` — Deletes empty subject folder.

---

### Problem Statement Bank

Mounted at `/api/v1/problem-statements`.

#### `GET /problem-statements/catalog`
Returns approved problem statement repository visible to students for capstone selection. Filterable by domain, difficulty, and tech stack.

#### `GET /problem-statements/mine`
Returns proposals created by the current supervisor. Requires `SUPERVISOR`.

#### `GET /problem-statements/admin/pending`
Returns pending proposals awaiting administrative vetting. Requires `ADMIN`.

#### `POST /problem-statements`
Proposes a new problem statement. Requires `SUPERVISOR` or `ADMIN`.
- **Request Body:** `{ title, description, domain, technologies, difficulty, expectedOutcomes, prerequisites }`

#### `PATCH /problem-statements/:id/review`
Admin approves or rejects a proposed problem statement. Requires `ADMIN`.
- **Request Body:** `{ status: "APPROVED" | "REJECTED", adminFeedback?: string }`

---

### Continuous Evaluation Register

Mounted at `/api/v1/evaluations`. Aligned with university 100-mark statutory practical examination rubrics. Requires `SUPERVISOR` or `ADMIN`.

#### `GET /evaluations/course/:courseCode`
Returns evaluation register for an entire course cohort with student marks across all 10 experiments, internal viva, end-sem lab test, and end-sem viva. Computes totals and class averages.

#### `PUT /evaluations/course/:courseCode/student/:studentId`
Upserts continuous evaluation marks for a student.
- **Request Body:**
```json
{
  "experiments": [
    { "exp": 1, "notebook": 2.0, "performance": 2.0 },
    { "exp": 2, "notebook": 2.0, "performance": 1.5 }
  ],
  "internalViva": 9.0,
  "endSemLabTest": 28.0,
  "endSemViva": 18.0,
  "remarks": "Exemplary performance throughout semester."
}
```
**Scoring Formula:**
- `experimentsTotal` = $\sum (\text{notebook} + \text{performance})$ across up to 10 experiments (Max 40 marks).
- `totalInternal` = `experimentsTotal` + `internalViva` (Max 50 marks).
- `totalEndSem` = `endSemLabTest` (Max 30) + `endSemViva` (Max 20) = Max 50 marks.
- `finalMarks` = `totalInternal` + `totalEndSem` = Max 100 marks.

#### `POST /evaluations/course/:courseCode/bulk`
Bulk upserts marks for multiple students in a single transaction.

---

### File Storage & Presigned URLs

Mounted at `/api/v1/uploads`. Supports local disk storage (`uploads/`) with path traversal guards and optional AWS S3 presigned URLs.

#### `POST /uploads/file`
Uploads a single document or attachment (e.g. faculty lab manual, milestone report). Requires authentication.
- **Request Body:** `multipart/form-data` with field `file`.
- **Security:** Verified with magic-byte inspection, UUID renaming, and extension allowlisting.
- **Response `201`:**
```json
{
  "status": "success",
  "data": {
    "url": "/api/v1/uploads/files/1727600000-a1b2c3d4.pdf",
    "key": "1727600000-a1b2c3d4.pdf",
    "name": "lab-manual-dsa.pdf",
    "size": 1048576,
    "mimetype": "application/pdf"
  }
}
```

#### `GET /uploads/files/:filename`
Downloads or previews an uploaded file.
- **Security:** Requires authentication. Verifies that the requesting user owns the submission, is the assigned supervisor, belongs to the enrolled batch, or is an Administrator.
- **Headers:** Injects `X-Content-Type-Options: nosniff`, sanitizes Content-Disposition filenames, and applies restrictive Content-Security-Policy headers.

#### `GET /uploads/presigned/*key`
Returns presigned download URL for AWS S3 stored assets with permission verification.

---

## Role Reference

| Role | Permissions & Authority |
|---|---|
| `STUDENT` | Create & develop capstone projects, select problem statements, push Git code, submit milestone deliverables, execute code in sandbox, run & submit lab assignments, request resubmission permissions, inspect continuous marksheet. |
| `SUPERVISOR` | Oversee assigned capstone projects, approve/reject milestone gates, conduct line-by-line code reviews, create & publish lab experiments, grade coding and report submissions, review re-upload requests, enter continuous practical evaluation marks (100-mark register), propose problem statements. |
| `ADMIN` | Complete governance: system settings, user directory management, supervisor assignments, CSV roster import with formula sanitization, degree course and batch lifecycle, Gitea infrastructure configuration, audit log inspection. |

---

## Data Models

### User
```
id                  String            (CUID)
name                String
email               String            (unique)
password            String            (bcrypt hash)
role                STUDENT | SUPERVISOR | ADMIN
isEmailVerified     Boolean
universityId        String?           (unique)
department          String?
phoneNumber         String?
giteaUsername       String?           (unique)
refreshToken        String?           (Redis primary / DB fallback)
createdAt           DateTime
updatedAt           DateTime
```

### Course & Batch
```
Course:
  id            String   (CUID)
  code          String?  (unique, e.g. "BTCSE-CS")
  title         String
  description   String?
  durationYears Int
  isActive      Boolean

Batch:
  id        String   (CUID)
  name      String   (unique, e.g. "B.Tech CSE 2022-2026")
  courseId  String   → Course
  startYear Int
  endYear   Int
  isActive  Boolean
```

### Project & Milestone
```
Project:
  id              String            (CUID)
  title           String
  description     String?
  repoName        String?           (Gitea repo slug)
  repoUrl         String?           (Gitea clone/web URL)
  ownerId         String            → User
  supervisorId    String?           → User
  batchId         String            → Batch
  status          DRAFT | IN_PROGRESS | SUBMITTED | APPROVED | REJECTED | ARCHIVED
  technologies    String[]
  phase           Int               (1 to 4)
  members         ProjectMember[]
  milestones      Milestone[]
  evaluation      RubricEvaluation?

Milestone:
  id            String          (CUID)
  title         String
  description   String?
  dueDate       DateTime?
  status        PENDING | IN_PROGRESS | SUBMITTED | APPROVED | REJECTED
  projectId     String          → Project
  order         Int
  attachments   Json?           (Array of { name, key, url, size, mimetype })
  studentNotes  String?
  feedback      String?
  submittedById String?         → User
  reviewedById  String?         → User
```

### LabAssignment & LabSubmission
```
LabAssignment:
  id             String           (CUID)
  title          String
  subject        String?
  objective      String
  description    String
  submissionType CODING | PDF_REPORT
  language       String?
  manualUrl      String?
  starterCode    String?
  testCases      Json?            (Array of { id, input, expectedOutput, isHidden, weight })
  timeLimit      Float            (seconds)
  memoryLimit    Int              (KB)
  totalPoints    Int
  dueDate        DateTime?
  status         DRAFT | PUBLISHED | CLOSED | ARCHIVED
  batchId        String           → Batch
  creatorId      String           → User

LabSubmission:
  id                 String           (CUID)
  assignmentId       String           → LabAssignment
  studentId          String           → User
  code               String?          (source code)
  language           String?
  fileUrl            String?          (submitted PDF report)
  testsPassed        Int
  totalTests         Int
  testResults        Json?
  score              Float
  notebookScore      Float?           (Max 2)
  performanceScore   Float?           (Max 2)
  vivaScore          Float?           (Max 10)
  status             PENDING | RUNNING | EVALUATED | PASSED | FAILED
  reuploadStatus     String?          (PENDING | APPROVED | REJECTED | CONSUMED)
  attemptNumber      Int
```

### LabContinuousEvaluation
```
id                String   (CUID)
studentId         String   → User
courseCode        String
batchId           String?  → Batch
evaluatorId       String?  → User
experiments       Json     ([{ exp: 1, notebook: 2, performance: 2 }, ...])
experimentsTotal  Float    (Max 40)
internalViva      Float    (Max 10)
totalInternal     Float    (Max 50)
endSemLabTest     Float    (Max 30)
endSemViva        Float    (Max 20)
totalEndSem       Float    (Max 50)
finalMarks        Float    (Max 100)
remarks           String?
```

---

## Security Hardening & Mitigations

The platform's security posture has been systematically audited, hardened, and verified:

| Surface | Implemented Defense | Verification Status |
|---|---|---|
| **CSRF Defense** | Double-submit signed CSRF cookie with HMAC-SHA256 signature and timestamp validation. Mutating endpoints rejected if cookie/header mismatch or missing. | Verified in `app.ts` & test suite |
| **Session & Tokens** | Dual-token JWT (15-min access token + 7-day HTTP-only refresh token) with Refresh Token Rotation (RTR) backed by Redis revocation lists. | Verified in `authService.ts` & `refreshToken.test.ts` |
| **Webhook Authenticity** | Gitea webhooks validated with HMAC-SHA256 via constant-time comparison (`crypto.timingSafeEqual`). | Verified in `webhookRoutes.ts` |
| **File Traversal & Poisoning** | Strict filename sanitization using `path.basename()`, UUID disk renaming, binary magic byte header validation, and ownership authorization checks on download. | Verified in `uploadRoutes.ts` & `fileUploadMiddleware.ts` |
| **Object Authorization (IDOR/BOLA)** | Student lab responses strip hidden test cases; continuous evaluation updates verify supervisor batch assignment; project files restricted to enrolled members. | Verified in route controllers & `securityHardening.test.ts` |
| **SSRF Prevention** | Gitea integration config validates hostnames, resolves DNS, and blocks RFC1918 private, loopback, and link-local ranges. | Verified in `adminController.ts` |
| **CSV Formula Injection** | Admin roster CSV imports sanitize dangerous leading characters (`=`, `+`, `-`, `@`, `\t`, `\r`) to protect faculty spreadsheet applications. | Verified in `client/src/utils/security.ts` |

