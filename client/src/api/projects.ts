// src/api/projects.ts
import client from "./client";
import type {
  Project,
  CreateProjectPayload,
  ProjectFile,
  Feedback,
  User,
  ApiResponse,
  CodeReviewComment,
} from "../types";

const BASE = "/v1/projects";

export const projectsApi = {
  getMyProjects: async (): Promise<ApiResponse<Project[]>> => {
    const res = await client.get<ApiResponse<Project[]>>(`${BASE}/me`);
    return res.data;
  },

  getSupervisedProjects: async (): Promise<ApiResponse<Project[]>> => {
    const res = await client.get<ApiResponse<Project[]>>(`${BASE}/supervised`);
    return res.data;
  },

  getAllProjects: async (): Promise<ApiResponse<Project[]>> => {
    const res = await client.get<ApiResponse<Project[]>>("/v1/admin/projects");
    return res.data;
  },

  getProjectById: async (id: string): Promise<ApiResponse<Project>> => {
    const res = await client.get<ApiResponse<Project>>(`${BASE}/${id}`);
    return res.data;
  },

  createProject: async (payload: CreateProjectPayload): Promise<ApiResponse<Project>> => {
    const res = await client.post<ApiResponse<Project>>(`${BASE}/create`, payload);
    return res.data;
  },

  extendProject: async (id: string, payload: Partial<CreateProjectPayload>): Promise<ApiResponse<Project>> => {
    const res = await client.post<ApiResponse<Project>>(`${BASE}/${id}/extend`, payload);
    return res.data;
  },

  updateProject: async (id: string, payload: Partial<Project>): Promise<ApiResponse<Project>> => {
    const res = await client.patch<ApiResponse<Project>>(`${BASE}/${id}`, payload);
    return res.data;
  },

  deleteProject: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return res.data;
  },

  submitFinal: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.post<ApiResponse<null>>(`${BASE}/${id}/submit-final`);
    return res.data;
  },

  getProjectFiles: async (id: string): Promise<ApiResponse<ProjectFile[]>> => {
    const res = await client.get<ApiResponse<ProjectFile[]>>(`${BASE}/${id}/files`);
    return res.data;
  },

  getPotentialMembers: async (id: string): Promise<ApiResponse<User[]>> => {
    const res = await client.get<ApiResponse<User[]>>(`${BASE}/${id}/potential-members`);
    return res.data;
  },

  addMember: async (id: string, userId: string): Promise<ApiResponse<null>> => {
    const res = await client.post<ApiResponse<null>>(`${BASE}/${id}/members`, { userId });
    return res.data;
  },

  removeMember: async (id: string, userId: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/${id}/members/${userId}`);
    return res.data;
  },

  // ── Code Reviews & Diffs ───────────────────────────────────────────────────

  getCommitDiff: async (id: string, commitSha: string): Promise<ApiResponse<any>> => {
    const res = await client.get<ApiResponse<any>>(`${BASE}/${id}/diff/${commitSha}`);
    return res.data;
  },

  getCodeReviewComments: async (id: string): Promise<ApiResponse<CodeReviewComment[]>> => {
    const res = await client.get<ApiResponse<CodeReviewComment[]>>(`${BASE}/${id}/code-review/comments`);
    return res.data;
  },

  postCodeReviewComment: async (
    id: string,
    payload: {
      commitSha?: string;
      filePath?: string;
      lineNumber?: number;
      side?: "LEFT" | "RIGHT";
      content: string;
    }
  ): Promise<ApiResponse<CodeReviewComment>> => {
    const res = await client.post<ApiResponse<CodeReviewComment>>(
      `${BASE}/${id}/code-review/comments`,
      payload
    );
    return res.data;
  },

  resolveCodeReviewComment: async (
    id: string,
    commentId: string,
    isResolved: boolean
  ): Promise<ApiResponse<null>> => {
    const res = await client.patch<ApiResponse<null>>(
      `${BASE}/${id}/code-review/comments/${commentId}/resolve`,
      { isResolved }
    );
    return res.data;
  },

  // ── Threaded Feedback ──────────────────────────────────────────────────────

  getFeedback: async (id: string): Promise<ApiResponse<Feedback[]>> => {
    const res = await client.get<ApiResponse<Feedback[]>>(`${BASE}/${id}/feedback`);
    return res.data;
  },

  postFeedback: async (id: string, content: string): Promise<ApiResponse<Feedback>> => {
    const res = await client.post<ApiResponse<Feedback>>(`${BASE}/${id}/feedback`, { content });
    return res.data;
  },

  replyFeedback: async (
    id: string,
    feedbackId: string,
    content: string
  ): Promise<ApiResponse<null>> => {
    const res = await client.post<ApiResponse<null>>(
      `${BASE}/${id}/feedback/${feedbackId}/reply`,
      { content }
    );
    return res.data;
  },

  resolveFeedback: async (
    id: string,
    feedbackId: string,
    resolved: boolean
  ): Promise<ApiResponse<null>> => {
    const res = await client.patch<ApiResponse<null>>(
      `${BASE}/${id}/feedback/${feedbackId}/resolve`,
      { resolved }
    );
    return res.data;
  },

  commitAndPushSandbox: async (
    id: string,
    payload: {
      files: Array<{ path: string; content: string }>;
      message?: string;
      branch?: string;
    }
  ): Promise<ApiResponse<any>> => {
    const res = await client.post<ApiResponse<any>>(`${BASE}/${id}/commit`, payload);
    return res.data;
  },
};

export default projectsApi;
