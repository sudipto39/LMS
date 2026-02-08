/**
 * ============================================
 * Projects API Service
 * ============================================
 * CRUD for projects, milestones, progress, submissions
 *
 * BACKEND ROUTE FILE: routes/projects.js
 * BACKEND CONTROLLER: controllers/projectController.js
 * BACKEND MODEL: models/Project.js
 */

import client from './client';

// ── Types ──

export interface Project {
  _id: string;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  student: { _id: string; name: string; email: string };
  professor: { _id: string; name: string; email: string };
  teamMembers?: { _id: string; name: string; email: string }[];
  batch: string;
  course: string;
  techStack: string[];
  repoUrl?: string;
  repoName?: string;
  giteaRepoId?: number;
  progress: number;
  deadline?: string;
  lastPush?: string;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  batch: string;
  course: string;
  professorId: string;
  techStack: string[];
  teamMemberIds?: string[];
  repoOption: 'create_new' | 'link_existing';
  existingRepoUrl?: string;
}

export interface Milestone {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  completedAt?: string;
  professorComment?: string;
  order: number;
}

export interface ProgressUpdate {
  _id: string;
  projectId: string;
  percentage: number;
  note?: string;
  commitCount?: number;
  weekStart: string;
  createdAt: string;
}

export interface FeedbackComment {
  _id: string;
  projectId: string;
  author: { _id: string; name: string; role: string };
  content: string;
  createdAt: string;
}

export interface ProjectFile {
  _id: string;
  projectId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: { _id: string; name: string };
  uploadedAt: string;
  url: string;
}

// ── Query params ──

export interface ProjectFilters {
  status?: string;
  batch?: string;
  course?: string;
  professorId?: string;
  studentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── API Methods ──

const projectsAPI = {
  // ─── Projects CRUD ───

  /**
   * GET /api/projects
   * Query: ProjectFilters
   * Returns: PaginatedResponse<Project>
   * Access: Student sees own, Professor sees assigned, Admin sees all
   */
  getAll: (filters?: ProjectFilters) =>
    client.get<PaginatedResponse<Project>>('/projects', { params: filters }),

  /**
   * GET /api/projects/:id
   * Returns: Project (populated with student, professor, milestones)
   */
  getById: (id: string) =>
    client.get<Project>(`/projects/${id}`),

  /**
   * POST /api/projects
   * Body: CreateProjectPayload
   * Returns: Project
   * Side effect: If repoOption='create_new', creates Gitea repo via Gitea API
   */
  create: (payload: CreateProjectPayload) =>
    client.post<Project>('/projects', payload),

  /**
   * PATCH /api/projects/:id
   * Body: Partial<Project>
   * Returns: Project
   */
  update: (id: string, payload: Partial<Project>) =>
    client.patch<Project>(`/projects/${id}`, payload),

  /**
   * DELETE /api/projects/:id
   * Admin only. Also optionally deletes Gitea repo.
   */
  delete: (id: string) =>
    client.delete(`/projects/${id}`),

  /**
   * POST /api/projects/:id/submit
   * Student submits project for final review
   * Returns: Project with status='submitted'
   */
  submitFinal: (id: string) =>
    client.post<Project>(`/projects/${id}/submit`),

  /**
   * POST /api/projects/:id/approve
   * Professor approves the project
   * Body: { grade?, comment? }
   */
  approve: (id: string, data?: { grade?: string; comment?: string }) =>
    client.post<Project>(`/projects/${id}/approve`, data),

  /**
   * POST /api/projects/:id/reject
   * Professor rejects / requests changes
   * Body: { comment }
   */
  reject: (id: string, comment: string) =>
    client.post<Project>(`/projects/${id}/reject`, { comment }),

  // ─── Milestones ───

  /**
   * GET /api/projects/:id/milestones
   */
  getMilestones: (projectId: string) =>
    client.get<Milestone[]>(`/projects/${projectId}/milestones`),

  /**
   * POST /api/projects/:id/milestones
   * Body: { title, description?, dueDate, order }
   */
  createMilestone: (projectId: string, data: Partial<Milestone>) =>
    client.post<Milestone>(`/projects/${projectId}/milestones`, data),

  /**
   * PATCH /api/projects/:id/milestones/:milestoneId
   */
  updateMilestone: (projectId: string, milestoneId: string, data: Partial<Milestone>) =>
    client.patch<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, data),

  /**
   * POST /api/projects/:id/milestones/:milestoneId/complete
   * Student marks milestone as completed (pending professor approval)
   */
  completeMilestone: (projectId: string, milestoneId: string) =>
    client.post(`/projects/${projectId}/milestones/${milestoneId}/complete`),

  /**
   * POST /api/projects/:id/milestones/:milestoneId/approve
   * Professor approves milestone
   */
  approveMilestone: (projectId: string, milestoneId: string, comment?: string) =>
    client.post(`/projects/${projectId}/milestones/${milestoneId}/approve`, { comment }),

  /**
   * POST /api/projects/:id/milestones/:milestoneId/reject
   * Professor rejects milestone
   */
  rejectMilestone: (projectId: string, milestoneId: string, comment: string) =>
    client.post(`/projects/${projectId}/milestones/${milestoneId}/reject`, { comment }),

  // ─── Progress ───

  /**
   * GET /api/projects/:id/progress
   * Returns weekly progress data + commit counts
   */
  getProgress: (projectId: string) =>
    client.get<ProgressUpdate[]>(`/projects/${projectId}/progress`),

  /**
   * POST /api/projects/:id/progress
   * Body: { percentage, note? }
   */
  updateProgress: (projectId: string, data: { percentage: number; note?: string }) =>
    client.post<ProgressUpdate>(`/projects/${projectId}/progress`, data),

  // ─── Feedback / Comments ───

  /**
   * GET /api/projects/:id/feedback
   */
  getFeedback: (projectId: string) =>
    client.get<FeedbackComment[]>(`/projects/${projectId}/feedback`),

  /**
   * POST /api/projects/:id/feedback
   * Body: { content }
   */
  addFeedback: (projectId: string, content: string) =>
    client.post<FeedbackComment>(`/projects/${projectId}/feedback`, { content }),

  // ─── Files ───

  /**
   * GET /api/projects/:id/files
   */
  getFiles: (projectId: string) =>
    client.get<ProjectFile[]>(`/projects/${projectId}/files`),

  /**
   * POST /api/projects/:id/files
   * Body: FormData (multipart/form-data)
   * Field: "file" — the uploaded file (PDF, PPT, ZIP, etc.)
   */
  uploadFile: (projectId: string, formData: FormData) =>
    client.post<ProjectFile>(`/projects/${projectId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * DELETE /api/projects/:id/files/:fileId
   */
  deleteFile: (projectId: string, fileId: string) =>
    client.delete(`/projects/${projectId}/files/${fileId}`),

  /**
   * GET /api/projects/:id/download-zip
   * Downloads the entire repo as ZIP from Gitea
   * Returns: Blob
   */
  downloadZip: (projectId: string) =>
    client.get(`/projects/${projectId}/download-zip`, { responseType: 'blob' }),
};

export default projectsAPI;
