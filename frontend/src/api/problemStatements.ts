// src/api/problemStatements.ts
import client from "./client";
import type {
  ProblemStatement,
  CreateProblemStatementPayload,
  ApiResponse,
} from "../types";

const BASE = "/v1/problem-statements";

export const problemStatementsApi = {
  getCatalog: async (domain?: string, search?: string): Promise<ApiResponse<ProblemStatement[]>> => {
    const params: Record<string, string> = {};
    if (domain && domain !== "all" && domain !== "All") params.domain = domain;
    if (search && search.trim()) params.search = search.trim();
    const res = await client.get<ApiResponse<ProblemStatement[]>>(`${BASE}/catalog`, { params });
    return res.data;
  },

  getById: async (id: string): Promise<ApiResponse<ProblemStatement>> => {
    const res = await client.get<ApiResponse<ProblemStatement>>(`${BASE}/${id}`);
    return res.data;
  },

  getMyProposals: async (): Promise<ApiResponse<ProblemStatement[]>> => {
    const res = await client.get<ApiResponse<ProblemStatement[]>>(`${BASE}/mine`);
    return res.data;
  },

  getPendingAdmin: async (): Promise<ApiResponse<ProblemStatement[]>> => {
    const res = await client.get<ApiResponse<ProblemStatement[]>>(`${BASE}/admin/pending`);
    return res.data;
  },

  create: async (payload: CreateProblemStatementPayload): Promise<ApiResponse<ProblemStatement>> => {
    const res = await client.post<ApiResponse<ProblemStatement>>(`${BASE}`, payload);
    return res.data;
  },

  review: async (
    id: string,
    status: "APPROVED" | "REJECTED" | "ARCHIVED",
    adminFeedback?: string
  ): Promise<ApiResponse<ProblemStatement>> => {
    const res = await client.patch<ApiResponse<ProblemStatement>>(`${BASE}/${id}/review`, {
      status,
      adminFeedback,
    });
    return res.data;
  },
};

export default problemStatementsApi;
