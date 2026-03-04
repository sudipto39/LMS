import { Request, Response, RequestHandler, NextFunction } from 'express';
import Activity from '../models/activityModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import requireObjectId from '../utils/requireObjectId.js';
import { authenticatedRequest } from '../middlewares/authMiddleware.js';

export const getMyActivity = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;

    if (!authReq.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const activities = await Activity.find({
      actor: requireObjectId(authReq.user.id),
    })
      .sort('-createdAt')
      .limit(20);

    res.status(200).json({
      success: true,
      data: activities,
    });
  }
);

export const getProjectActivity: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const { projectId } = req.params;

    if (typeof projectId !== 'string') {
      throw new AppError('Invalid project id', 400);
    }

    const activities = await Activity.find({
      project: requireObjectId(projectId),
    })
      .sort('-createdAt')
      .populate('actor', 'name role')
      .populate('milestone', 'title');

    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities,
    });
  }
);

export const getSupervisorActivity = catchAsync(
  async (req, res, next) => {
    const authReq = req as authenticatedRequest;

    if (!authReq.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const activities = await Activity.find()
      .populate({
        path: 'project',
        match: { supervisor: requireObjectId(authReq.user.id) },
        select: 'title',
      })
      .populate('actor', 'name')
      .sort('-createdAt')
      .limit(30);

    // remove activities where project didn’t match supervisor
    const filteredActivities = activities.filter(
      (activity) => activity.project
    );

    res.status(200).json({
      success: true,
      data: filteredActivities,
    });
  }
);

export const getAdminActivity: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const activities = await Activity.find()
      .sort('-createdAt')
      .limit(50)
      .populate('actor', 'name role')
      .populate('project', 'title');

    res.status(200).json({
      success: true,
      data: activities,
    });
  }
);
