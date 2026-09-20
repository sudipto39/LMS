// src/api/auth.ts
import client from "./client";
import type {
  LoginPayload,
  RegisterPayload,
  VerifyEmailPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AuthResponse,
  User,
  ApiResponse,
} from "../types";

const BASE = "/v1/auth";

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await client.post<AuthResponse>(`${BASE}/login`, payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await client.post<AuthResponse>(`${BASE}/register`, payload);
    return res.data;
  },

  verifyEmail: async (payload: VerifyEmailPayload): Promise<AuthResponse> => {
    const res = await client.post<AuthResponse>(`${BASE}/verify-email`, payload);
    return res.data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponse<null>> => {
    const res = await client.post<ApiResponse<null>>(`${BASE}/forgot-password`, payload);
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse<null>> => {
    const res = await client.patch<ApiResponse<null>>(`${BASE}/reset-password`, payload);
    return res.data;
  },

  refreshToken: async (): Promise<{ status: string; accessToken: string }> => {
    const res = await client.post<{ status: string; accessToken: string }>(
      `${BASE}/refresh-token`
    );
    return res.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const res = await client.post<ApiResponse<null>>(`${BASE}/logout`);
    return res.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await client.get<ApiResponse<User>>("/v1/users/me");
    return res.data;
  },
};

export default authApi;
