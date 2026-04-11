// src/middlewares/notFound.ts
import type { Request, Response, NextFunction } from "express";
import { NotFoundError } from "../utils/appError.js";

export const notFound = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new NotFoundError(`Route ${req.originalUrl}`));
};