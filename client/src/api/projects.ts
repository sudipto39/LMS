// /**
//  * ============================================
//  * Projects API Service
//  * ============================================
//  * Base Path: /api/v1/projects
//  * 
//  * Endpoints:
//  * - POST / — Create a new project (student only)
//  * - GET /me — Get projects of current student (student only)
//  * - PATCH /:id — Update a project (student only)
//  * - GET /supervised — Get projects supervised by current user (supervisor/admin only)
//  *
//  * Milestone Routes (nested under /api/v1):
//  * - POST /projects/:projectId/milestones — Create milestone
//  * - GET /projects/:projectId/milestones — Get milestones for a project
//  * - PATCH /milestones/:id/submit — Submit milestone (student only)
//  * - PATCH /milestones/:id/approve — Approve milestone (supervisor/admin only)
//  * - PATCH /milestones/:id/reject — Reject milestone (supervisor/admin only)
//  * - GET /me/submissions — Get current user's milestone submissions
//  *
//  * BACKEND ROUTE FILE: routes/projects.js
//  * BACKEND CONTROLLER: controllers/projectController.js
//  * BACKEND MODEL: models/Project.js
//  */

// import client from './client';

// // ── API Version Prefix ──
// const BASE = '/v1/projects';
// const MILESTONES_BASE = '/v1/milestones';

// // ── Types ──

// export interface Project {
//   _id: string;
//   title: string;
//   description: string;
//   status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
//   student: { _id: string; fullName: string; email: string };
//   supervisor: { _id: string; fullName: string; email: string };
//   teamMembers?: { _id: string; fullName: string; email: string }[];
//   batch: string;
//   course: string;
//   techStack: string[];
//   repoUrl?: string;
//   repoName?: string;
//   giteaRepoId?: number;
//   progress: number;
//   deadline?: string;
//   lastPush?: string;
//   grade?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface CreateProjectPayload {
//   title: string;
//   description: string;
//   batch: string;
//   course: string;
//   supervisorId: string;
//   techStack: string[];
//   teamMemberIds?: string[];
//   repoOption: 'create_new' | 'link_existing';
//   repoName?: string; // Repository name when creating new repo
//   existingRepoUrl?: string;
// }

// export interface Milestone {
//   _id: string;
//   projectId: string;
//   title: string;
//   description?: string;
//   dueDate: string;
//   status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
//   completedAt?: string;
//   supervisorComment?: string;
//   order: number;
// }

// export interface ProgressUpdate {
//   _id: string;
//   projectId: string;
//   percentage: number;
//   note?: string;
//   commitCount?: number;
//   weekStart: string;
//   createdAt: string;
// }

// export interface FeedbackComment {
//   _id: string;
//   projectId: string;
//   author: { _id: string; fullName: string; role: string };
//   content: string;
//   createdAt: string;
// }

// export interface ProjectFile {
//   _id: string;
//   projectId: string;
//   filename: string;
//   originalName: string;
//   mimeType: string;
//   size: number;
//   uploadedBy: { _id: string; fullName: string };
//   uploadedAt: string;
//   url: string;
// }

// // ── Query params ──

// export interface ProjectFilters {
//   status?: string;
//   batch?: string;
//   course?: string;
//   supervisorId?: string;
//   studentId?: string;
//   search?: string;
//   page?: number;
//   limit?: number;
//   sortBy?: string;
//   sortOrder?: 'asc' | 'desc';
// }

// export interface PaginatedResponse<T> {
//   status: string;
//   results: number;
//   data: T[];
//   total?: number;
//   page?: number;
//   limit?: number;
//   totalPages?: number;
// }

// // ── API Methods ──

// const projectsAPI = {
//   // ─── Projects CRUD ───

//   /**
//    * POST /api/v1/projects/create
//    * Create a new project (student only)
//    * Body: CreateProjectPayload
//    * Returns: { status, data: { project } }
//    * Side effect: If repoOption='create_new', creates Gitea repo via Gitea API
//    * Note: For linking existing repo, backend will validate access to the repo and extract necessary info (repo name, etc.)
//    */
//   create: (payload: CreateProjectPayload) =>
//     client.post<{ status: string; data: { project: Project } }>(`${BASE}/create`, payload),

