// src/api/courses.ts
import client from "./client";
import type { Course, CreateCoursePayload, ApiResponse } from "../types";

const BASE = "/v1/courses";

export const coursesApi = {
  getAllCourses: async (): Promise<ApiResponse<Course[]>> => {
    const res = await client.get<ApiResponse<Course[]>>(`${BASE}/allcourses`);
    return res.data;
  },

  createCourse: async (payload: CreateCoursePayload): Promise<ApiResponse<Course>> => {
    const res = await client.post<ApiResponse<Course>>(`${BASE}/create`, payload);
    return res.data;
  },

  updateCourse: async (id: string, payload: Partial<Course>): Promise<ApiResponse<Course>> => {
    const res = await client.patch<ApiResponse<Course>>(`${BASE}/${id}`, payload);
    return res.data;
  },

  deleteCourse: async (id: string): Promise<ApiResponse<null>> => {
    const res = await client.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return res.data;
  },

  getActiveCourses: async (): Promise<ApiResponse<Course[]>> => {
    const res = await client.get<ApiResponse<Course[]>>("/v1/batches/courses");
    return res.data;
  },
};

export default coursesApi;
