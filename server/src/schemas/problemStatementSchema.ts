// src/schemas/problemStatementSchema.ts
import { z } from "zod";

export const createProblemStatementSchema = z.object({
  body: z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    domain: z.string().min(2, "Domain category is required"),
    technologies: z.array(z.string()).min(1, "At least one technology is required"),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional().default("INTERMEDIATE"),
    expectedOutcomes: z.string().optional(),
    prerequisites: z.string().optional(),
    maxSelections: z.number().int().min(1).max(10).optional().default(3),
  }),
});

export const updateProblemStatementSchema = z.object({
  body: z.object({
    title: z.string().min(5).optional(),
    description: z.string().min(20).optional(),
    domain: z.string().min(2).optional(),
    technologies: z.array(z.string()).optional(),
    difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
    expectedOutcomes: z.string().optional(),
    prerequisites: z.string().optional(),
    maxSelections: z.number().int().min(1).max(10).optional(),
  }),
});

export const reviewProblemStatementSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED", "ARCHIVED"]),
    adminFeedback: z.string().optional(),
  }),
});

export const reviewSupervisorRequestSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    assignedSupervisorId: z.string().optional(),
    adminNote: z.string().optional(),
  }),
});
