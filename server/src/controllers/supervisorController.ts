import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import User from "../models/userModel.js"
import Project from "../models/projectModel.js";
import Milestone from "../models/milestoneModel.js";
import ActivityModel from "../models/activityModel.js";
import { RequestHandler } from "express";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { logActivity } from "../services/activityService.js";

export const getAllSupervisors: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId } = req.query;

    const filter: any = {
      role: "supervisor",
      isActive: true,
    };

    // optional course filter
    if (courseId && typeof courseId === "string") {
      filter.course = courseId;
    }

    const supervisors = await User.find(filter)
      .select("_id name email")
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: supervisors.length,
      data: supervisors,
    });
  }
);

export const getSupervisorDashboard = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    const supervisorId = new Types.ObjectId(req.user.id);

    const [projectsCount, pendingMilestones, recentActivity] =
      await Promise.all([
        Project.countDocuments({ supervisor: supervisorId }),

        Milestone.aggregate([
          {
            $lookup: {
              from: "projects",
              localField: "project",
              foreignField: "_id",
              as: "project",
            },
          },
          { $unwind: "$project" },
          {
            $match: {
              "project.supervisor": supervisorId,
              status: "submitted",
            },
          },
          { $count: "pendingReviews" },
        ]),

        ActivityModel.find({ actor: supervisorId })
          .sort({ createdAt: -1 })
          .limit(10)
          .populate("project", "title")
          .populate("milestone", "title order"),
      ]);

    res.status(200).json({
      status: "success",
      data: {
        totalProjects: projectsCount,
        pendingReviews: pendingMilestones[0]?.pendingReviews || 0,
        recentActivity,
      },
    });
  }
);

export const getAssignedProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    const supervisorId = new Types.ObjectId(req.user.id);

    const projects = await Project.find({
      supervisor: supervisorId,
    })
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      results: projects.length,
      data: projects,
    });
  }
);

export const getPendingMilestones = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    const supervisorId = new Types.ObjectId(req.user.id);

    const milestones = await Milestone.find({
      status: "submitted",
    })
      .populate({
        path: "project",
        match: { supervisor: supervisorId },
        select: "title owner",
        populate: {
          path: "owner",
          select: "name email",
        },
      })
      .populate("submittedBy", "name email");

    const filteredMilestones = milestones.filter((m) => m.project !== null);

    res.status(200).json({
      status: "success",
      results: filteredMilestones.length,
      data: filteredMilestones,
    });
  }
);

export const reviewMilestone = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, feedback } = req.body;

    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!["approved", "rejected"].includes(status)) {
      return next(new AppError("Status must be approved or rejected", 400));
    }

    const milestone = await Milestone.findById(req.params.id).populate(
      "project"
    );

    if (!milestone) {
      return next(new AppError("Milestone not found", 404));
    }

    milestone.status = status;
    milestone.supervisorFeedback = feedback;
    milestone.reviewedBy = new Types.ObjectId(req.user.id);

    await milestone.save();

    const projectId =
      typeof milestone.project === "object"
        ? milestone.project._id
        : milestone.project;

    await logActivity({
      actor: req.user.id,
      project: projectId,
      milestone: milestone._id,
      type: "review",
      message: `Milestone ${status} by supervisor`,
    });

    res.status(200).json({
      status: "success",
      message: `Milestone ${status} successfully`,
      data: milestone,
    });
  }
);

export const getSupervisorActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    const supervisorId = new Types.ObjectId(req.user.id);

    const activities = await ActivityModel.find({
      actor: supervisorId,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("project", "title")
      .populate("milestone", "title order");

    res.status(200).json({
      status: "success",
      results: activities.length,
      data: activities,
    });
  }
);