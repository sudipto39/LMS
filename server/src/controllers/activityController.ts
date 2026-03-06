import { Request, Response, RequestHandler, NextFunction } from "express";
import mongoose from "mongoose";
import Activity from "../models/activityModel.js";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { authenticatedRequest } from "../middlewares/authMiddleware.js";

/*
--------------------------------------------------
Get Logged-in User Activity
--------------------------------------------------
*/
export const getMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as authenticatedRequest;

    if (!authReq.user) {
      return next(new AppError("Not authenticated", 401));
    }

    const activities = await Activity.find({
      actor: authReq.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
    });
  }
);

/*
--------------------------------------------------
Get Activity for a Specific Project
--------------------------------------------------
*/
export const getProjectActivity: RequestHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const projectId = req.params.projectId;

    if (!projectId || typeof projectId !== "string") {
      return next(new AppError("Invalid project id", 400));
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new AppError("Invalid project id", 400));
    }

    const activities = await Activity.find({
      project: projectId,
    })
      .sort({ createdAt: -1 })
      .populate("actor", "name role")
      .populate("milestone", "title")
      .lean();

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  }
);

/*
--------------------------------------------------
Get Activity for Supervisor Projects
--------------------------------------------------
*/
export const getSupervisorActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as authenticatedRequest;

    if (!authReq.user) {
      return next(new AppError("Not authenticated", 401));
    }

    res.set("Cache-Control", "no-store");
    
    const activities = await Activity.find()
      .populate({
        path: "project",
        match: { supervisor: authReq.user.id },
        select: "title",
      })
      .populate("actor", "name")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const filteredActivities = activities.filter(
      (activity: any) => activity.project !== null
    );

    res.status(200).json({
      success: true,
      data: filteredActivities,
    });
  }
);

/*
--------------------------------------------------
Get All Activity (Admin)
--------------------------------------------------
*/
export const getAdminActivity: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("actor", "name role")
      .populate("project", "title")
      .lean();

    res.status(200).json({
      success: true,
      data: activities,
    });
  }
);