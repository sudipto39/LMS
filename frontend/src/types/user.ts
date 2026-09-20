// src/types/user.ts

export type Role = "STUDENT" | "SUPERVISOR" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  dept: string;
  department?: string;
  idNo: string;
  phoneNumber?: string | null;
  batch?: string | null;
  bio?: string | null;
  universityId?: string | null;
  isEmailVerified?: boolean;
  giteaUsername?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SSHKey {
  id: number | string;
  title: string;
  fingerprint: string;
  keyType: string;
  createdAt: string;
}

export interface StudentStats {
  totalProjects: number;
  totalCommits: number;
  milestoneProgress: number;
  overallGrade: string;
  approvedDeliverables: number;
  pendingReviews: number;
}
