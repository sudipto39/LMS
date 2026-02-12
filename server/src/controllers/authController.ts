import { config } from '../config/env.js';
import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { createSendToken } from '../utils/createSendToken.js';

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, universityId, email, password, phoneNumber, department, session } = req.body;

  const existingUser = await User.findOne({ $or: [{ email }, { universityId }] });
  if (existingUser) {
    return next(new AppError('User already exists', 400));
  }

  const userData: any = {
    name,
    universityId,
    email,
    password,
    phoneNumber,
    department,
    session,
  };

  if (config.EMAIL_VERIFICATION) {
    userData.verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    userData.verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    userData.isVerified = false;
  } else {
    userData.isVerified = true;
  }

  const newUser = await User.create(userData);

  if (!config.EMAIL_VERIFICATION) {
    return createSendToken(newUser, 201, res);
  }

  res.status(201).json({
    success: true,
    message: 'User registered. Check your email for verification code.',
    data: { userId: newUser._id },
  });
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  const isCorrect = await user.isCorrectPassword(password);
  if (!isCorrect) {
    return next(new AppError('Invalid credentials', 401));
  }

  if (config.EMAIL_VERIFICATION && !user.isVerified) {
    return next(new AppError('Please verify your email first', 401));
  }

  createSendToken(user, 200, res);
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!config.EMAIL_VERIFICATION) {
    return next(new AppError('Email verification is currently disabled', 400));
  }

  const { email, verifyCode } = req.body;

  const user = await User.findOne({
    email,
    verifyCode,
    verifyCodeExpiry: { $gt: new Date() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired code', 400));
  }

  user.isVerified = true;
  user.verifyCode = undefined as any;
  user.verifyCodeExpiry = undefined as any;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});
