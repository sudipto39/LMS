// src/controllers/authController.ts
import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";
import { authService } from "../services/authService.js";
import {
  createSendToken,
  revokeRefreshToken,
  verifyRefreshToken,
  signAccessToken,
  getStoredRefreshToken,
} from "../utils/createSendToken.js";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  if (!env.EMAIL_VERIFICATION) {
    res.status(201).json({
      status: "success",
      message: "Registration successful",
      data: result,
    });
    return;
  }

  res.status(201).json({
    status: "success",
    message: "Registration successful. Please check your email for the verification code.",
    data: { userId: result.userId },
  });
});

export const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!env.EMAIL_VERIFICATION) {
      next(new AppError("Email verification is disabled", 400));
      return;
    }
    const { email, code } = req.body;
    const user = await authService.verifyEmail(email, code);
    await createSendToken(user, 200, res);
  }
);

export const login = catchAsync(async (req: Request, res: Response) => {
  const user = await authService.loginUser(req.body);
  await createSendToken(user, 200, res);
});

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      next(new AppError("No refresh token provided", 401));
      return;
    }

    let decoded: { id: string };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      next(new AppError("Invalid or expired refresh token", 401));
      return;
    }

    const stored = await getStoredRefreshToken(decoded.id);
    if (!stored || stored !== token) {
      next(new AppError("Refresh token revoked or invalid", 401));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) {
      next(new AppError("User no longer exists", 401));
      return;
    }

    const accessToken = signAccessToken(user.id, user.role);
    res.status(200).json({ status: "success", accessToken });
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    res.status(200).json({ status: "success", ...result });
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email, code, password } = req.body;
    const result = await authService.resetPassword(email, code, password);
    res.status(200).json({ status: "success", ...result });
  }
);

export const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (userId) await revokeRefreshToken(userId);

  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});