// /**
//  * ============================================
//  * Auth API Service
//  * ============================================
//  * Base Path: /api/v1/auth
//  * 
//  * Endpoints:
//  * - POST /register — Register a new user
//  * - POST /verify-email — Verify user email
//  * - POST /login — User login
//  * - POST /forgot-password — Request password reset
//  * - PATCH /reset-password/:token — Reset password
//  * - POST /logout — Logout (requires auth)
//  *
//  * BACKEND ROUTE FILE: routes/auth.js
//  * BACKEND CONTROLLER: controllers/authController.js
//  */

// import client from './client';

// // ── API Version Prefix ──
// const BASE = '/v1/auth';

// // ── Types ──

// export interface LoginPayload {
//   email: string;
//   password: string;
// }

// export interface User {
//   _id: string;
//   fullName: string;
//   email: string;
//   role: 'student' | 'supervisor' | 'admin';
//   phone?: string;
//   university?: string;
//   department?: string;
//   session?: string;
//   rollNumber?: string;
//   avatar?: string;
//   giteaUsername?: string;
//   giteaLinked?: boolean;
//   isEmailVerified?: boolean;
//   isActive?: boolean;
// }

// export interface LoginResponse {
//   status: string;
//   token: string;
//   refreshToken?: string;
//   user: User; // Direct user object for easier access
//   data?: {
//     user: User;
//   };
// }

// export interface RegisterPayload {
//   fullName: string;
//   email: string;
//   password: string;
//   passwordConfirm: string;
//   phone: string;
//   university: string;
//   department: string;
//   session: string;
//   rollNumber: string;
//   course?: string; // ObjectId of course
//   batch?: string; // ObjectId of batch
//   role?: 'student' | 'supervisor'; // Default: student
// }

// export interface VerifyEmailPayload {
//   token?: string;
//   code?: string;
// }

// export interface ForgotPasswordPayload {
//   email: string;
// }

// export interface ResetPasswordPayload {
//   password: string;
//   passwordConfirm: string;
// }

// // ── API Methods ──

// const authAPI = {
//   /**
//    * POST /api/v1/auth/register
//    * Register a new user (student by default)
//    * Body: RegisterPayload
//    * Returns: { status, message, data: { user } }
//    */
//   register: (payload: RegisterPayload) =>
//     client.post(`${BASE}/register`, payload),

//   /**
//    * POST /api/v1/auth/verify-email
//    * Verify user email with token/code sent via email
//    * Body: { token } or { code }
//    * Returns: { status, message }
//    */
//   verifyEmail: (payload: VerifyEmailPayload) =>
//     client.post(`${BASE}/verify-email`, payload),

//   /**
//    * POST /api/v1/auth/login
//    * User login with email and password
//    * Body: { email, password }
//    * Returns: LoginResponse { status, token, data: { user } }
//    */
//   login: (payload: LoginPayload) =>
//     client.post<LoginResponse>(`${BASE}/login`, payload),

//   /**
//    * POST /api/v1/auth/forgot-password
//    * Request password reset link via email
//    * Body: { email }
//    * Returns: { status, message }
//    */
//   forgotPassword: (payload: ForgotPasswordPayload) =>
//     client.post(`${BASE}/forgot-password`, payload),

//   /**
//    * PATCH /api/v1/auth/reset-password/:token
//    * Reset password using token from email link
//    * URL Param: token (from email link)
//    * Body: { password, passwordConfirm }
//    * Returns: { status, token, data: { user } }
//    */
//   resetPassword: (token: string, payload: ResetPasswordPayload) =>
//     client.patch(`${BASE}/reset-password/${token}`, payload),

//   /**
//    * POST /api/v1/auth/logout
//    * Logout current user (invalidate token)
//    * Requires: Authentication
//    * Body: { refreshToken? }
//    * Returns: { status, message }
//    */
//   logout: (refreshToken?: string) =>
//     client.post(`${BASE}/logout`, { refreshToken }),

//   // ── Additional OAuth Routes (if using Gitea OAuth) ──

//   /**
//    * POST /api/v1/auth/login/gitea
//    * Initiates OAuth2 login with Gitea
//    * Returns: { redirectUrl } — frontend redirects user to Gitea OAuth page
//    */
//   loginWithGitea: () =>
//     client.post<{ redirectUrl: string }>(`${BASE}/login/gitea`),

//   /**
//    * POST /api/v1/auth/login/gitea/callback
//    * Handle Gitea OAuth callback
//    * Body: { code, state } — from Gitea OAuth redirect
//    * Returns: LoginResponse
//    */
//   giteaCallback: (code: string, state: string) =>
//     client.post<LoginResponse>(`${BASE}/login/gitea/callback`, { code, state }),

//   /**
//    * POST /api/v1/auth/refresh
//    * Refresh access token
//    * Body: { refreshToken }
//    * Returns: { token }
//    */
//   refresh: (refreshToken: string) =>
//     client.post<{ token: string }>(`${BASE}/refresh`, { refreshToken }),

//   /**
//    * GET /api/v1/users/me
//    * Get current user profile from JWT token
//    * Requires: Authentication
//    * Returns: { status, data: { user } }
//    * NOTE: This is on /users route, not /auth
//    */
//   getMe: () =>
//     client.get<{ status: string; data: { user: User } }>('/v1/users/me'),
// };

// export default authAPI;




// src/api/auth.ts
import client from "./client";
import type { LoginResponse, RegisterResponse, User } from "../types";

const BASE = "/v1/auth";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  universityId: string;
  email: string;
  password: string;
  phoneNumber: string;
  department: string;
  role?: "STUDENT" | "SUPERVISOR";
  batchId?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

const authAPI = {
  register: (payload: RegisterPayload) =>
    client.post<RegisterResponse>(`${BASE}/register`, payload),

  verifyEmail: (payload: VerifyEmailPayload) =>
    client.post(`${BASE}/verify-email`, payload),

  login: (payload: LoginPayload) =>
    client.post<LoginResponse>(`${BASE}/login`, payload),

  refreshToken: () =>
    client.post<{ status: string; accessToken: string }>(
      `${BASE}/refresh-token`
    ),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    client.post(`${BASE}/forgot-password`, payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    client.patch(`${BASE}/reset-password`, payload),

  logout: () =>
    client.post(`${BASE}/logout`),

  getMe: () =>
    client.get<{ status: string; data: User }>("/v1/users/me"),
};

export default authAPI;