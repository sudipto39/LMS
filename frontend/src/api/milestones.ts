// src/api/milestones.ts
import client from "./client";
import type { Milestone, ApiResponse } from "../types";

export const milestonesApi = {
  getProjectMilestones: async (projectId: string): Promise<ApiResponse<Milestone[]>> => {
    const res = await client.get<ApiResponse<Milestone[]>>(`/v1/projects/${projectId}/milestones`);
    return res.data;
  },

  createMilestone: async (
    projectId: string,
    payload: { title: string; dueDate?: string; order?: number }
  ): Promise<ApiResponse<Milestone>> => {
    const res = await client.post<ApiResponse<Milestone>>(
      `/v1/projects/${projectId}/milestones`,
      payload
    );
    return res.data;
  },

  updateMilestone: async (
    id: string,
    payload: { title?: string; description?: string; dueDate?: string }
  ): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(`/v1/milestones/${id}`, payload);
    return res.data;
  },

  deleteMilestone: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`/v1/milestones/${id}`);
    return res.data;
  },

  startMilestone: async (id: string): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(`/v1/milestones/${id}/start`);
    return res.data;
  },

  submitMilestone: async (
    id: string,
    formData: FormData
  ): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(
      `/v1/milestones/${id}/submit`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  approveMilestone: async (id: string): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(`/v1/milestones/${id}/approve`);
    return res.data;
  },

  rejectMilestone: async (
    id: string,
    remarks?: string
  ): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(
      `/v1/milestones/${id}/reject`,
      { remarks }
    );
    return res.data;
  },

  getMySubmissions: async (): Promise<ApiResponse<Milestone[]>> => {
    const res = await client.get<ApiResponse<Milestone[]>>("/v1/me/submissions");
    return res.data;
  },
};

export default milestonesApi;
