/**
 * ============================================
 * Auth API Service
 * ============================================
 * Endpoints: login, register, logout, refresh, forgot/reset password
 *
 * BACKEND ROUTE FILE: routes/auth.js
 * BACKEND CONTROLLER: controllers/authController.js
 */

import client from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'professor' | 'admin';
    avatar?: string;
    giteaUsername?: string;
    giteaLinked: boolean;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'professor';
  enrollmentId?: string;
  department?: string;
  batch?: string;
}

const authAPI = {
  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { token, refreshToken, user }
   */
  login: (payload: LoginPayload) =>
    client.post<LoginResponse>('/auth/login', payload),

  /**
   * POST /api/auth/login/gitea
   * Initiates OAuth2 login with Gitea
   * Returns: { redirectUrl } — frontend redirects user to Gitea OAuth page
   */
  loginWithGitea: () =>
    client.post<{ redirectUrl: string }>('/auth/login/gitea'),

  /**
   * POST /api/auth/login/gitea/callback
   * Body: { code, state } — from Gitea OAuth redirect
   * Returns: { token, refreshToken, user }
   */
  giteaCallback: (code: string, state: string) =>
    client.post<LoginResponse>('/auth/login/gitea/callback', { code, state }),

  /**
   * POST /api/auth/register
   * Body: RegisterPayload
   * Returns: { message, user }
   */
  register: (payload: RegisterPayload) =>
    client.post('/auth/register', payload),

  /**
   * POST /api/auth/logout
   * Body: { refreshToken }
   * Invalidates the refresh token on server
   */
  logout: (refreshToken: string) =>
    client.post('/auth/logout', { refreshToken }),

  /**
   * POST /api/auth/refresh
   * Body: { refreshToken }
   * Returns: { token }
   */
  refresh: (refreshToken: string) =>
    client.post<{ token: string }>('/auth/refresh', { refreshToken }),

  /**
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  forgotPassword: (email: string) =>
    client.post('/auth/forgot-password', { email }),

  /**
   * POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  resetPassword: (token: string, newPassword: string) =>
    client.post('/auth/reset-password', { token, newPassword }),

  /**
   * GET /api/auth/me
   * Returns current user profile from JWT
   */
  getMe: () =>
    client.get<LoginResponse['user']>('/auth/me'),
};

export default authAPI;
