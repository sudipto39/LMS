import catchAsync from "../utils/catchAsync.js";
import Project from "../models/projectModel.js";
import User from "../models/userModel.js";
import "../models/batchModel.js";
import "../models/courseModel.js";
import { authenticatedRequest } from "../middlewares/authMiddleware.js";
import { AppError } from "../utils/appError.js";
import { Types } from "mongoose";
import { RequestHandler } from "express";
import { createRepo } from "../services/giteaService.js";

/**
 * STEP 1 — Create Project Draft
 */
export const createProject: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;

    const user = await User.findById(authReq.user.id).select("course batch");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.course || !user.batch) {
      return next(
        new AppError(
          "Your profile is incomplete. Course or batch missing.",
          400,
        ),
      );
    }

    // Accept both frontend field names and backend field names
    const technologies =
      authReq.body.techStack || authReq.body.technologies || [];
    const supervisor =
      authReq.body.supervisorId || authReq.body.supervisor || null;

    // Handle repo creation if requested
    let repoUrl: string | undefined;
    const { repoOption, repoName, existingRepoUrl } = authReq.body;

    if (repoOption === "create_new" && repoName) {
      try {
        const repo = await createRepo(repoName);
        repoUrl = repo.html_url || repo.clone_url;
      } catch (err: any) {
        return next(
          new AppError(
            `Failed to create Gitea repository: ${err.message}`,
            502,
          ),
        );
      }
    } else if (repoOption === "link_existing" && existingRepoUrl) {
      repoUrl = existingRepoUrl;
    }

    const projectData: Record<string, unknown> = {
      title: authReq.body.title,
      description: authReq.body.description,
      technologies,
      owner: new Types.ObjectId(authReq.user.id),
      course: user.course,
      batch: user.batch,
      supervisor,
      status: "draft",
      isActive: true,
    };

    if (repoUrl) {
      projectData.repoUrl = repoUrl;
    }

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      message: "Project draft created",
      data: project,
    });
  },
);

/**
 * STEP 2 — Configure Repository
 */
export const setupRepository: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = authReq.params;

    if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid project ID", 400));
    }

    const { repoUrl } = authReq.body;

    if (!repoUrl) {
      return next(new AppError("Repository URL is required", 400));
    }

    const project = await Project.findOne({
      _id: id,
      owner: authReq.user.id,
      isActive: true,
    });

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    if (project.repoUrl) {
      return next(new AppError("Repository already configured", 400));
    }

    project.repoUrl = repoUrl;
    await project.save();

    res.status(200).json({
      success: true,
      message: "Repository configured successfully",
      data: project,
    });
  },
);

/**
 * STEP 3 — Save Milestones
 */
export const setupMilestones: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = authReq.params;

    if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid project ID", 400));
    }

    const { milestones } = authReq.body;

    if (!milestones || !Array.isArray(milestones)) {
      return next(new AppError("Milestones must be an array", 400));
    }

    const project = await Project.findOne({
      _id: id,
      owner: authReq.user.id,
      isActive: true,
    });

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    project.milestones = milestones;
    project.status = "submitted";

    await project.save();

    res.status(200).json({
      success: true,
      message: "Milestones saved and project submitted",
      data: project,
    });
  },
);

/**
 * Student — View Own Projects
 */
export const getMyProjects: RequestHandler = catchAsync(async (req, res) => {
  const authReq = req as authenticatedRequest;

  const projects = await Project.find({
    owner: authReq.user.id,
    isActive: true,
  })
    .populate("supervisor", "name email")
    .populate("course", "name code")
    .populate("batch", "name startYear endYear")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: projects.length,
    data: projects,
  });
});

/**
 * Supervisor — View Assigned Projects
 */
export const getSupervisedProjects: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const projects = await Project.find({
      supervisor: authReq.user.id,
      isActive: true,
    })
      .populate("owner", "name email universityId")
      .populate("course", "name code")
      .populate("batch", "name startYear endYear")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  },
);

/**
 * Get Single Project by ID
 */
export const getProjectById: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { id } = req.params;

    if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid project ID", 400));
    }

    const project = await Project.findOne({ _id: id, isActive: true })
      .populate("supervisor", "name email")
      .populate("owner", "name email universityId")
      .populate("course", "name code")
      .populate("batch", "name startYear endYear");

    if (!project) {
      return next(new AppError("Project not found", 404));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  },
);

/**
 * Update Project
 */
export const updateProject: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = authReq.params;

    if (!id || Array.isArray(id) || !Types.ObjectId.isValid(id)) {
      return next(new AppError("Invalid project ID", 400));
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: id,
        owner: authReq.user.id,
        isActive: true,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!project) {
      return next(new AppError("Project not found or access denied", 404));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  },
);
