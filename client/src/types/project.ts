// src/types/project.ts
import type { User } from "./user";

export type ProjectStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED";

export interface ProjectFile {
  path: string;
  name: string;
  size: string;
  language: string;
  content: string;
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  desc: string;
  description?: string;
  techs: string[];
  technologies?: string[];
  progress: number;
  team: User[];
  ownerId?: string;
  owner?: User;
  members?: any[];
  supervisor: string;
  supervisorId: string;
  repoUrl: string;
  repoName?: string;
  batchId?: string;
  batch?: string;
  phase: number;
  parentProjectId?: string;
  grade?: string;
  feedback?: string;
  problemStatementId?: string;
  problemStatement?: {
    id: string;
    title: string;
    domain: string;
    creator?: { id: string; name: string; email: string };
  };
  requestedSupervisorId?: string;
  requestedSupervisor?: {
    id: string;
    name: string;
    email: string;
    department?: string;
  };
  supervisorRequestStatus?: "PENDING" | "APPROVED" | "REJECTED";
  supervisorRequestReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  technologies: string[];
  courseId?: string;
  batchId?: string;
  supervisorId?: string;
  problemStatementId?: string;
  requestedSupervisorId?: string;
  supervisorRequestReason?: string;
  repoMode?: "new" | "existing";
  repoName?: string;
  parentProjectId?: string;
  milestones?: Array<{
    title: string;
    due: string;
  }>;
}
