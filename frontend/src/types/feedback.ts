// src/types/feedback.ts
import type { Role } from "./user";

export interface FeedbackReply {
  id: string;
  author: string;
  avatar: string;
  role: Role;
  content: string;
  time: string;
  createdAt?: string;
}

export interface Feedback {
  id: string;
  projectId: string;
  author: string;
  avatar: string;
  role: Role;
  content: string;
  time: string;
  resolved: boolean;
  replies?: FeedbackReply[];
  createdAt?: string;
}

export interface CodeReviewComment {
  id: string;
  projectId: string;
  commitSha: string;
  filePath: string;
  lineNumber: number;
  side: "LEFT" | "RIGHT";
  content: string;
  authorName: string;
  createdAt: string;
  isResolved: boolean;
}
