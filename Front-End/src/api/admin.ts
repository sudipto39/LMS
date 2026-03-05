/**
 * ============================================
 * Admin API Service
 * ============================================
 * Batches, courses, audit logs, dashboard stats
 *
 * BACKEND ROUTE FILE: routes/admin.js
 * BACKEND CONTROLLER: controllers/adminController.js
 */

import client from './client';

// ── Types ──

export interface Batch {
  _id: string;
  name: string;
  year: number;
  course: string;
  department: string;
  studentCount: number;
  professors: { _id: string; name: string }[];
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  isActive: boolean;
}

export interface AuditLog {
  _id: string;
  action: string;           // e.g. 'user.login', 'project.create', 'repo.push'
  userId: { _id: string; name: string; role: string };
  targetType?: string;       // 'project', 'user', 'repo'
  targetId?: string;
  details?: string;
  ip?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalProfessors: number;
  totalProjects: number;
  activeProjects: number;
  submittedProjects: number;
  approvedProjects: number;
  reposCreated: number;
  giteaStatus: 'connected' | 'disconnected' | 'error';
}

// ── API Methods ──

const adminAPI = {
  // ─── Dashboard ───

  /**
   * GET /api/v1/admin/stats
   * Returns: DashboardStats
   */
  getDashboardStats: () =>
    client.get<DashboardStats>('/v1/admin/stats'),

  /**
   * GET /api/v1/admin/projects
   * Get all projects (admin only)
   */
  getAllProjects: () =>
    client.get('/v1/admin/projects'),

  /**
   * PATCH /api/v1/admin/projects/:id/assign-supervisor
   * Assign supervisor to a project
   * Body: { supervisorId }
   */
  assignSupervisor: (projectId: string, supervisorId: string) =>
    client.patch(`/v1/admin/projects/${projectId}/assign-supervisor`, { supervisorId }),

  // ─── Batches ───

  /**
   * GET /api/v1/admin/batches
   */
  getBatches: () =>
    client.get<Batch[]>('/v1/admin/batches'),

  /**
   * POST /api/v1/admin/batches
   */
  createBatch: (data: Partial<Batch>) =>
    client.post<Batch>('/v1/admin/batches', data),

  /**
   * PATCH /api/v1/admin/batches/:id
   */
  updateBatch: (id: string, data: Partial<Batch>) =>
    client.patch<Batch>(`/v1/admin/batches/${id}`, data),

  /**
   * DELETE /api/v1/admin/batches/:id
   */
  deleteBatch: (id: string) =>
    client.delete(`/v1/admin/batches/${id}`),

  /**
   * POST /api/v1/admin/batches/:id/assign-professor
   * Body: { professorId }
   */
  assignProfessor: (batchId: string, professorId: string) =>
    client.post(`/v1/admin/batches/${batchId}/assign-professor`, { professorId }),

  /**
   * POST /api/v1/admin/batches/:id/assign-students
   * Body: { studentIds: string[] }
   */
  assignStudents: (batchId: string, studentIds: string[]) =>
    client.post(`/v1/admin/batches/${batchId}/assign-students`, { studentIds }),

  // ─── Courses ───

  /**
   * GET /api/v1/admin/courses
   */
  getCourses: () =>
    client.get<Course[]>('/v1/admin/courses'),

  /**
   * POST /api/v1/admin/courses
   */
  createCourse: (data: Partial<Course>) =>
    client.post<Course>('/v1/admin/courses', data),

  /**
   * PATCH /api/v1/admin/courses/:id
   */
  updateCourse: (id: string, data: Partial<Course>) =>
    client.patch<Course>(`/v1/admin/courses/${id}`, data),

  // ─── Audit Logs ───

  /**
   * GET /api/v1/admin/audit-logs
   * Query: { action?, userId?, targetType?, startDate?, endDate?, page, limit }
   */
  getAuditLogs: (params?: {
    action?: string;
    userId?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) =>
    client.get<{ data: AuditLog[]; total: number }>('/v1/admin/audit-logs', { params }),
};

export default adminAPI;
