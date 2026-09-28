// src/types/milestone.ts

export type MilestoneStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED";

export interface MilestoneAttachment {
  name: string;
  url?: string;
  key?: string;
  size?: number;
  mimeType?: string;
  mimetype?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  projectTitle?: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  due: string;
  dueDate?: string;
  files: number;
  note?: string;
  feedback?: string;
  order: number;
  attachments?: MilestoneAttachment[];
  studentNotes?: string;
  submittedById?: string;
  reviewedById?: string;
  submittedAt?: string;
  reviewedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface SubmitMilestonePayload {
  notes?: string;
  files: File[];
}
