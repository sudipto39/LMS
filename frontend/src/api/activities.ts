// src/api/activities.ts
import client from "./client";
import type { ActivityItem, ApiResponse } from "../types";

export interface CommitHeatmapData {
  currentStreak: number;
  longestStreak: number;
  totalCommits: number;
  bestDay?: number;
  weeks: Array<{
    weekIndex: number;
    days: Array<{ date: string; count: number; level: number }>;
  }>;
}

export const activitiesApi = {
  getMyActivities: async (): Promise<ApiResponse<ActivityItem[]>> => {
    const res = await client.get<ApiResponse<ActivityItem[]>>("/v1/activities/me");
    return res.data;
  },

  getAdminActivities: async (): Promise<ApiResponse<ActivityItem[]>> => {
    const res = await client.get<ApiResponse<ActivityItem[]>>("/v1/activities/admin");
    return res.data;
  },

  getSupervisorActivities: async (): Promise<ApiResponse<ActivityItem[]>> => {
    const res = await client.get<ApiResponse<ActivityItem[]>>("/v1/activities/supervisor");
    return res.data;
  },

  getProjectActivities: async (projectId: string): Promise<ApiResponse<ActivityItem[]>> => {
    const res = await client.get<ApiResponse<ActivityItem[]>>(`/v1/activities/project/${projectId}`);
    return res.data;
  },

  getCommitHeatmap: async (): Promise<ApiResponse<CommitHeatmapData>> => {
    const res = await client.get<ApiResponse<CommitHeatmapData>>("/v1/activities/heatmap");
    return res.data;
  },
};

export default activitiesApi;
