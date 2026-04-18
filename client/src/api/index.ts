// /**
//  * ============================================
//  * API barrel export
//  * ============================================
//  * Import all API services from one place:
//  *   import { authAPI, projectsAPI, usersAPI, giteaAPI, adminAPI } from '@/api';
//  */

// export { default as authAPI } from './auth';
// export { default as projectsAPI } from './projects';
// export { default as usersAPI } from './users';
// export { default as giteaAPI } from './gitea';
// export { default as adminAPI } from './admin';
// export { default as chatAPI } from './chat';
// export { default as apiClient } from './client';
// export { getErrorMessage } from './client';

// // Re-export types
// export type { LoginPayload, LoginResponse, RegisterPayload } from './auth';
// export type { Project, CreateProjectPayload, Milestone, ProgressUpdate, FeedbackComment, ProjectFile, ProjectFilters } from './projects';
// export type { User, CreateUserPayload, UserFilters } from './users';
// export type { GiteaRepo, GiteaCommit, GiteaPushEvent, GiteaSettings } from './gitea';
// export type { Batch, Course, AuditLog, DashboardStats } from './admin';

// src/api/index.ts
export { default as authAPI } from "./auth.js";
export { default as usersAPI } from "./users.js";
export { default as projectsAPI } from "./projects.js";
export { default as milestonesAPI } from "./milestones.js";
export { default as batchesAPI } from "./batches.js";
export { default as activitiesAPI } from "./activities.js";
export { default as supervisorsAPI } from "./supervisors.js";
export { default as adminAPI } from "./admin.js";
export { default as giteaAPI } from "./gitea.js";
export { default as chatAPI } from "./chat.js";
export { default as apiClient } from "./client.js";
export { getErrorMessage } from "./client.js";

export type { LoginPayload, RegisterPayload } from "./auth.js";
export type { UpdateMePayload } from "./users.js";
export type { CreateProjectPayload, UpdateProjectPayload } from "./projects.js";
export type { CreateMilestonePayload } from "./milestones.js";
export type { ReviewMilestonePayload } from "./supervisors.js";