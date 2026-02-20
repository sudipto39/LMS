import { Request, Response, RequestHandler } from 'express';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import { authenticatedRequest } from '../middlewares/authMiddleware.js';

export const getMe: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const user = await User.findById(authReq.user.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);

export const updateMe: RequestHandler = catchAsync(
  async (req, res) => {
    const authReq = req as authenticatedRequest;

    const allowedFields = [
      'name',
      'phoneNumber',
      'department',
      'session',
    ];

    const updates: Record<string, unknown> = {};

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      authReq.user.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  }
);

export const getAllUsers: RequestHandler = catchAsync(
  async (_req: Request, res: Response) => {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  }
);

export const getUserById: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  }
);
