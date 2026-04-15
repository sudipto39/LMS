// src/middlewares/validate.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../utils/appError.js";

export const validate =
  (schema: z.ZodTypeAny) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const message = err.issues
          .map((issue) => `${issue.path.slice(1).join(".")}: ${issue.message}`)
          .join(", ");
        next(new AppError(message, 400));
        return;
      }
      next(err);
    }
  };