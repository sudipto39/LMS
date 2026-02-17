import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// GET /api/users/me  → logged‑in user profile
export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// PATCH /api/users/me  → update own profile (not password)
export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const allowedFields = ['name', 'universityId', 'phone', 'bio', 'avatar'];
  const updates: Record<string, unknown> = {};

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(req.user!.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({
    success: true,
    data: updatedUser,
  });
});

// GET /api/users  → admin: list all users
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await User.find().select('-password');

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// GET /api/users/:id  → admin/supervisor: specific user
export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('supervisorId', 'name email');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// GET /api/users/my-students  → supervisor: list assigned students
export const getMyStudents = catchAsync(
  async (req: AuthRequest, res: Response) => {
    const students = await User.find({
      supervisorId: req.user!.id,
      role: 'student',
    }).select('-password');

    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    });
  }
);
