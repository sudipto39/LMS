# LMS Backend Folder Structure

This document describes the folder structure for the backend (server) part of the LMS project.

```
server/
│   .env
│   .env.example
│   package.json
│   tsconfig.json
│
└───src/
    │   app.ts
    │   index.ts
    │
    ├───config/
    │       db.ts
    │       env.ts
    │       gitea.ts
    │       resend.ts
    │
    ├───controllers/
    │       activityController.ts
    │       adminController.ts
    │       authController.ts
    │       courseController.ts
    │       giteaController.ts
    │       milestoneController.ts
    │       projectController.ts
    │       supervisorController.ts
    │       userController.ts
    │
    ├───middlewares/
    │       authMiddleware.ts
    │       fileUploadMiddleware.ts
    │       globalErrorHandler.ts
    │       notFound.ts
    │
    ├───models/
    │       activityModel.ts
    │       batchModel.ts
    │       courseModel.ts
    │       milestoneModel.ts
    │       projectModel.ts
    │       userModel.ts
    │
    ├───routes/
    │       activityRoutes.ts
    │       adminRoutes.ts
    │       authRoutes.ts
    │       courseRoutes.ts
    │       giteaRoutes.ts
    │       milestoneRoutes.ts
    │       projectRoutes.ts
    │       supervisorRoutes.ts
    │       userRoutes.ts
    │       webhookRoutes.ts
    │
    ├───schemas/
    │       signInSchema.ts
    │       signUpSchema.ts
    │       verifySchema.ts
    │
    ├───services/
    │       activityService.ts
    │       authService.ts
    │       giteaService.ts
    │       sendVerificationEmail.ts
    │
    ├───types/
    │       express.d.ts
    │
    ├───utils/
    │       appError.ts
    │       catchAsync.ts
    │       createSendToken.ts
    │       requireObjectId.ts
    │
    └───webhooks/
            giteaWebhook.ts
            webhookController.ts
```

---

- Each folder contains related modules for the backend API.
- Configuration files are in `config/`.
- Controllers handle request logic in `controllers/`.
- Middlewares for Express are in `middlewares/`.
- Data models are in `models/`.
- Route definitions are in `routes/`.
- Validation schemas are in `schemas/`.
- Service logic is in `services/`.
- Utility/helper functions are in `utils/`.
- Webhook handlers are in `webhooks/`.
- Type definitions are in `types/`.

## Updated Parts

- Added backend folder structure documentation.
- Included all backend routes and route modules.

## Backend Routes

The backend exposes the following API route groups under `/api/v1`.

### Auth Routes (`authRoutes.ts`)
- `POST /api/v1/auth/register` — user registration
- `POST /api/v1/auth/verify-email` — verify account email
- `POST /api/v1/auth/login` — login
- `POST /api/v1/auth/forgot-password` — request password reset
- `PATCH /api/v1/auth/reset-password/:token` — reset password (protected)
- `POST /api/v1/auth/logout` — logout (protected)

### User Routes (`userRoutes.ts`)
- `GET /api/v1/users/me` — current user profile (protected)
- `PATCH /api/v1/users/updateMe` — update current user data (protected)
- `GET /api/v1/users/supervisors` — list supervisors (protected)
- `GET /api/v1/users/getAllUsers` — list all users (admin only)
- `GET /api/v1/users/:id` — get user by ID (admin only)

### Admin Routes (`adminRoutes.ts`)
- `GET /api/v1/admin/stats` — admin dashboard statistics
- `GET /api/v1/admin/projects` — list all projects for admin
- `PATCH /api/v1/admin/projects/:id/assign-supervisor` — assign supervisor to a project

### Course Routes (`courseRoutes.ts`)
- `GET /api/v1/courses/allcourses` — list all courses
- `GET /api/v1/courses/:id` — get course details
- `POST /api/v1/courses/create` — create a new course (admin only)
- `PATCH /api/v1/courses/:id` — update a course (admin only)
- `DELETE /api/v1/courses/:id` — delete a course (admin only)

### Project Routes (`projectRoutes.ts`)
- `POST /api/v1/projects/create` — create a project (student only)
- `GET /api/v1/projects/me` — get projects for current student
- `GET /api/v1/projects/supervised` — get projects supervised by current supervisor/admin
- `GET /api/v1/projects/:id` — get single project by ID
- `PATCH /api/v1/projects/:id` — update a project (student only)

### Activity Routes (`activityRoutes.ts`)
- `GET /api/v1/activities/me` — get activity for current user
- `GET /api/v1/activities/project/:projectId` — get activity for a project
- `GET /api/v1/activities/supervisor` — get supervisor activity (supervisor only)
- `GET /api/v1/activities/admin` — get admin activity (admin only)

### Milestone Routes (`milestoneRoutes.ts`)
- `POST /api/v1/projects/:projectId/milestones` — create a milestone for a project
- `GET /api/v1/projects/:projectId/milestones` — list milestones for a project
- `PATCH /api/v1/milestones/:id/submit` — submit a milestone (student only)
- `PATCH /api/v1/milestones/:id/approve` — approve a milestone (projectSupervisor/admin)
- `PATCH /api/v1/milestones/:id/reject` — reject a milestone (projectSupervisor/admin)
- `GET /api/v1/me/submissions` — get current student's milestone submissions

### Supervisor Routes (`supervisorRoutes.ts`)
- `GET /api/v1/supervisors/allsupervisors` — list all supervisor users
- `GET /api/v1/supervisors/dashboard` — supervisor dashboard data
- `GET /api/v1/supervisors/projects` — projects assigned to supervisor
- `GET /api/v1/supervisors/milestones/pending` — pending milestone reviews
- `PATCH /api/v1/supervisors/milestones/:id/review` — review a milestone submission
- `GET /api/v1/supervisors/activity` — supervisor activity feed

### Gitea Routes (`giteaRoutes.ts`)
- `POST /api/v1/gitea/repos` — create a repository (student only)
- `GET /api/v1/gitea/repos/:owner/:repo` — get repository details
- `GET /api/v1/gitea/repos/:owner/:repo/commits` — list commits
- `GET /api/v1/gitea/repos/:owner/:repo/branches` — list branches

### Webhook Routes (`webhookRoutes.ts`)
- `POST /api/v1/webhooks/gitea` — Gitea webhook receiver

---

- Each route group is mounted in `src/app.ts`.
- Authentication and role restrictions are enforced by middleware in `src/middlewares/authMiddleware.ts`.
- The webhook route validates the Gitea signature before processing payloads.