//   /**
//    * GET /api/v1/projects/me
//    * Get projects of current student
//    * Returns: PaginatedResponse<Project>
//    */
//   getMyProjects: (filters?: ProjectFilters) =>
//     client.get<PaginatedResponse<Project>>(`${BASE}/me`, { params: filters }),

//   /**
//    * PATCH /api/v1/projects/:id
//    * Update a project (student only)
//    * URL Param: id
//    * Body: Partial<Project>
//    * Returns: { status, data: { project } }
//    */
//   update: (id: string, payload: Partial<Project>) =>
//     client.patch<{ status: string; data: { project: Project } }>(`${BASE}/${id}`, payload),

//   /**
//    * GET /api/v1/projects/supervised
//    * Get projects supervised by current user (supervisor/admin only)
//    * Returns: PaginatedResponse<Project>
//    */
//   getSupervised: (filters?: ProjectFilters) =>
//     client.get<PaginatedResponse<Project>>(`${BASE}/supervised`, { params: filters }),

//   /**
//    * GET /api/v1/projects/supervised (alias)
//    * Same as getSupervised - for clearer naming
//    */
//   getSupervisedProjects: (filters?: ProjectFilters) =>
//     client.get<PaginatedResponse<Project>>(`${BASE}/supervised`, { params: filters }),

//   // ── Legacy/Extended endpoints (may need to be added to backend) ──

//   /**
//    * GET /api/v1/projects
//    * Get all projects (with role-based filtering)
//    * Query: ProjectFilters
//    */
//   getAll: (filters?: ProjectFilters) =>
//     client.get<PaginatedResponse<Project>>(`${BASE}`, { params: filters }),

//   /**
//    * GET /api/v1/projects/:id
//    * Get single project by ID
//    * URL Param: id
//    */
//   getById: (id: string) =>
//     client.get<{ status: string; data: { project: Project } }>(`${BASE}/${id}`),

//   /**
//    * DELETE /api/v1/projects/:id
//    * Delete project (admin only)
//    * Also optionally deletes Gitea repo.
//    */
//   delete: (id: string) =>
//     client.delete(`${BASE}/${id}`),

//   /**
//    * POST /api/v1/projects/:id/submit
//    * Student submits project for final review
//    */
//   submitFinal: (id: string) =>
//     client.post<{ status: string; data: { project: Project } }>(`${BASE}/${id}/submit`),

//   /**
//    * POST /api/v1/projects/:id/approve
//    * Supervisor approves the project
//    * Body: { grade?, comment? }
//    */
//   approve: (id: string, data?: { grade?: string; comment?: string }) =>
//     client.post<{ status: string; data: { project: Project } }>(`${BASE}/${id}/approve`, data),

//   /**
//    * POST /api/v1/projects/:id/reject
//    * Supervisor rejects / requests changes
//    * Body: { comment }
//    */
//   reject: (id: string, comment: string) =>
//     client.post<{ status: string; data: { project: Project } }>(`${BASE}/${id}/reject`, { comment }),

//   // ─── Milestones ───

//   /**
//    * GET /api/v1/projects/:projectId/milestones
//    * Get milestones for a project
//    * URL Param: projectId
//    */
//   getMilestones: (projectId: string) =>
//     client.get<{ status: string; data: Milestone[] }>(`${BASE}/${projectId}/milestones`),

//   /**
//    * POST /api/v1/projects/:projectId/milestones
//    * Create a milestone for a project
//    * Body: { title, description?, dueDate, order }
//    */
//   createMilestone: (projectId: string, data: Partial<Milestone>) =>
//     client.post<{ status: string; data: { milestone: Milestone } }>(`${BASE}/${projectId}/milestones`, data),

//   /**
//    * PATCH /api/v1/milestones/:id/submit
//    * Student submits milestone (marks as completed, awaiting approval)
//    * URL Param: id (milestone ID)
//    * Body: { submissionData? }
//    */
//   submitMilestone: (milestoneId: string, data?: object) =>
//     client.patch<{ status: string; data: { milestone: Milestone } }>(`${MILESTONES_BASE}/${milestoneId}/submit`, data),

//   /**
//    * PATCH /api/v1/milestones/:id/approve
//    * Supervisor approves milestone
//    * URL Param: id (milestone ID)
//    */
//   approveMilestone: (milestoneId: string, comment?: string) =>
//     client.patch<{ status: string; data: { milestone: Milestone } }>(`${MILESTONES_BASE}/${milestoneId}/approve`, { comment }),

