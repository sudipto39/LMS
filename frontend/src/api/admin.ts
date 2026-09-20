// src/api/admin.ts
import client from "./client";
import type {
  User,
  AuditLogItem,
  GiteaServerConfig,
  SupervisorAllocationRequest,
  ApiResponse,
} from "../types";

const BASE = "/v1/admin";

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalProjects: number;
  activeBatches: number;
  totalCourses: number;
}

export const adminApi = {
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const res = await client.get<ApiResponse<AdminStats>>(`${BASE}/stats`);
    return res.data;
  },

  getAllUsers: async (): Promise<ApiResponse<User[]>> => {
    const res = await client.get<ApiResponse<User[]>>(`${BASE}/users`);
    return res.data;
  },

  createUser: async (payload: {
    name: string;
    email: string;
    role?: "STUDENT" | "SUPERVISOR" | "ADMIN";
    department?: string;
    universityId?: string;
    phoneNumber?: string;
    password?: string;
    batchId?: string;
  }): Promise<ApiResponse<User>> => {
    const res = await client.post<ApiResponse<User>>(`${BASE}/users`, payload);
    return res.data;
  },

  updateUser: async (id: string, payload: Partial<User>): Promise<ApiResponse<User>> => {
    const res = await client.patch<ApiResponse<User>>(`${BASE}/users/${id}`, payload);
    return res.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/users/${id}`);
    return res.data;
  },

  importUsersCsv: async (formData: FormData): Promise<ApiResponse<{ importedCount: number }>> => {
    const res = await client.post<ApiResponse<{ importedCount: number }>>(
      `${BASE}/users/import-csv`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  getAuditLogs: async (): Promise<ApiResponse<AuditLogItem[]>> => {
    const res = await client.get<ApiResponse<AuditLogItem[]>>(`${BASE}/audit-logs`);
    return res.data;
  },

  getGiteaConfig: async (): Promise<ApiResponse<GiteaServerConfig>> => {
    const res = await client.get<ApiResponse<GiteaServerConfig>>(`${BASE}/gitea/config`);
    return res.data;
  },

  updateGiteaConfig: async (payload: Partial<GiteaServerConfig>): Promise<ApiResponse<GiteaServerConfig>> => {
    const res = await client.post<ApiResponse<GiteaServerConfig>>(`${BASE}/gitea/config`, payload);
    return res.data;
  },

  testGiteaConnection: async (payload?: { url?: string; token?: string }): Promise<ApiResponse<{
    connected: boolean;
    latencyMs: number;
    version?: string;
    message?: string;
  }>> => {
    const res = await client.post<ApiResponse<{
      connected: boolean;
      latencyMs: number;
      version?: string;
      message?: string;
    }>>(`${BASE}/gitea/test`, payload || {});
    return res.data;
  },

  assignSupervisor: async (projectId: string, supervisorId: string): Promise<ApiResponse<null>> => {
    const res = await client.patch<ApiResponse<null>>(
      `${BASE}/projects/${projectId}/assign-supervisor`,
      { supervisorId }
    );
    return res.data;
  },

  getSupervisorRequests: async (): Promise<ApiResponse<SupervisorAllocationRequest[]>> => {
    const res = await client.get<ApiResponse<SupervisorAllocationRequest[]>>(`${BASE}/supervisor-requests`);
    return res.data;
  },

  reviewSupervisorRequest: async (
    projectId: string,
    status: "APPROVED" | "REJECTED",
    assignedSupervisorId?: string,
    adminNote?: string
  ): Promise<ApiResponse<any>> => {
    const res = await client.patch<ApiResponse<any>>(
      `${BASE}/projects/${projectId}/supervisor-request`,
      {
        status,
        assignedSupervisorId,
        adminNote,
      }
    );
    return res.data;
  },
};

export default adminApi;
