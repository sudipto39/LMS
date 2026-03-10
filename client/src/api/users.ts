/**
 * ============================================
 * Users API Service
 * ============================================
 * Base Path: /api/v1/users
 * 
 * Endpoints:
 * - GET /me — Get current user profile (requires auth)
 * - PATCH /updateMe — Update current user profile (requires auth)
 * - GET /getAllUsers — Get all users (admin only)
 * - GET /:id — Get user by ID (admin only)
 *
 * BACKEND ROUTE FILE: routes/users.js
 * BACKEND CONTROLLER: controllers/userController.js
 * BACKEND MODEL: models/User.js
 */

import client from './client';

// ── API Version Prefix ──
const BASE = '/v1/users';

// ── Types ──

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'student' | 'supervisor' | 'admin';
  phone?: string;
  university?: string;
  department?: string;
  session?: string;
  rollNumber?: string;
  giteaUsername?: string;
  giteaLinked: boolean;
  isActive: boolean;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'supervisor' | 'admin';
  phone?: string;
  university?: string;
  department?: string;
  session?: string;
  rollNumber?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
}

export interface UserFilters {
  role?: string;
  session?: string;
  department?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  status: string;
  results: number;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// ── API Methods ──

const usersAPI = {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   * Requires: Authentication
   * Returns: { status, data: { user } }
   */
  getMe: () =>
    client.get<{ status: string; data: { user: User } }>(`${BASE}/me`),

  /**
   * PATCH /api/v1/users/updateMe
   * Update current user profile (name, email, phone, etc.)
   * Requires: Authentication
   * Body: UpdateUserPayload
   * Returns: { status, data: { user } }
   */
  updateMe: (payload: UpdateUserPayload) =>
    client.patch<{ status: string; data: { user: User } }>(`${BASE}/updateMe`, payload),

  /**
   * GET /api/v1/users/getAllUsers
   * Get all users (admin only)
   * Query: UserFilters
   * Returns: PaginatedResponse<User>
   */
  getAllUsers: (filters?: UserFilters) =>
    client.get<PaginatedResponse<User>>(`${BASE}/getAllUsers`, { params: filters }),

  /**
   * GET /api/v1/users/:id
   * Get user by ID (admin only)
   * URL Param: id
   * Returns: { status, data: { user } }
   */
  getById: (id: string) =>
    client.get<{ status: string; data: { user: User } }>(`${BASE}/${id}`),

  // ── Legacy/Extended endpoints (may need to be added to backend) ──

  /**
   * POST /api/v1/users
   * Create a new user (admin only)
   * Body: CreateUserPayload
   * Returns: { status, data: { user } }
   */
  create: (payload: CreateUserPayload) =>
    client.post<{ status: string; data: { user: User } }>(`${BASE}`, payload),

  /**
   * PATCH /api/v1/users/:id
   * Update user by ID (admin only)
   * URL Param: id
   * Body: Partial<User>
   * Returns: { status, data: { user } }
   */
  update: (id: string, payload: Partial<User>) =>
    client.patch<{ status: string; data: { user: User } }>(`${BASE}/${id}`, payload),

  /**
   * DELETE /api/v1/users/:id
   * Delete user (admin only)
   * URL Param: id
   * Returns: { status, message }
   */
  delete: (id: string) =>
    client.delete(`${BASE}/${id}`),

  /**
   * POST /api/v1/users/bulk-import
   * Bulk import users via CSV (admin only)
   * Body: FormData with CSV file
   * CSV columns: fullName, email, role, phone, university, department, session, rollNumber
   */
  bulkImport: (formData: FormData) =>
    client.post(`${BASE}/bulk-import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  /**
   * GET /api/v1/users/supervisors
   * Get list of supervisors (for student project creation dropdown)
   * Returns: { status, data: User[] }
   */
getSupervisors: () =>
  client.get<{ success: boolean; data: User[] }>(`${BASE}/supervisors`),

  /**
   * GET /api/v1/users/students
   * Get list of students (for admin assignment)
   * Query: { session?, department? }
   * Returns: { status, data: User[] }
   */
  getStudents: (filters?: { session?: string; department?: string }) =>
    client.get<{ status: string; data: User[] }>(`${BASE}/students`, { params: filters }),

  /**
   * POST /api/v1/users/:id/link-gitea
   * Link user to Gitea account
   * Body: { giteaUsername, giteaToken }
   * Returns: { status, data: { user } }
   */
  linkGitea: (id: string, giteaUsername: string, giteaToken: string) =>
    client.post(`${BASE}/${id}/link-gitea`, { giteaUsername, giteaToken }),

  /**
   * PATCH /api/v1/users/change-password
   * Change own password
   * Body: { currentPassword, newPassword, passwordConfirm }
   * Returns: { status, token }
   */
  changePassword: (currentPassword: string, newPassword: string, passwordConfirm: string) =>
    client.patch(`${BASE}/change-password`, { currentPassword, newPassword, passwordConfirm }),
};

export default usersAPI;
