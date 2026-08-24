import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
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

export const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
// GiteaForge Backend API — v1.0.1 (Self-healing Gitea repo auto-provisioning enabled)
app.use(helmet());
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = env.CLIENT_URL
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (allowedOrigins.includes(cleanOrigin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);

// ─── Webhook route FIRST (needs raw body before express.json) ─────────────────
app.use("/api/v1/webhooks", webhookRouter);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "256kb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb" }));
app.use(cookieParser());
app.use(compression());

// ─── Logging ──────────────────────────────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
const isDev = env.NODE_ENV === "development";

// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: isDev ? 100 : 10,
//   message: "Too many requests from this IP, please try again later",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: isDev ? 1000 : 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1", apiLimiter);

// ─── No-cache ─────────────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
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

// ─── Health checks ────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "GiteaForge API is running 🚀",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
