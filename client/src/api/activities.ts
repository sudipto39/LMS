// src/api/activities.ts
import client from "./client";
import type { ActivityItem, PaginatedResponse } from "../types";

const BASE = "/v1/activities";

const activitiesAPI = {
  getMyActivity: () =>
    client.get<PaginatedResponse<ActivityItem>>(`${BASE}/me`),

  getProjectActivity: (projectId: string) =>
    client.get<PaginatedResponse<ActivityItem>>(
      `${BASE}/project/${projectId}`
    ),

  getSupervisorActivity: () =>
    client.get<PaginatedResponse<ActivityItem>>(`${BASE}/supervisor`),

  getAdminActivity: () =>
    client.get<PaginatedResponse<ActivityItem>>(`${BASE}/admin`),
};

export default activitiesAPI;