//   /**
//    * PATCH /api/v1/milestones/:id/reject
//    * Supervisor rejects milestone
//    * URL Param: id (milestone ID)
//    * Body: { comment }
//    */
//   rejectMilestone: (milestoneId: string, comment: string) =>
//     client.patch<{ status: string; data: { milestone: Milestone } }>(`${MILESTONES_BASE}/${milestoneId}/reject`, { comment }),

//   /**
//    * GET /api/v1/me/submissions
//    * Get current user's milestone submissions
//    */
//   getMySubmissions: () =>
//     client.get<{ status: string; data: Milestone[] }>('/v1/me/submissions'),

//   // Legacy compatibility method (maps to submitMilestone)
//   completeMilestone: (projectId: string, milestoneId: string) =>
//     client.patch(`${MILESTONES_BASE}/${milestoneId}/submit`, { projectId }),

//   // ─── Progress ───

//   /**
//    * GET /api/v1/projects/:id/progress
//    * Get weekly progress data + commit counts
//    */
//   getProgress: (projectId: string) =>
//     client.get<{ status: string; data: ProgressUpdate[] }>(`${BASE}/${projectId}/progress`),

//   /**
//    * POST /api/v1/projects/:id/progress
//    * Update progress percentage
//    * Body: { percentage, note? }
//    */
//   updateProgress: (projectId: string, data: { percentage: number; note?: string }) =>
//     client.post<{ status: string; data: { progress: ProgressUpdate } }>(`${BASE}/${projectId}/progress`, data),

//   // ─── Feedback / Comments ───

//   /**
//    * GET /api/v1/projects/:id/feedback
//    * Get feedback comments for a project
//    */
//   getFeedback: (projectId: string) =>
//     client.get<{ status: string; data: FeedbackComment[] }>(`${BASE}/${projectId}/feedback`),

//   /**
//    * POST /api/v1/projects/:id/feedback
//    * Add feedback comment
//    * Body: { content }
//    */
//   addFeedback: (projectId: string, content: string) =>
//     client.post<{ status: string; data: { feedback: FeedbackComment } }>(`${BASE}/${projectId}/feedback`, { content }),

//   // ─── Files ───

//   /**
//    * GET /api/v1/projects/:id/files
//    * Get uploaded files for a project
//    */
//   getFiles: (projectId: string) =>
//     client.get<{ status: string; data: ProjectFile[] }>(`${BASE}/${projectId}/files`),

//   /**
//    * POST /api/v1/projects/:id/files
//    * Upload file to project
//    * Body: FormData (multipart/form-data)
//    * Field: "file"
//    */
//   uploadFile: (projectId: string, formData: FormData) =>
//     client.post<{ status: string; data: { file: ProjectFile } }>(`${BASE}/${projectId}/files`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),

//   /**
//    * DELETE /api/v1/projects/:id/files/:fileId
//    * Delete an uploaded file
//    */
//   deleteFile: (projectId: string, fileId: string) =>
//     client.delete(`${BASE}/${projectId}/files/${fileId}`),

//   /**
//    * GET /api/v1/projects/:id/download-zip
//    * Download entire repo as ZIP from Gitea
//    * Returns: Blob
//    */
//   downloadZip: (projectId: string) =>
//     client.get(`${BASE}/${projectId}/download-zip`, { responseType: 'blob' }),
// };

// export default projectsAPI;

// src/api/projects.ts
import client from "./client";
import type { Project, PaginatedResponse } from "../types";

const BASE = "/v1/projects";

export interface CreateProjectPayload {
  title: string;
  description?: string;
  batchId: string;
  repoName?: string;
  technologies?: string[];
  supervisorId?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  technologies?: string[];
  status?: string;
}

const projectsAPI = {
  create: (payload: CreateProjectPayload) =>
    client.post<{ status: string; data: Project }>(`${BASE}/create`, payload),

  getMyProjects: () =>
    client.get<PaginatedResponse<Project>>(`${BASE}/me`),

  getSupervisedProjects: () =>
    client.get<PaginatedResponse<Project>>(`${BASE}/supervised`),

  getById: (id: string) =>
    client.get<{ status: string; data: Project }>(`${BASE}/${id}`),

  update: (id: string, payload: UpdateProjectPayload) =>
    client.patch<{ status: string; data: Project }>(`${BASE}/${id}`, payload),
};

export default projectsAPI;