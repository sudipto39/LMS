// src/api/labs.ts
import client from "./client";
import type {
  LabAssignment,
  LabSubmission,
  GradingEvaluation,
  LabRosterResponse,
  ApiResponse,
  TestCase,
} from "../types";

export interface CreateLabAssignmentPayload {
  title: string;
  objective: string;
  description: string;
  subject?: string;
  prerequisites?: string;
  batchId: string;
  submissionType?: "CODING" | "PDF_REPORT";
  manualUrl?: string | null;
  manualName?: string | null;
  language?: string;
  starterCode?: string | null;
  testCases?: TestCase[];
  timeLimit?: number;
  memoryLimit?: number;
  totalPoints?: number;
  dueDate?: string | null;
  allowLate?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
}

export interface SubmitLabResponse {
  submission: LabSubmission;
  evaluation: GradingEvaluation;
}

export const labsApi = {
  getLabAssignments: async (
    batchId?: string
  ): Promise<ApiResponse<LabAssignment[]>> => {
    const params = batchId ? { batchId } : {};
    const res = await client.get<ApiResponse<LabAssignment[]>>(
      "/v1/lab-assignments",
      { params }
    );
    return res.data;
  },

  getLabAssignmentById: async (
    id: string
  ): Promise<ApiResponse<LabAssignment & { mySubmissions?: LabSubmission[] }>> => {
    const res = await client.get<
      ApiResponse<LabAssignment & { mySubmissions?: LabSubmission[] }>
    >(`/v1/lab-assignments/${id}`);
    return res.data;
  },

  createLabAssignment: async (
    payload: CreateLabAssignmentPayload
  ): Promise<ApiResponse<LabAssignment>> => {
    const res = await client.post<ApiResponse<LabAssignment>>(
      "/v1/lab-assignments",
      payload
    );
    return res.data;
  },

  deleteLabAssignment: async (
    id: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const res = await client.delete<ApiResponse<{ message: string }>>(
      `/v1/lab-assignments/${id}`
    );
    return res.data;
  },

  runPublicTests: async (
    id: string,
    code: string,
    language?: string
  ): Promise<ApiResponse<GradingEvaluation>> => {
    const res = await client.post<ApiResponse<GradingEvaluation>>(
      `/v1/lab-assignments/${id}/run`,
      { code, language }
    );
    return res.data;
  },

  submitLabAssignment: async (
    id: string,
    code: string,
    language?: string
  ): Promise<ApiResponse<SubmitLabResponse>> => {
    const res = await client.post<ApiResponse<SubmitLabResponse>>(
      `/v1/lab-assignments/${id}/submit`,
      { code, language }
    );
    return res.data;
  },

  submitLabReport: async (
    id: string,
    formData: FormData
  ): Promise<ApiResponse<LabSubmission>> => {
    const res = await client.post<ApiResponse<LabSubmission>>(
      `/v1/lab-assignments/${id}/submit-report`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  uploadDocument: async (
    file: File
  ): Promise<ApiResponse<{ url: string; key: string; name: string; size: number }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await client.post<ApiResponse<{ url: string; key: string; name: string; size: number }>>(
      "/v1/uploads/file",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  getSubmissionsRoster: async (
    id: string
  ): Promise<ApiResponse<LabRosterResponse>> => {
    const res = await client.get<ApiResponse<LabRosterResponse>>(
      `/v1/lab-assignments/${id}/submissions`
    );
    return res.data;
  },

  gradeSubmission: async (
    submissionId: string,
    data: { score?: number; manualScoreAdjust?: number; supervisorFeedback?: string }
  ): Promise<ApiResponse<LabSubmission>> => {
    const res = await client.patch<ApiResponse<LabSubmission>>(
      `/v1/lab-assignments/submissions/${submissionId}/grade`,
      data
    );
    return res.data;
  },

  updateLabAssignment: async (
    id: string,
    payload: Partial<CreateLabAssignmentPayload & { subject?: string }>
  ): Promise<ApiResponse<LabAssignment>> => {
    const res = await client.patch<ApiResponse<LabAssignment>>(
      `/v1/lab-assignments/${id}`,
      payload
    );
    return res.data;
  },

  renameSubjectFolder: async (
    oldSubject: string,
    newSubject: string,
    batchId?: string
  ): Promise<ApiResponse<{ message: string; affectedCount: number }>> => {
    const res = await client.patch<ApiResponse<{ message: string; affectedCount: number }>>(
      "/v1/lab-assignments/folders/rename",
      { oldSubject, newSubject, batchId }
    );
    return res.data;
  },

  toggleSubjectFolderStatus: async (
    subject: string,
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED",
    batchId?: string
  ): Promise<ApiResponse<{ message: string; affectedCount: number }>> => {
    const res = await client.patch<ApiResponse<{ message: string; affectedCount: number }>>(
      "/v1/lab-assignments/folders/status",
      { subject, status, batchId }
    );
    return res.data;
  },

  deleteSubjectFolder: async (
    subject: string,
    batchId?: string
  ): Promise<ApiResponse<{ message: string; deletedCount: number }>> => {
    const res = await client.post<ApiResponse<{ message: string; deletedCount: number }>>(
      "/v1/lab-assignments/folders/delete",
      { subject, batchId }
    );
    return res.data;
  },
};

