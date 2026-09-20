// src/api/batches.ts
import client from "./client";
import type { Batch, CreateBatchPayload, ApiResponse, User } from "../types";

const BASE = "/v1/batches";

export const batchesApi = {
  getAllBatches: async (): Promise<ApiResponse<Batch[]>> => {
    const res = await client.get<ApiResponse<Batch[]>>(BASE);
    return res.data;
  },

  createBatch: async (payload: CreateBatchPayload): Promise<ApiResponse<Batch>> => {
    const res = await client.post<ApiResponse<Batch>>(BASE, payload);
    return res.data;
  },

  deleteBatch: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return res.data;
  },

  getBatchesByCourse: async (courseId: string): Promise<ApiResponse<Batch[]>> => {
    const res = await client.get<ApiResponse<Batch[]>>(`${BASE}/courses/${courseId}/batches`);
    return res.data;
  },

  getBatchStudents: async (batchId: string): Promise<ApiResponse<User[]>> => {
    const res = await client.get<ApiResponse<User[]>>(`${BASE}/${batchId}/students`);
    return res.data;
  },

  enrollStudent: async (batchId: string, userId: string): Promise<ApiResponse<any>> => {
    const res = await client.post<ApiResponse<any>>(`${BASE}/${batchId}/students`, { userId });
    return res.data;
  },

  removeStudent: async (batchId: string, userId: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/${batchId}/students/${userId}`);
    return res.data;
  },
};

export default batchesApi;
