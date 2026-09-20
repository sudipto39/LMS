// src/api/users.ts
import client from "./client";
import type {
  User,
  ChangePasswordPayload,
  SSHKey,
  StudentStats,
  ApiResponse,
} from "../types";

const BASE = "/v1/users";

export const usersApi = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await client.get<ApiResponse<User>>(`${BASE}/me`);
    return res.data;
  },

  updateMe: async (payload: Partial<User>): Promise<ApiResponse<User>> => {
    const res = await client.patch<ApiResponse<User>>(`${BASE}/updateMe`, payload);
    return res.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<ApiResponse<null>> => {
    const res = await client.patch<ApiResponse<null>>(`${BASE}/change-password`, payload);
    return res.data;
  },

  getSupervisors: async (): Promise<ApiResponse<User[]>> => {
    const res = await client.get<ApiResponse<User[]>>(`${BASE}/supervisors`);
    return res.data;
  },

  getStats: async (): Promise<ApiResponse<StudentStats>> => {
    const res = await client.get<ApiResponse<StudentStats>>(`${BASE}/me/stats`);
    return res.data;
  },

  getSSHKeys: async (): Promise<ApiResponse<SSHKey[]>> => {
    const res = await client.get<ApiResponse<SSHKey[]>>(`${BASE}/me/ssh-keys`);
    return res.data;
  },

  addSSHKey: async (payload: { title: string; key: string }): Promise<ApiResponse<SSHKey>> => {
    const res = await client.post<ApiResponse<SSHKey>>(`${BASE}/me/ssh-keys`, payload);
    return res.data;
  },

  deleteSSHKey: async (keyId: string | number): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/me/ssh-keys/${keyId}`);
    return res.data;
  },

  regenerateGiteaToken: async (): Promise<ApiResponse<{ token: string }>> => {
    const res = await client.post<ApiResponse<{ token: string }>>(`${BASE}/me/gitea-token/regenerate`);
    return res.data;
  },
};

export default usersApi;
