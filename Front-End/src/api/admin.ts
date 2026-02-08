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
   * GET /api/admin/dashboard
   * Returns: DashboardStats
   */
  getDashboardStats: () =>
    client.get<DashboardStats>('/admin/dashboard'),

  // ─── Batches ───

  /**
   * GET /api/admin/batches
   */
  getBatches: () =>
    client.get<Batch[]>('/admin/batches'),

  /**
   * POST /api/admin/batches
   */
  createBatch: (data: Partial<Batch>) =>
    client.post<Batch>('/admin/batches', data),

  /**
   * PATCH /api/admin/batches/:id
   */
  updateBatch: (id: string, data: Partial<Batch>) =>
    client.patch<Batch>(`/admin/batches/${id}`, data),

  /**
   * DELETE /api/admin/batches/:id
   */
  deleteBatch: (id: string) =>
    client.delete(`/admin/batches/${id}`),

  /**
   * POST /api/admin/batches/:id/assign-professor
   * Body: { professorId }
   */
  assignProfessor: (batchId: string, professorId: string) =>
    client.post(`/admin/batches/${batchId}/assign-professor`, { professorId }),

  /**
   * POST /api/admin/batches/:id/assign-students
   * Body: { studentIds: string[] }
   */
  assignStudents: (batchId: string, studentIds: string[]) =>
    client.post(`/admin/batches/${batchId}/assign-students`, { studentIds }),

  // ─── Courses ───

  /**
   * GET /api/admin/courses
   */
  getCourses: () =>
    client.get<Course[]>('/admin/courses'),

  /**
   * POST /api/admin/courses
   */
  createCourse: (data: Partial<Course>) =>
    client.post<Course>('/admin/courses', data),

  /**
   * PATCH /api/admin/courses/:id
   */
  updateCourse: (id: string, data: Partial<Course>) =>
    client.patch<Course>(`/admin/courses/${id}`, data),

  // ─── Audit Logs ───

  /**
   * GET /api/admin/audit-logs
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
    client.get<{ data: AuditLog[]; total: number }>('/admin/audit-logs', { params }),
};

export default adminAPI;
