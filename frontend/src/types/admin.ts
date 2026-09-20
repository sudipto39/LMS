// src/types/admin.ts

export interface GiteaServerConfig {
  url: string;
  adminToken: string;
  webhookSecret: string;
  status: string;
  latency: string;
}

export interface AuditLogItem {
  id: string;
  time: string;
  user: string;
  action: string;
  desc: string;
}

export interface ActivityItem {
  id: string;
  type: "commit" | "milestone" | "feedback" | "push" | "grade" | "system";
  scope: "personal" | "project" | "supervisor" | "admin" | "all";
  msg: string;
  time: string;
  date?: string;
  user: string;
  avatar: string;
  project: string;
  detail: string;
}
