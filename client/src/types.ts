// src/types.ts

export type Role = "STUDENT" | "SUPERVISOR" | "ADMIN";

export type Page =
  | "landing" | "login" | "signup"
  | "student-dashboard" | "student-projects" | "student-create-project"
  | "student-project-detail" | "student-submissions" | "student-messages"
  | "student-profile" | "supervisor-dashboard" | "supervisor-projects"
  | "supervisor-project-detail" | "supervisor-reviews" | "supervisor-grades"
  | "supervisor-messages" | "supervisor-profile" | "admin-dashboard"
  | "admin-users" | "admin-batches" | "admin-gitea-settings"
  | "admin-audit-logs" | "admin-projects" | "admin-profile" | "activity" | "settings";

export interface User {
  id: string;
  name: string;
  universityId?: string | null;
  email: string;
  phoneNumber?: string | null;
  department?: string | null;
  role: Role;
  isEmailVerified: boolean;
  giteaUsername?: string | null;
  createdAt: string;
  updatedAt?: string;
  enrollments?: BatchEnrollment[];
}

export interface Course {
  id: string;
  title: string;
  code?: string | null;
  school?: string | null;
  durationYears: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  courseId: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  course?: Course;
}

export interface BatchEnrollment {
  batch: Batch;
}

export type ProjectStatus =
  | "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "ARCHIVED";

export type MilestoneStatus =
  | "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "REJECTED";

// ─── Project — all fields present, legacy ones optional ───────────────────────
export interface Project {
  // Prisma fields
  id: string;
  title: string;
  description?: string | null;
  status: ProjectStatus;
  repoName?: string | null;
  repoUrl?: string | null;
  technologies: string[];
  ownerId: string;
  supervisorId?: string | null;
  batchId: string;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: { id: string; name: string; email: string } | null;
  supervisor?: { id: string; name: string; email: string } | null;
  batch?: { id: string; name: string } | null;
  _count?: { milestones: number };

  // Legacy Mongoose-compatible fields — Dashboards.tsx uses these
  _id: string;           // ← non-optional so key={p._id} works
  deadline: string;      // ← non-optional so p.deadline works
  progress: number;      // ← non-optional so p.progress works
  lastPush: string;      // ← non-optional so p.lastPush works
  techStack: string[];   // ← non-optional so p.techStack works
  repoLinked?: boolean;
  student?: { name: string; _id: string };
  projectId?: string;
}

// ─── Milestone ────────────────────────────────────────────────────────────────
export interface Milestone {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  dueDate?: string | null;
  status: MilestoneStatus;
  projectId: string;
  submittedById?: string | null;
  reviewedById?: string | null;
  feedback?: string | null;
  studentNotes?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; title: string } | null;
  submittedBy?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;

  // Legacy fields
  _id: string;
}

// ─── Activity ─────────────────────────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  type: string;
  payload?: Record<string, unknown>;
  userId?: string | null;
  projectId?: string | null;
  createdAt: string;
  user?: { id: string; name: string; role: Role } | string | null;
  project?: { id: string; title: string } | string | null;

  // Legacy fields used in Dashboards.tsx
  message: string;
  timestamp: string;
  actor?: string;
  branch?: string;
  commitHash?: string;
}

export interface Comment {
  id: string;
  user: string;
  userRole: Role;
  message: string;
  timestamp: string;
  avatar?: string;
}

export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  status: string;
  count: number;
  data: T[];
}

export interface LoginResponse {
  status: string;
  accessToken: string;
  data: { user: User };
}

export interface RegisterResponse {
  status: string;
  message: string;
  data: { userId: string };
}

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalSupervisors: number;
  totalProjects: number;
  totalMilestones: number;
  pendingMilestones: number;
}

export interface GiteaRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  private: boolean;
  description: string;
  default_branch: string;
}

export interface GiteaCommit {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  html_url: string;
}