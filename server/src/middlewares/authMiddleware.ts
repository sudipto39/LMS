// src/middlewares/authMiddleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { UnauthorizedError, ForbiddenError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/createSendToken.js";
import type { Role } from "../generated/prisma/index.js";

// ─── Protect middleware ───────────────────────────────────────────────────────

export const protect: RequestHandler = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // 1. Extract token from Authorization header only
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("You are not logged in");
    }

    const token = authHeader.split(" ")[1];
    if (!token) throw new UnauthorizedError("You are not logged in");

    // 2. Verify token — throws if expired or invalid
    let decoded: { id: string; role: Role };
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired token. Please log in again");
    }

    // 3. Check user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isEmailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("The user belonging to this token no longer exists");
    }

    // 4. Attach to request
    req.user = user;
    next();
  }
);

// ─── Role restriction middleware ──────────────────────────────────────────────

export const restrictTo = (...roles: Role[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };

// ─── Email verification middleware ────────────────────────────────────────────

export const requireVerifiedEmail: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user?.isEmailVerified) {
    throw new UnauthorizedError("Please verify your email address before accessing this resource");
  }
  next();
};