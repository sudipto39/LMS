import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import { redis } from "./config/redis.js";
import { swaggerSpec } from "./docs/swagger.js";
import { requestIdMiddleware } from "./middlewares/requestIdMiddleware.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import courseRouter from "./routes/courseRoutes.js";
import batchRouter from "./routes/batchRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import milestoneRouter from "./routes/milestoneRoutes.js";
import activityRouter from "./routes/activityRoutes.js";
import supervisorRouter from "./routes/supervisorRoutes.js";
import giteaRouter from "./routes/giteaRoutes.js";
import webhookRouter from "./routes/webhookRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";
import executeRouter from "./routes/executeRoutes.js";
import labAssignmentRouter from "./routes/labAssignmentRoutes.js";
import problemStatementRouter from "./routes/problemStatementRoutes.js";
import courseEvaluationRouter from "./routes/courseEvaluationRoutes.js";

export const app = express();

// ─── Tracing & Correlation ID ────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = env.CLIENT_URL
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (origin === "null") return callback(null, false);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(cleanOrigin) ||
        /^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(cleanOrigin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    exposedHeaders: ["X-Request-Id", "X-CSRF-Token"],
  })
);

// ─── Rate limiting for Webhooks ───────────────────────────────────────────────
const isDev = env.NODE_ENV === "development";
const isTest = env.NODE_ENV === "test";

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isTest ? 100 : (isDev ? 200 : 60),
  message: "Too many webhook requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Webhook route FIRST (needs raw body before express.json) ─────────────────
app.use("/api/v1/webhooks", webhookLimiter, webhookRouter);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
morgan.token("req-id", (req: express.Request) => req.id || "-");
const morganOptions = {
  skip: (req: express.Request) => req.path === "/health",
};
if (env.NODE_ENV === "development") {
  app.use(morgan("dev", morganOptions));
} else {
  app.use(
    morgan(
      '[:date[iso]] :req-id :method :url :status :res[content-length] - :response-time ms',
      morganOptions
    )
  );
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 10 : (isDev ? 100 : (Number(process.env.AUTH_RATE_LIMIT) || 300)),
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1", (req, res, next) => {
  if (req.path.startsWith("/webhooks")) return next();
  return apiLimiter(req, res, next);
});

// ─── No-cache & CSRF Header Helper ───────────────────────────────────────────
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// ─── API Documentation (Swagger / OpenAPI UI) ─────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── CSRF Token Endpoint & Validation ─────────────────────────────────────────
app.get("/api/v1/auth/csrf", (_req, res) => {
  const csrfToken = crypto.randomBytes(24).toString("hex");
  res.setHeader("X-CSRF-Token", csrfToken);
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.status(200).json({ status: "success", csrfToken });
});

const safeCompare = (a: string, b: string): boolean => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

// Double-submit CSRF validation for mutating requests
const publicAuthMutatingPaths = [
  "/api/v1/auth/register",
  "/api/v1/auth/verify-email",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh-token",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

app.use((req, res, next) => {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"];
  if (!mutating.includes(req.method)) return next();
  if (
    req.path.startsWith("/api/v1/webhooks") ||
    publicAuthMutatingPaths.some((p) => req.path.startsWith(p))
  ) {
    return next();
  }

  const cookieCsrf = req.cookies?.["csrfToken"];
  const headerCsrf = req.headers["x-csrf-token"];

  // Enforce CSRF token verification whenever csrfToken cookie is present
  if (cookieCsrf) {
    if (
      !headerCsrf ||
      typeof headerCsrf !== "string" ||
      !safeCompare(cookieCsrf, headerCsrf)
    ) {
      return res.status(403).json({
        status: "fail",
        message: "Invalid or missing CSRF token",
      });
    }
  } else if (req.cookies?.["refreshToken"]) {
    // If refreshToken cookie exists but csrfToken was not yet issued (e.g. legacy session),
    // issue the csrfToken now so subsequent requests can use it.
    const freshCsrf = crypto.randomBytes(24).toString("hex");
    res.cookie("csrfToken", freshCsrf, {
      httpOnly: false,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });
    res.setHeader("X-CSRF-Token", freshCsrf);
  }
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter, authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/batches", batchRouter);
app.use("/api/v1/projects", projectRouter);
app.use("/api/v1", milestoneRouter);
app.use("/api/v1/activities", activityRouter);
app.use("/api/v1/supervisors", supervisorRouter);
app.use("/api/v1/gitea", giteaRouter);
app.use("/api/v1/uploads", uploadRouter);
app.use("/api/v1/execute", executeRouter);
app.use("/api/v1/lab-assignments", labAssignmentRouter);
app.use("/api/v1/problem-statements", problemStatementRouter);
app.use("/api/v1/evaluations", courseEvaluationRouter);

// ─── Health check caching & coalescing ───────────────────────────────────────
interface HealthStatus {
  isHealthy: boolean;
  dbStatus: string;
  redisStatus: string;
  checkedAt: number;
}

let cachedHealth: HealthStatus | null = null;
let inFlightHealthCheck: Promise<HealthStatus> | null = null;
const HEALTH_CACHE_TTL_MS = 2000; // 2-second in-memory cache to protect DB connection pool under load

async function performHealthCheck(): Promise<HealthStatus> {
  let dbStatus = "healthy";
  let redisStatus = redis.status === "ready" ? "healthy" : "disconnected";
  let isHealthy = true;

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("DB timeout")), 3000)),
    ]);
  } catch {
    dbStatus = "unreachable";
    isHealthy = false;
  }

  if (redis.status === "ready") {
    try {
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Redis timeout")), 500)),
      ]);
      redisStatus = "healthy";
    } catch {
      redisStatus = "unreachable";
    }
  }

  return {
    isHealthy,
    dbStatus,
    redisStatus,
    checkedAt: Date.now(),
  };
}

async function getHealthStatus(): Promise<HealthStatus> {
  const now = Date.now();
  if (cachedHealth && now - cachedHealth.checkedAt < HEALTH_CACHE_TTL_MS) {
    return cachedHealth;
  }

  if (!inFlightHealthCheck) {
    inFlightHealthCheck = performHealthCheck()
      .then((res) => {
        cachedHealth = res;
        return res;
      })
      .finally(() => {
        inFlightHealthCheck = null;
      });
  }

  return inFlightHealthCheck;
}

// ─── Health checks ────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "GiteaForge API is running 🚀",
  });
});

app.get("/health", async (_req, res) => {
  const { isHealthy, dbStatus, redisStatus } = await getHealthStatus();

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
