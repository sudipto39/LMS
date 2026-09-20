// src/api/supervisors.ts
import client from "./client";
import type { Project, Milestone, ApiResponse } from "../types";

const BASE = "/v1/supervisors";

export interface SupervisorDashboardMetrics {
  totalProjects: number;
  pendingReviews: number;
  approvedDeliverables: number;
  averageReviewTimeHours: number;
}

export const supervisorsApi = {
  getDashboardMetrics: async (): Promise<ApiResponse<SupervisorDashboardMetrics>> => {
    const res = await client.get<ApiResponse<SupervisorDashboardMetrics>>(`${BASE}/dashboard`);
    return res.data;
  },

  getSupervisedProjects: async (): Promise<ApiResponse<Project[]>> => {
    const res = await client.get<ApiResponse<Project[]>>(`${BASE}/projects`);
    return res.data;
  },

  getPendingMilestones: async (): Promise<ApiResponse<Milestone[]>> => {
    const res = await client.get<ApiResponse<Milestone[]>>(`${BASE}/milestones/pending`);
    return res.data;
  },

  reviewMilestone: async (
    id: string,
    remarks: string,
    approved: boolean
  ): Promise<ApiResponse<Milestone>> => {
    const res = await client.patch<ApiResponse<Milestone>>(
      `${BASE}/milestones/${id}/review`,
      { remarks, approved }
    );
    return res.data;
  },

  gradeProject: async (
    id: string,
    payload: { grade: string; feedback?: string; score?: number }
  ): Promise<ApiResponse<Project>> => {
    const res = await client.patch<ApiResponse<Project>>(
      `${BASE}/projects/${id}/grade`,
      payload
    );
    return res.data;
  },
};

export default supervisorsApi;
