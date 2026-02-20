import { Request, Response, RequestHandler } from 'express';
import User from '../models/userModel.js';
import Project from '../models/projectModel.js';
import Milestone from '../models/milestoneModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { authenticatedRequest } from '../middlewares/authMiddleware.js';

export const assignSupervisorToProject: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;
    const { supervisorId } = req.body;

    const supervisor = await User.findOne({
      _id: supervisorId,
      role: 'projectSupervisor',
    });

    if (!supervisor) {
      throw new AppError(
        'Supervisor not found or not a projectSupervisor',
        404
      );
    }

    const project = await Project.findByIdAndUpdate(
      authReq.params.id,
      { supervisor: supervisorId },
      { new: true }
    )
      .populate('owner', 'name email')
      .populate('supervisor', 'name email');

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  }
);

export const getAllProjectsForAdmin: RequestHandler = catchAsync(
  async (req, res) => {
    const query: Record<string, unknown> = {};

    if (req.query.status) query.status = req.query.status;
    if (req.query.supervisorId) query.supervisor = req.query.supervisorId;
    if (req.query.ownerId) query.owner = req.query.ownerId;

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('supervisor', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  }
);

export const getAdminStats: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const [
      totalUsers,
      totalStudents,
      totalSupervisors,
      totalProjects,
      totalMilestones,
      pendingMilestones,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'projectSupervisor' }),
      Project.countDocuments(),
      Milestone.countDocuments(),
      Milestone.countDocuments({ status: 'submitted' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalSupervisors,
        totalProjects,
        totalMilestones,
        pendingMilestones,
      },
    });
  }
);
