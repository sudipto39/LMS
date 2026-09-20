// src/api/evaluations.ts
import client from "./client";
import type {
  ContinuousEvaluationRow,
  CourseEvaluationResponse,
  ApiResponse,
} from "../types";

const BASE = "/v1/evaluations";

export const evaluationsApi = {
  getCourseEvaluations: async (
    courseCode: string,
    batchId?: string
  ): Promise<CourseEvaluationResponse> => {
    const params = batchId ? { batchId } : undefined;
    const res = await client.get<CourseEvaluationResponse>(
      `${BASE}/course/${courseCode}`,
      { params }
    );
    return res.data;
  },

  updateStudentEvaluation: async (
    courseCode: string,
    studentId: string,
    data: Partial<ContinuousEvaluationRow>
  ): Promise<ApiResponse<ContinuousEvaluationRow>> => {
    const res = await client.put<ApiResponse<ContinuousEvaluationRow>>(
      `${BASE}/course/${courseCode}/student/${studentId}`,
      data
    );
    return res.data;
  },

  bulkUpdateEvaluations: async (
    courseCode: string,
    evaluations: Partial<ContinuousEvaluationRow>[]
  ): Promise<ApiResponse<ContinuousEvaluationRow[]>> => {
    const res = await client.post<ApiResponse<ContinuousEvaluationRow[]>>(
      `${BASE}/course/${courseCode}/bulk`,
      { evaluations }
    );
    return res.data;
  },
};
