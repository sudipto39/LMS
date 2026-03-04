import { Types } from "mongoose";
import ActivityModel, { ActivityType } from "../models/activityModel.js";

interface LogActivityParams {
  actor?: string | Types.ObjectId;
  project?: string | Types.ObjectId;
  milestone?: string | Types.ObjectId;

  type: ActivityType;
  message: string;

  metadata?: Record<string, any>;
}

export const logActivity = async ({
  actor,
  project,
  milestone,
  type,
  message,
  metadata = {},
}: LogActivityParams) => {
  try {
    const activityData: any = {
      type,
      message,
      metadata,
    };

    if (actor) activityData.actor = new Types.ObjectId(actor);
    if (project) activityData.project = new Types.ObjectId(project);
    if (milestone) activityData.milestone = new Types.ObjectId(milestone);

    await ActivityModel.create(activityData);
  } catch (error) {
    console.error("Activity logging failed:", error);
  }
};