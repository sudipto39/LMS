import { config } from "../config/env.js";
import { Request, Response, NextFunction } from "express";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { createSendToken } from "../utils/createSendToken.js";
import crypto from "crypto";

export const register = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      fullName,
      email,
      password,
      phone,
      university,
      department,
      session,
      rollNumber,
      course,
      batch,
    } = req.body;

    // Map client field names to server field names
    const name = fullName;
    const universityId = rollNumber;
    const phoneNumber = phone;

    const existingUser = await User.findOne({
      $or: [{ email }, { universityId }],
    });

    if (existingUser) {
      return next(new AppError("User already exists", 400));
    }

    // Build user data object
    const userData: any = {
      name,
      universityId,
      email,
      password,
      phoneNumber,
      department,
      role: "student" as const,
    };

    // Add course and batch only if provided
    if (course) userData.course = course;
    if (batch) userData.batch = batch;

    if (config.EMAIL_VERIFICATION) {
      Object.assign(userData, {
        verifyCode: Math.floor(100000 + Math.random() * 900000).toString(),
        verifyCodeExpiry: new Date(Date.now() + 10 * 60 * 1000),
        isVerified: false,
      });
    } else {
      Object.assign(userData, {
        isVerified: true,
      });
    }

    const newUser = await User.create(userData);

    if (!config.EMAIL_VERIFICATION) {
      return createSendToken(newUser, 201, res);
    }

    res.status(201).json({
      success: true,
      message: "User registered. Check your email for verification code.",
      data: {
        userId: newUser._id,
      },
    });
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isCorrect = await user.isCorrectPassword(password);
    if (!isCorrect) {
      return next(new AppError("Invalid credentials", 401));
    }

    if (config.EMAIL_VERIFICATION && !user.isVerified) {
      return next(new AppError("Please verify your email first", 401));
    }

    createSendToken(user, 200, res);
  },
);

export const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!config.EMAIL_VERIFICATION) {
      return next(
        new AppError("Email verification is currently disabled", 400),
      );
    }

    const { email, verifyCode } = req.body;

    const user = await User.findOne({
      email,
      verifyCode,
      verifyCodeExpiry: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError("Invalid or expired code", 400));
    }

    user.isVerified = true;
    user.verifyCode = undefined as any;
    user.verifyCodeExpiry = undefined as any;

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, res);
  },
);

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Please provide your email", 400));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with this email", 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await user.save({ validateBeforeSave: false });

  // TEMP: return token in response (remove in production)
  res.status(200).json({
    success: true,
    message: "Password reset token generated",
    resetToken, // 👈 send via email later
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  const { password } = req.body;
  const token = req.params.token;

  if (!password) {
    return next(new AppError("Please provide a new password", 400));
  }

  if (!token || typeof token !== "string") {
    return next(new AppError("Invalid or missing reset token", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+password");

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = password;

  delete user.passwordResetToken;
  delete user.passwordResetExpires;

  await user.save();

  createSendToken(user, 200, res);
});

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "", {
    expires: new Date(0),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
