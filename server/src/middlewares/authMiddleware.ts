import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with your User type when available
}

export const protect = catchAsync(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in', 401));
    }

    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    const currentUser = await User.findById(decoded.id).select('-password');
    
    if (!currentUser) {
      return next(new AppError('The user no longer exists', 401));
    }

    req.user = currentUser;
    next();
  }
);

export const admin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to access this resource'
    });
  }

  if (req.user.role !== 'admin') { // Assuming your User has 'role' field
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
