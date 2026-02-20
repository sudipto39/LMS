import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";

export interface authenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}
export const protect: RequestHandler = catchAsync(
  async (req, _res, next) => {
    // cast ONCE internally
    const authReq = req as authenticatedRequest;

    let token: string | undefined;

    if (
      authReq.headers.authorization &&
      authReq.headers.authorization.startsWith('Bearer')
    ) {
      token = authReq.headers.authorization.split(' ')[1];
    } else if (authReq.cookies?.jwt) {
      token = authReq.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;

    const currentUser = await User.findById(decoded.id).select('role');

    if (!currentUser) {
      return next(new AppError('The user no longer exists', 401));
    }

    authReq.user = {
      id: currentUser._id.toString(),
      role: currentUser.role,
    };

    next();
  }
);

export const restrictTo = (...roles: string[]): RequestHandler => {
  return (req, _res, next) => {
    const authReq = req as authenticatedRequest;

    if (!authReq.user || !roles.includes(authReq.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};