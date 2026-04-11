// src/middlewares/globalErrorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/index.js";
import { AppError } from "../utils/appError.js";
import { env } from "../config/env.js";

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ─── Prisma known errors ────────────────────────────────────────────────────

  // Unique constraint violation (e.g. duplicate email)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const field = (err.meta?.target as string[])?.join(", ") ?? "field";
      res.status(409).json({
        status: "fail",
        message: `A record with this ${field} already exists`,
      });
      return;
    }

    // Record not found (e.g. update/delete on non-existent record)
    if (err.code === "P2025") {
      res.status(404).json({
        status: "fail",
        message: "Record not found",
      });
      return;
    }

    // Foreign key constraint violation
    if (err.code === "P2003") {
      res.status(400).json({
        status: "fail",
        message: "Related record not found",
      });
      return;
    }
  }

  // Prisma validation error (bad data shape)
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      status: "fail",
      message: "Invalid data provided",
    });
    return;
  }

  // ─── JWT errors ─────────────────────────────────────────────────────────────

  if (err instanceof Error) {
    if (err.name === "JsonWebTokenError") {
      res.status(401).json({ status: "fail", message: "Invalid token" });
      return;
    }
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ status: "fail", message: "Token expired. Please log in again" });
      return;
    }
  }

  // ─── Operational / known AppErrors ──────────────────────────────────────────

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return;
  }

  // ─── Unknown / unexpected errors ─────────────────────────────────────────────

  console.error("💥 UNHANDLED ERROR:", err);

  res.status(500).json({
    status: "error",
    message:
      env.NODE_ENV === "production"
        ? "Something went wrong"
        : err instanceof Error
          ? err.message
          : "Unknown error",
    ...(env.NODE_ENV === "development" &&
      err instanceof Error && { stack: err.stack }),
  });
};