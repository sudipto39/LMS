/**
 * ============================================
 * API barrel export
 * ============================================
 * Import all API services from one place:
 *   import { authAPI, projectsAPI, usersAPI, giteaAPI, adminAPI } from '@/api';
 */

export { default as authAPI } from './auth';
export { default as projectsAPI } from './projects';
export { default as usersAPI } from './users';
export { default as giteaAPI } from './gitea';
export { default as adminAPI } from './admin';
export { default as chatAPI } from './chat';
export { default as apiClient } from './client';
export { getErrorMessage } from './client';

// Re-export types
export type { LoginPayload, LoginResponse, RegisterPayload } from './auth';
export type { Project, CreateProjectPayload, Milestone, ProgressUpdate, FeedbackComment, ProjectFile, ProjectFilters } from './projects';
export type { User, CreateUserPayload, UserFilters } from './users';
export type { GiteaRepo, GiteaCommit, GiteaPushEvent, GiteaSettings } from './gitea';
export type { Batch, Course, AuditLog, DashboardStats } from './admin';
