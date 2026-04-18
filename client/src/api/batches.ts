// src/api/batches.ts
import client from "./client";
import type { Course, Batch } from "../types";

const BASE = "/v1/batches";

const batchesAPI = {
  // ─── Public (no auth — used in registration dropdowns) ───────────────────

  getCourses: () =>
    client.get<{ status: string; count: number; data: Course[] }>(
      `${BASE}/courses`
    ),

  getBatchesByCourse: (courseId: string) =>
    client.get<{ status: string; count: number; data: Batch[] }>(
      `${BASE}/courses/${courseId}/batches`
    ),

  // ─── Admin only ───────────────────────────────────────────────────────────

  getAllBatches: () =>
    client.get<{ status: string; count: number; data: Batch[] }>(BASE),

  createBatch: (data: {
    name: string;
    courseId: string;
    startYear: number;
    endYear: number;
  }) =>
    client.post<{ status: string; data: Batch }>(BASE, data),

  deleteBatch: (id: string) =>
    client.delete(`${BASE}/${id}`),
};

export default batchesAPI;