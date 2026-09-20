// src/types/problemStatement.ts
import type { User } from "./user";

export type IdeaStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "ARCHIVED";
export type SupervisorRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  expectedOutcomes?: string | null;
  prerequisites?: string | null;
  status: IdeaStatus;
  adminFeedback?: string | null;
  maxSelections: number;
  creatorId: string;
  creator?: Partial<User>;
  currentSelections?: number;
  isFull?: boolean;
  availableSlots?: number;
  projects?: Array<{
    id: string;
    title: string;
    status: string;
    owner?: Partial<User>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProblemStatementPayload {
  title: string;
  description: string;
  domain: string;
  technologies: string[];
  difficulty?: string;
  expectedOutcomes?: string;
  prerequisites?: string;
  maxSelections?: number;
}

export interface SupervisorAllocationRequest {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  owner: {
    id: string;
    name: string;
    email: string;
    department?: string;
    universityId?: string;
  };
  batch?: {
    id: string;
    name: string;
    course?: { id: string; title: string };
  };
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
  supervisorRequestStatus: SupervisorRequestStatus;
  supervisorRequestReason?: string;
  supervisorActiveCount: number;
  createdAt: string;
}
