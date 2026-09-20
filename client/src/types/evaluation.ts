// src/types/evaluation.ts

export interface ExperimentMark {
  exp: number;
  notebook: number; // Max 2
  performance: number; // Max 2
}

export interface ContinuousEvaluationRow {
  slNo: number;
  id: string | null;
  studentId: string;
  roll: string;
  name: string;
  programme: string;
  courseCode: string;
  courseName: string;
  semester: string;
  experiments: ExperimentMark[];
  experimentsTotal: number; // Max 40 (Sum of 10 experiments notebook + performance)
  internalViva: number; // Max 10 (Continuous Viva Voce)
  totalInternal: number; // Max 50 (experimentsTotal + internalViva)
  endSemLabTest: number; // Max 30 (Lab Test and/or Mini Project)
  endSemViva: number; // Max 20 (End Semester Viva Voce)
  totalEndSem: number; // Max 50 (endSemLabTest + endSemViva)
  finalMarks: number; // Max 100 (totalInternal + totalEndSem)
  remarks?: string;
  updatedAt?: string | Date;
}

export interface CourseEvaluationMetadata {
  programme: string;
  semester: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  session: string;
  maxMarks: {
    experiments: number;
    internalViva: number;
    totalInternal: number;
    endSemLabTest: number;
    endSemViva: number;
    totalEndSem: number;
    finalMarks: number;
  };
}

export interface CourseEvaluationResponse {
  status: string;
  metadata: CourseEvaluationMetadata;
  count: number;
  data: ContinuousEvaluationRow[];
}
