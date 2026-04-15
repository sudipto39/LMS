# GiteaForge LMS — API Documentation

> **Generated from source code analysis.**  
> Fields marked ⚠️ indicate inferred behaviour or known caveats discovered during analysis.

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Versioning](#base-url--versioning)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Error Model](#error-model)
6. [Resources](#resources)
   - [Health](#health)
   - [Auth](#auth)
   - [Users](#users)
   - [Courses](#courses)
   - [Projects](#projects)
   - [Milestones](#milestones)
   - [Supervisors](#supervisors)
   - [Admin](#admin)
   - [Activities](#activities)
   - [Gitea (Repository Proxy)](#gitea-repository-proxy)
   - [Webhooks](#webhooks)
7. [File Uploads](#file-uploads)
8. [Role Reference](#role-reference)
9. [Data Models](#data-models)
10. [Known Caveats & Likely Bugs](#known-caveats--likely-bugs)

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

## File Uploads

File uploads are handled by [Multer](https://github.com/expressjs/multer) on the `PATCH /milestones/:id/submit` endpoint.

| Property | Value |
|---|---|
| Field name | `files` (array) |
| Max files | 5 |
| Max file size | 5 MB per file |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png` |
| Storage | Local disk — `uploads/` directory |
| Filename | `<timestamp>-<random>.<ext>` |
| Public URL | `GET /uploads/<filename>` |

> ⚠️ **Known issue:** File paths are not persisted to the database. After upload, there is no way to retrieve which files were attached to a milestone via the API. This is a significant gap in the implementation.

---

## Role Reference

| Role | Description |
|---|---|
| `STUDENT` | Default role. Can create projects, milestones, submit milestones. |
| `SUPERVISOR` | Assigned to projects by admin. Can review/approve/reject milestones. |
| `ADMIN` | Full platform access. Manages users, courses, assigns supervisors. |

Roles are assigned at registration (`STUDENT` or `SUPERVISOR` only — `ADMIN` must be set directly in the database).

---

## Data Models

### User
```
id               String   (CUID)
name             String
email            String   (unique)
role             STUDENT | SUPERVISOR | ADMIN
isEmailVerified  Boolean
giteaUsername    String?  (unique)
createdAt        DateTime
updatedAt        DateTime
```

### Course
```
id           String   (CUID)
title        String
description  String?
createdAt    DateTime
updatedAt    DateTime
batches      Batch[]
```

### Batch
```
id        String   (CUID)
name      String   (unique)
courseId  String
createdAt DateTime
```

### Project
```
id           String   (CUID)
title        String
description  String?
repoName     String?  (unique — Gitea repo name)
repoUrl      String?  (Gitea HTML URL)
ownerId      String   → User
supervisorId String?  → User
batchId      String   → Batch
createdAt    DateTime
updatedAt    DateTime
```

### Milestone
```
id          String   (CUID)
title       String
description String?
dueDate     DateTime?
status      PENDING | SUBMITTED | APPROVED | REJECTED
projectId   String   → Project (cascade delete)
feedback    String?
submittedAt DateTime?
reviewedAt  DateTime?
createdAt   DateTime
updatedAt   DateTime
```

### Activity
```
id        String   (CUID)
type      String   (PROJECT_CREATED | MILESTONE_SUBMITTED | MILESTONE_APPROVED | MILESTONE_REJECTED | PUSH)
payload   Json
userId    String?  → User
projectId String?  → Project
createdAt DateTime
```

---

## Known Caveats & Likely Bugs

| # | Severity | Location | Description |
|---|---|---|---|
| 1 | 🔴 High | `POST /projects/create` | Webhook URL uses `CLIENT_URL` (frontend origin) instead of the server's own URL. Gitea webhooks will point to the wrong host if frontend and backend are on different domains. |
| 2 | 🔴 High | `POST /gitea/repos` | Passes `req.user.id` (internal CUID) as the Gitea owner username. Will fail at the Gitea API level. Should use `giteaUsername`. |
| 3 | 🔴 High | `PATCH /milestones/:id/submit` | Uploaded files are saved to disk but their paths are never stored in the database. File attachments are effectively untrackable after upload. |
| 4 | 🟡 Medium | `GET /projects/:projectId/milestones` | No ownership or role check. Any authenticated user can read milestones for any project ID. |
| 5 | 🟡 Medium | `GET /activities/project/:projectId` | No access control. Any authenticated user can read activity for any project. |
| 6 | 🟡 Medium | `PATCH /auth/reset-password` schema | `resetPasswordSchema` validates `params.token` but the route has no URL parameter. The `params` block is dead code; the actual reset uses `email` + `code` from the body. |
| 7 | 🟡 Medium | Duplicate endpoints | `GET /users/supervisors` and `GET /supervisors/allsupervisors` return identical data. `PATCH /supervisors/milestones/:id/review` duplicates `PATCH /milestones/:id/approve` and `PATCH /milestones/:id/reject`. |
| 8 | 🟡 Medium | `requireVerifiedEmail` middleware | Defined in `authMiddleware.ts` but never applied to any route. Email verification status is not enforced on any protected endpoint. |
| 9 | 🟢 Low | `POST /auth/register` | `ADMIN` role cannot be self-assigned (schema only allows `STUDENT`/`SUPERVISOR`), but there is no admin-creation endpoint. Admins must be seeded directly in the database. |
| 10 | 🟢 Low | Activity limits | `getMyActivity` returns max 20, `getSupervisorActivity` max 30, `getAdminActivity` max 50. No pagination is implemented anywhere. |
| 11 | 🟢 Low | Batch management | The `Batch` and `BatchEnrollment` models exist in the schema but there are no API endpoints to create batches, list batches, or enroll students. `batchId` is required when creating a project, but batches can only be created directly in the database. |
