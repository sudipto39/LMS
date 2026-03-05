// import mongoose from 'mongoose';
// import { AppError } from './appError.js';

// export const requireObjectId = (id?: string) => {
//   if (!id || !mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError('Invalid id', 400);
//   }
//   return new mongoose.Types.ObjectId(id);
// };
import { Request, Response, NextFunction, RequestHandler } from "express";
import mongoose from "mongoose";
import { AppError } from "./appError.js";

export const requireObjectId = (paramName: string): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value = req.params[paramName];

    if (!value || typeof value !== "string") {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }

    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(new AppError(`Invalid ${paramName}`, 400));
    }

    // convert to ObjectId and attach to request
    (req as any)[paramName] = new mongoose.Types.ObjectId(value);

    next();
  };
};

export default requireObjectId;