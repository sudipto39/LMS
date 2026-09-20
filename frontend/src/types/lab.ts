// src/types/lab.ts

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  weight?: number;
  explanation?: string;
}

export interface SingleTestResult {
  testCaseId: string;
  index: number;
  passed: boolean;
  actualOutput?: string;
  expectedOutput?: string;
  input?: string;
  error?: string;
  executionTime: number;
  memoryUsed: number;
  isHidden: boolean;
  weight: number;
  explanation?: string;
}

export interface GradingEvaluation {
  score: number;
  testsPassed: number;
  totalTests: number;
  status: "PASSED" | "FAILED";
  testResults: SingleTestResult[];
  maxExecutionTime: number;
  maxMemoryUsed: number;
}

export type LabSubmissionType = "CODING" | "PDF_REPORT";

export interface LabSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  code?: string | null;
  language?: string | null;
  status: "PENDING" | "RUNNING" | "EVALUATED" | "PASSED" | "FAILED";
  score: number;
  testsPassed?: number;
  totalTests?: number;
  testResults?: SingleTestResult[];
  executionTime?: number;
  memoryUsed?: number;
  // PDF Report fields
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  studentNotes?: string | null;
  supervisorFeedback?: string;
  manualScoreAdjust?: number;
  attemptNumber: number;
  submittedAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
    universityId?: string;
    department?: string;
  };
}

export interface LabAssignment {
  id: string;
  title: string;
  objective: string;
  description: string;
  subject?: string;
  prerequisites?: string;
  submissionType?: LabSubmissionType;
  manualUrl?: string | null;
  manualName?: string | null;
  language?: string;
  starterCode?: string;
  testCases?: TestCase[];
  timeLimit?: number;
  memoryLimit?: number;
  totalPoints: number;
  dueDate?: string | null;
  startDate: string;
  allowLate: boolean;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  batchId: string;
  batch?: {
    id: string;
    name: string;
    course?: {
      id: string;
      title: string;
      code?: string;
    };
  };
  creatorId: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  totalTestCount?: number;
  publicTestCount?: number;
  submissionCount?: number;
  mySubmission?: LabSubmission | null;
  mySubmissions?: LabSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface LabRosterItem {
  student: {
    id: string;
    name: string;
    email: string;
    universityId?: string;
    department?: string;
  };
  hasSubmitted: boolean;
  submissionCount: number;
  latestSubmission?: LabSubmission | null;
}

export interface LabRosterResponse {
  assignment: {
    id: string;
    title: string;
    objective: string;
    description: string;
    language: string;
    totalPoints: number;
    dueDate?: string | null;
    batch: { id: string; name: string };
  };
  stats: {
    totalStudents: number;
    submittedCount: number;
    pendingCount: number;
    averageScore: number;
  };
  roster: LabRosterItem[];
}
