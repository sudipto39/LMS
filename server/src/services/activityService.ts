// src/services/activityService.ts
import { prisma } from "../config/db.js";
import type { Prisma } from "../generated/prisma/index.js";

interface LogActivityParams {
  type: string;
  payload: Prisma.InputJsonValue;
  userId?: string | undefined;
  projectId?: string | undefined;
}

export const logActivity = async ({
  type,
  payload,
  userId,
  projectId,
}: LogActivityParams): Promise<void> => {
  try {
    await prisma.activity.create({
      data: {
        type,
        payload,
        ...(userId && { userId }),
        ...(projectId && { projectId }),
      },
    });
  } catch (error) {
    console.error("⚠️ Activity logging failed:", error);
  }
};