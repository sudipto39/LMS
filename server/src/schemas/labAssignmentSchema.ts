// src/schemas/labAssignmentSchema.ts
import { z } from "zod";

export const testCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string().default(""),
  expectedOutput: z.string().default(""),
  isHidden: z.boolean().optional().default(false),
  weight: z.number().optional().default(1),
  explanation: z.string().optional(),
});

export const createLabAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    objective: z.string().min(5, "Objective must be at least 5 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    subject: z.string().optional().default("General Programming"),
    prerequisites: z.string().optional(),
    batchId: z.string().min(1, "Target Batch ID is required"),
    submissionType: z.enum(["CODING", "PDF_REPORT"]).optional().default("PDF_REPORT"),
    manualUrl: z.string().optional().nullable(),
    manualName: z.string().optional().nullable(),
    language: z.string().optional().default("python"),
    starterCode: z.string().optional().nullable(),
    testCases: z.array(testCaseSchema).optional().default([]),
    timeLimit: z.number().optional().default(2.0),
    memoryLimit: z.number().optional().default(128000),
    totalPoints: z.number().optional().default(100),
    dueDate: z.string().optional().nullable(),
    allowLate: z.boolean().optional().default(false),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional().default("PUBLISHED"),
  }),
});

export const updateLabAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    objective: z.string().min(5).optional(),
    description: z.string().min(5).optional(),
    subject: z.string().optional(),
    prerequisites: z.string().optional(),
    batchId: z.string().optional(),
    submissionType: z.enum(["CODING", "PDF_REPORT"]).optional(),
    manualUrl: z.string().optional().nullable(),
    manualName: z.string().optional().nullable(),
    language: z.string().optional(),
    starterCode: z.string().optional().nullable(),
    testCases: z.array(testCaseSchema).optional(),
    timeLimit: z.number().optional(),
    memoryLimit: z.number().optional(),
    totalPoints: z.number().optional(),
    dueDate: z.string().optional().nullable(),
    allowLate: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).optional(),
  }),
});

export const runLabTestSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Source code is required"),
    language: z.string().optional().default("python"),
  }),
});

export const submitLabCodeSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Source code is required"),
    language: z.string().optional().default("python"),
  }),
});

export const gradeSubmissionSchema = z.object({
  body: z.object({
    score: z.number().optional(),
    manualScoreAdjust: z.number().optional(),
    supervisorFeedback: z.string().optional(),
    notebookScore: z.number().min(0).max(2).optional(),
    performanceScore: z.number().min(0).max(2).optional(),
    vivaScore: z.number().min(0).max(10).optional(),
  }),
});

export const renameFolderSchema = z.object({
  body: z.object({
    oldSubject: z.string().min(1, "Old subject folder name is required"),
    newSubject: z.string().min(1, "New subject folder name is required"),
    batchId: z.string().optional(),
  }),
});

export const toggleFolderStatusSchema = z.object({
  body: z.object({
    subject: z.string().min(1, "Subject folder name is required"),
    status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]),
    batchId: z.string().optional(),
  }),
});

export const deleteFolderSchema = z.object({
  body: z.object({
    subject: z.string().min(1, "Subject folder name is required"),
    batchId: z.string().optional(),
  }),
});

