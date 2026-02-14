import catchAsync from '../utils/catchAsync.js';
import Project from '../models/projectModel.js';
import { authenticatedRequest } from '../middlewares/authMiddleware.js';
import { AppError } from '../utils/appError.js';
import { Types } from 'mongoose';
import { RequestHandler } from 'express';


// CREATE PROJECT (Student)
export const createProject: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const project = await Project.create({
      ...authReq.body,
      owner: authReq.user.id,
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  }
);

// GET MY PROJECTS (Student)
export const getMyProjects: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const projects = await Project.find({
      owner: authReq.user.id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: projects,
    });
  }
);

// GET SUPERVISED PROJECTS (Supervisor)
export const getSupervisedProjects: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const projects = await Project.find({
      supervisor: authReq.user.id,
      isActive: true,
    })
      .populate('owner', 'name email universityId')
      .populate('course')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  }
);

// UPDATE PROJECT (Owner only)
export const updateProject: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;

    const { id } = authReq.params;
    if (!id || Array.isArray(id)) {
      return next(new AppError('Invalid project ID', 400));
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        owner: new Types.ObjectId(authReq.user.id),
        isActive: true,
      },
      authReq.body,
      { new: true, runValidators: true }
    );

    if (!project) {
      return next(new AppError('Project not found or access denied', 404));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  }
);