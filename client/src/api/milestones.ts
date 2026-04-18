// src/api/milestones.ts
import client from "./client";
import type { Milestone, PaginatedResponse } from "../types";

const PROJECTS_BASE = "/v1/projects";
const MILESTONES_BASE = "/v1/milestones";

export interface CreateMilestonePayload {
  title: string;
  description?: string;
  dueDate?: string;
  order?: number;
}

export interface ReviewMilestonePayload {
  feedback?: string;
}

const milestonesAPI = {
  getByProject: (projectId: string) =>
    client.get<PaginatedResponse<Milestone>>(
      `${PROJECTS_BASE}/${projectId}/milestones`
    ),

  create: (projectId: string, payload: CreateMilestonePayload) =>
    client.post<{ status: string; data: Milestone }>(
      `${PROJECTS_BASE}/${projectId}/milestones`,
      payload
    ),

  submit: (
    milestoneId: string,
    payload?: { studentNotes?: string },
    files?: FileList
  ) => {
    if (files && files.length > 0) {
      const form = new FormData();
      if (payload?.studentNotes) form.append("studentNotes", payload.studentNotes);
      Array.from(files).forEach((f) => form.append("files", f));
      return client.patch<{ status: string; data: Milestone }>(
        `${MILESTONES_BASE}/${milestoneId}/submit`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    }
    return client.patch<{ status: string; data: Milestone }>(
      `${MILESTONES_BASE}/${milestoneId}/submit`,
      payload ?? {}
    );
  },

  approve: (milestoneId: string, payload?: ReviewMilestonePayload) =>
    client.patch<{ status: string; data: Milestone }>(
      `${MILESTONES_BASE}/${milestoneId}/approve`,
      payload ?? {}
    ),

  reject: (milestoneId: string, payload?: ReviewMilestonePayload) =>
    client.patch<{ status: string; data: Milestone }>(
      `${MILESTONES_BASE}/${milestoneId}/reject`,
      payload ?? {}
    ),

  getMySubmissions: () =>
    client.get<PaginatedResponse<Milestone>>("/v1/me/submissions"),
};

export default milestonesAPI;