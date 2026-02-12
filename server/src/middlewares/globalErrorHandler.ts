import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Something went wrong';

  // Operational / known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Logging
  if (config.NODE_ENV === 'development') {
    console.error('💥 ERROR:', err);
  } else {
    console.error('💥 ERROR:', message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.NODE_ENV === 'development' &&
      err instanceof Error && { stack: err.stack }),
  });
};
