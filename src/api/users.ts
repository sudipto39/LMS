/**
 * ============================================
 * Users API Service
 * ============================================
 * BACKEND ROUTE FILE: routes/users.js
 * BACKEND CONTROLLER: controllers/userController.js
 * BACKEND MODEL: models/User.js
 */

import client from './client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'professor' | 'admin';
  enrollmentId?: string;
  department?: string;
  batch?: string;
  giteaUsername?: string;
  giteaLinked: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'professor' | 'admin';
  enrollmentId?: string;
  department?: string;
  batch?: string;
}

export interface UserFilters {
  role?: string;
  batch?: string;
  department?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const usersAPI = {
  /**
   * GET /api/users
   * Query: UserFilters
   * Admin only
   */
  getAll: (filters?: UserFilters) =>
    client.get<PaginatedResponse<User>>('/users', { params: filters }),

  /**
   * GET /api/users/:id
   */
  getById: (id: string) =>
    client.get<User>(`/users/${id}`),

  /**
   * POST /api/users
   * Admin only. Also creates Gitea user if configured.
   */
  create: (payload: CreateUserPayload) =>
    client.post<User>('/users', payload),

  /**
   * PATCH /api/users/:id
   */
  update: (id: string, payload: Partial<User>) =>
    client.patch<User>(`/users/${id}`, payload),

  /**
   * DELETE /api/users/:id
   * Admin only
   */
  delete: (id: string) =>
    client.delete(`/users/${id}`),

  /**
   * POST /api/users/bulk-import
   * Body: FormData with CSV file
   * CSV columns: name, email, role, enrollmentId, department, batch
   */
  bulkImport: (formData: FormData) =>
    client.post('/users/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * GET /api/users/professors
   * Returns list of professors (for student project creation dropdown)
   */
  getProfessors: () =>
    client.get<User[]>('/users/professors'),

  /**
   * GET /api/users/students
   * Returns list of students (for admin assignment)
   */
  getStudents: (filters?: { batch?: string; department?: string }) =>
    client.get<User[]>('/users/students', { params: filters }),

  /**
   * POST /api/users/:id/link-gitea
   * Body: { giteaUsername, giteaToken }
   * Links user to their Gitea account
   */
  linkGitea: (id: string, giteaUsername: string, giteaToken: string) =>
    client.post(`/users/${id}/link-gitea`, { giteaUsername, giteaToken }),

  /**
   * PATCH /api/users/profile
   * Update own profile (any role)
   */
  updateProfile: (data: { name?: string; email?: string; department?: string }) =>
    client.patch('/users/profile', data),

  /**
   * PATCH /api/users/change-password
   * Body: { currentPassword, newPassword }
   */
  changePassword: (currentPassword: string, newPassword: string) =>
    client.patch('/users/change-password', { currentPassword, newPassword }),
};

export default usersAPI;
