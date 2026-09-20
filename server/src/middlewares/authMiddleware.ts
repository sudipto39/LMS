// src/middlewares/authMiddleware.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { UnauthorizedError, ForbiddenError } from "../utils/appError.js";
import { verifyAccessToken } from "../utils/createSendToken.js";
import type { Role } from "../generated/prisma/index.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";

// ─── Protect middleware ───────────────────────────────────────────────────────

export const protect: RequestHandler = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // 1. Extract token from Authorization header or query parameter (for direct file downloads/previews)
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (typeof req.query["token"] === "string" && req.query["token"]) {
      token = req.query["token"];
    } else if (req.cookies && typeof req.cookies["accessToken"] === "string" && req.cookies["accessToken"]) {
      token = req.cookies["accessToken"];
    }

    if (!token) throw new UnauthorizedError("You are not logged in");

    // 2. Verify token — throws if expired or invalid
    let decoded: { id: string; role: Role; iat?: number };
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError("Invalid or expired token. Please log in again");
    }

    // Check if token was issued prior to a revocation event (logout / password reset)
    if (decoded.iat && redis.status === "ready") {
      try {
        const revokedBefore = await redis.get(`revoked_before:${decoded.id}`);
        if (revokedBefore && decoded.iat < parseInt(revokedBefore, 10)) {
          throw new UnauthorizedError("Session has been revoked. Please log in again");
        }
      } catch (err) {
        if (err instanceof UnauthorizedError) throw err;
      }
    }

    // 3. Check user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
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
  if (env.EMAIL_VERIFICATION && !req.user?.isEmailVerified) {
    throw new UnauthorizedError("Please verify your email address before accessing this resource");
  }
  next();
};