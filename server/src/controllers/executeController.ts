// src/controllers/executeController.ts
import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { BadRequestError } from "../utils/appError.js";
import { judge0Service, type FilePayload } from "../services/judge0Service.js";
import { redis } from "../config/redis.js";

const MAX_TOTAL_PAYLOAD_BYTES = 50 * 1024; // 50 KB limit
const RATE_LIMIT_WINDOW_SEC = 60;
const MAX_RUNS_PER_WINDOW = 20;

export const executeCode = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || "anonymous";
  const {
    engine = "python",
    selectedFilePath = "main.py",
    files = [],
    stdin = "",
    expectedOutput,
  } = req.body as {
    engine?: string;
    selectedFilePath?: string;
    files?: FilePayload[];
    stdin?: string;
    expectedOutput?: string;
  };

  if (!Array.isArray(files) || files.length === 0) {
    throw new BadRequestError("Files array is required and cannot be empty");
  }

  // Payload size security check
  const totalBytes = files.reduce(
    (acc, f) => acc + (f.content ? Buffer.byteLength(f.content, "utf8") : 0),
    0
  );
  if (totalBytes > MAX_TOTAL_PAYLOAD_BYTES) {
    throw new BadRequestError(
      `Payload size exceeds maximum allowed size of 50KB (${Math.round(
        totalBytes / 1024
      )}KB provided)`
    );
  }

  // Rate Limiter per User (Redis backed with soft fail)
  if (userId !== "anonymous") {
    try {
      const redisKey = `ratelimit:execute:${userId}`;
      const current = await redis.incr(redisKey);
      if (current === 1) {
        await redis.expire(redisKey, RATE_LIMIT_WINDOW_SEC);
      }
      if (current > MAX_RUNS_PER_WINDOW) {
        res.status(429).json({
          status: "fail",
          message: `Execution rate limit exceeded. Max ${MAX_RUNS_PER_WINDOW} runs per minute allowed.`,
        });
        return;
      }
    } catch {
      // Ignore Redis connection errors and continue
    }
  }

  const result = await judge0Service.executeCode({
    engine,
    selectedFilePath,
    files,
    stdin,
    expectedOutput,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getLanguages = catchAsync(async (_req: Request, res: Response) => {
  const languages = await judge0Service.getSupportedLanguages();
  res.status(200).json({
    status: "success",
    data: languages,
  });
});
