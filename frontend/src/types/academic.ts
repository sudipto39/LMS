// src/types/academic.ts

export interface Course {
  id: string;
  code: string;
  title: string;
  durationYears: number;
  school: string;
  batchCount: number;
  description?: string;
  isActive?: boolean;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  startYear: number;
  endYear: number;
  enrolledCount: number;
  isActive: boolean;
}

export interface CreateCoursePayload {
  code: string;
  title: string;
  durationYears: number;
  school?: string;
}

export interface CreateBatchPayload {
  name: string;
  courseId: string;
  startYear: number;
  endYear: number;
}
