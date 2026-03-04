// import mongoose from 'mongoose';
// import { AppError } from './appError.js';

// export const requireObjectId = (id?: string) => {
//   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError('Invalid id', 400);
//   }
//   return new mongoose.Types.ObjectId(id);
// };

import { Request, Response, NextFunction, RequestHandler } from "express";
import { Types } from "mongoose";
import { AppError } from "./appError.js";

const requireObjectId = (paramName: string): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    // ensure it's a string
    if (!value || typeof value !== "string") {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }

    if (!Types.ObjectId.isValid(value)) {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }

    next();
  };
};

export default requireObjectId;