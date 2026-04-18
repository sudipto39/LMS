// src/api/supervisors.ts
import client from "./client";
import type { User, PaginatedResponse, Milestone } from "../types";
import type { Project } from "../types";

const BASE = "/v1/supervisors";

export interface ReviewMilestonePayload {
  status: "APPROVED" | "REJECTED";
  feedback?: string;
}

const supervisorsAPI = {
  getAllSupervisors: () =>
    client.get<PaginatedResponse<User>>(`${BASE}/allsupervisors`),

  getDashboard: () =>
    client.get<{
      status: string;
      data: {
        totalProjects: number;
        pendingMilestones: number;
        recentActivity: unknown[];
      };
    }>(`${BASE}/dashboard`),

  getAssignedProjects: () =>
    client.get<PaginatedResponse<Project>>(`${BASE}/projects`),

  getPendingMilestones: () =>
    client.get<PaginatedResponse<Milestone>>(`${BASE}/milestones/pending`),

  reviewMilestone: (milestoneId: string, payload: ReviewMilestonePayload) =>
    client.patch<{ status: string; data: Milestone }>(
      `${BASE}/milestones/${milestoneId}/review`,
      payload
    ),

  getActivityFeed: () =>
    client.get(`${BASE}/activity`),
};

export default supervisorsAPI;