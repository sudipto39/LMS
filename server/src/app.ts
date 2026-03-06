import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import authRouter from './routes/authRoutes.js';
import { config } from './config/env.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { notFound } from './middlewares/notFound.js';
import projectRouter from './routes/projectRoutes.js';
import milestoneRouter from './routes/milestoneRoutes.js';
import userRouter from './routes/userRoutes.js';
import activityRouter from './routes/activityRoutes.js';
import giteaRouter from './routes/giteaRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import supervisorRouter from './routes/supervisorRoutes.js'
import courseRouter from './routes/courseRoutes.js'


export const app = express();

// 2. Security Middleware
app.use(helmet());
app.set('trust proxy', 1);

const allowedOrigins = config.CLIENT_URL
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server calls

    const cleanOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// 3. Rate Limiting (protect auth endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per IP (register/login)
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// 4. Body Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// 5. Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6. Apply rate limiting to all API routes
app.use('/api/v1', apiLimiter);

// stricter limiter for auth
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/milestones', milestoneRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/activities', activityRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/supervisors', supervisorRouter);
app.use('/api/v1/gitea', giteaRouter);
app.use('/api/v1/courses', courseRouter);

// 7. Base Route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
    env: process.env.NODE_ENV || "development"
  });
});

// 8. Health Check Endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404 handler (NO route matched)
app.use(notFound);

// global error handler (LAST middleware)
app.use(globalErrorHandler);

export default app;
