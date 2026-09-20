// src/schemas/projectSchema.ts
import { z } from "zod";

export const createProjectSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),
    technologies: z.array(z.string().trim()).optional(),
    batchId: z.string().uuid("Invalid batch ID").optional(),
    courseId: z.string().uuid("Invalid course ID").optional(),
    supervisorId: z.string().uuid("Invalid supervisor ID").optional(),
    problemStatementId: z.string().uuid("Invalid problem statement ID").optional(),
    requestedSupervisorId: z.string().uuid("Invalid requested supervisor ID").optional(),
    supervisorRequestReason: z.string().trim().max(1000).optional(),
    repoMode: z.enum(["new", "existing"]).optional(),
    repoName: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9._-]+$/, "Repository name can only contain letters, numbers, hyphens, periods, and underscores")
      .max(100)
      .optional(),
    milestones: z
      .array(
        z.object({
          title: z.string().trim().min(1, "Milestone title cannot be empty"),
          due: z.string().optional(),
          dueDate: z.string().optional(),
        })
      )
      .optional(),
    parentProjectId: z.string().uuid("Invalid parent project ID").optional(),
  }),
});

export const postFeedbackSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Feedback content cannot be empty")
      .max(5000, "Feedback content cannot exceed 5000 characters"),
  }),
});

export const replyFeedbackSchema = z.object({
  body: z.object({
    content: z
      .string()
      .trim()
      .min(1, "Reply content cannot be empty")
      .max(5000, "Reply content cannot exceed 5000 characters"),
  }),
});

export const postCodeReviewCommentSchema = z.object({
  body: z.object({
    commitSha: z.string().trim().optional(),
    filePath: z.string().trim().optional(),
    lineNumber: z.number().int().positive().optional(),
    side: z.enum(["LEFT", "RIGHT"]).optional(),
    content: z
      .string()
      .trim()
      .min(1, "Comment content cannot be empty")
      .max(5000, "Comment content cannot exceed 5000 characters"),
  }),
});
