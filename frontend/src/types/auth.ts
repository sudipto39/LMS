// src/types/auth.ts
import type { User, Role } from "./user";

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
  role?: Role;
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
  email?: string;
  code?: string;
  password: string;
  confirmPassword?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  status: "success" | "fail" | "error";
  message?: string;
  accessToken?: string;
  data?: {
    user?: User;
    userId?: string;
    token?: string;
  };
}
