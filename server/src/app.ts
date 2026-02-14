import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import authRouter from './routes/authRoutes.js';
import connectDB from './config/db.js';
import { config } from './config/env.js';
import { globalErrorHandler } from './middlewares/globalErrorHandler.js';
import { notFound } from './middlewares/notFound.js';
import projectRouter from './routes/projectRoutes.js';
import milestoneRouter from './routes/milestoneRoutes.js';

export const app = express();

// 1. Database Connection
connectDB();

// 2. Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
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

// 5. Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6. API Routes
app.use('/api/v1/auth', authLimiter, authRouter);
app.use('/api/v1/projects', apiLimiter, projectRouter);
app.use('/api/v1/milestones', apiLimiter, milestoneRouter);
app.use('/api/v1', apiLimiter);

// 404 handler (NO route matched)
app.use(notFound);

// global error handler (LAST middleware)
app.use(globalErrorHandler);

export default app;
