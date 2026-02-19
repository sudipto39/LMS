import { RequestHandler } from 'express';
import { Types } from 'mongoose';
import Milestone from '../models/milestoneModel.js';
import Project from '../models/projectModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { authenticatedRequest } from '../middlewares/authMiddleware.js';

export const createMilestone: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { projectId } = req.params;

    if (!projectId || Array.isArray(projectId)) {
      return next(new AppError('Invalid project ID', 400));
    }

    const project = await Project.findOne({
      _id: new Types.ObjectId(projectId),
      owner: authReq.user.id,
      isActive: true,
    });

    if (!project) {
      return next(new AppError('Project not found or access denied', 404));
    }

    const milestone = await Milestone.create({
      ...req.body,
      project: project._id,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      data: milestone,
    });
  }
);

export const getProjectMilestones: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId || Array.isArray(projectId)) {
      return next(new AppError('Invalid project ID', 400));
    }

    const milestones = await Milestone.find({
      project: new Types.ObjectId(projectId),
      isActive: true,
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      count: milestones.length,
      data: milestones,
    });
  }
);

export const submitMilestone: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return next(new AppError('Invalid milestone ID', 400));
    }

    const milestone = await Milestone.findById(id).populate('project');

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    const project = milestone.project as any;

    if (project.owner.toString() !== authReq.user.id) {
      return next(new AppError('You are not allowed to submit this milestone', 403));
    }

    if (milestone.status === 'approved') {
      return next(new AppError('Milestone already approved', 400));
    }

    milestone.status = 'submitted';
    milestone.submittedAt = new Date();
    milestone.studentNotes = req.body.studentNotes || '';

    await milestone.save();

    res.status(200).json({
      success: true,
      message: 'Milestone submitted successfully',
      data: milestone,
    });
  }
);

export const approveMilestone: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = req.params;

    const milestone = await Milestone.findById(id).populate('project');

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    const project = milestone.project as any;

    if (!project.supervisor || project.supervisor.toString() !== authReq.user.id) {
      return next(new AppError('Not authorized to approve this milestone', 403));
    }

    milestone.status = 'approved';
    milestone.supervisorFeedback = req.body.feedback || '';

    await milestone.save();

    res.status(200).json({
      success: true,
      message: 'Milestone approved',
      data: milestone,
    });
  }
);

export const rejectMilestone: RequestHandler = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;
    const { id } = req.params;

    const milestone = await Milestone.findById(id).populate('project');

    if (!milestone) {
      return next(new AppError('Milestone not found', 404));
    }

    const project = milestone.project as any;

    if (!project.supervisor || project.supervisor.toString() !== authReq.user.id) {
      return next(new AppError('Not authorized to reject this milestone', 403));
    }

    milestone.status = 'rejected';
    milestone.supervisorFeedback = req.body.feedback || '';

    await milestone.save();

    res.status(200).json({
      success: true,
      message: 'Milestone rejected',
      data: milestone,
    });
  }
);

export const getMySubmissions: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const milestones = await Milestone.find({
      status: { $in: ['submitted', 'approved', 'rejected'] },
    })
      .populate({
        path: 'project',
        match: { owner: authReq.user.id },
        select: 'title',
      })
      .sort({ submittedAt: -1 });

    const filtered = milestones.filter((m) => m.project);

    res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered.map((m) => ({
        id: m._id,
        title: m.title,
        project: (m.project as any).title,
        status: m.status,
        submittedAt: m.submittedAt,
      })),
    });
  }
);