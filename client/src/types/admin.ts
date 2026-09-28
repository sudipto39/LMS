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
  type: string;
  scope?: string;
  msg: string;
  time: string;
  date?: string;
  createdAt?: string;
  user: string;
  userId?: string;
  avatar: string;
  project: string;
  projectId?: string;
  detail: string;
  payload?: any;
}
