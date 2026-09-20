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
  title: string;
  status: MilestoneStatus;
  due: string;
  dueDate?: string;
  files: number;
  note?: string;
  feedback?: string;
  order: number;
  attachments?: MilestoneAttachment[];
  submittedAt?: string;
  reviewedAt?: string;
}

export interface SubmitMilestonePayload {
  notes?: string;
  files: File[];
}
