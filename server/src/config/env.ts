// src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const envSchema = z.object({
  NODE_ENV: z
    .preprocess(
      emptyToUndefined,
      z.enum(["development", "production", "test"]).default("development")
    ),
  PORT: z.coerce.number().int().positive().default(5000),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z
    .preprocess(emptyToUndefined, z.string().default("redis://localhost:6379")),

  // JWT — secrets MUST come from .env, never hardcoded
  JWT_ACCESS_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters")
    ),
  JWT_REFRESH_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    ),
  JWT_ACCESS_EXPIRES_IN: z
    .preprocess(emptyToUndefined, z.string().default("15m")),
  JWT_REFRESH_EXPIRES_IN: z
    .preprocess(emptyToUndefined, z.string().default("7d")),

  // Email verification toggle
  EMAIL_VERIFICATION: z
    .preprocess((v) => (v === "true" ? true : false), z.boolean())
    .default(false),

  // Client
  CLIENT_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().default("http://localhost:5173")
    ),

  // Storage Type ("local" for self-hosted university server, "s3" for AWS S3)
  STORAGE_TYPE: z
    .preprocess(emptyToUndefined, z.enum(["local", "s3"]).default("local")),
  UPLOAD_DIR: z
    .preprocess(emptyToUndefined, z.string().default("uploads")),

  // SMTP Email Configuration (Nodemailer - 100% Free Lifetime)
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().default("smtp.gmail.com")),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().default("")),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().default("")),
  SMTP_SECURE: z
    .preprocess((v) => (v === "true" ? true : false), z.boolean())
    .default(false),
  SMTP_SERVICE: z.preprocess(emptyToUndefined, z.string().optional().default("")),
  EMAIL_FROM: z
    .preprocess(emptyToUndefined, z.string().default("GiteaForge LMS <no-reply@giteaforge.com>")),

  // Legacy Resend (Optional fallback)
  RESEND_API_KEY: z
    .preprocess(emptyToUndefined, z.string().default("")),

  // Gitea — token and secret MUST come from .env, never hardcoded
  GITEA_BASE_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().url("GITEA_BASE_URL must be a valid URL").default("http://localhost:3000/api/v1")
    ),
  GITEA_ADMIN_TOKEN: z
    .preprocess(
      emptyToUndefined,
      z.string().min(1, "GITEA_ADMIN_TOKEN is required")
    ),
  GITEA_WEBHOOK_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().min(1, "GITEA_WEBHOOK_SECRET is required")
    ),

  // Judge0 Code Execution
  JUDGE0_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().url("JUDGE0_URL must be a valid URL").default("http://localhost:2358")
    ),
  JUDGE0_AUTH_TOKEN: z
    .preprocess(emptyToUndefined, z.string().optional().default("")),
  ENABLE_UNSANDBOXED_LOCAL_EXECUTION: z
    .preprocess((v) => v === "true" || v === true, z.boolean())
    .default(false),

  // AWS S3 Configuration
  AWS_REGION: z
    .preprocess(emptyToUndefined, z.string().default("ap-south-1")),
  AWS_ACCESS_KEY_ID: z
    .preprocess(emptyToUndefined, z.string().default("")),
  AWS_SECRET_ACCESS_KEY: z
    .preprocess(emptyToUndefined, z.string().default("")),
  AWS_S3_BUCKET_NAME: z
    .preprocess(emptyToUndefined, z.string().default("lms-giteaforge-uploads")),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV === "production" && data.STORAGE_TYPE === "s3") {
    if (!data.AWS_ACCESS_KEY_ID || data.AWS_ACCESS_KEY_ID.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AWS_ACCESS_KEY_ID is required and must be valid in production when STORAGE_TYPE=s3",
        path: ["AWS_ACCESS_KEY_ID"],
      });
    }
    if (!data.AWS_SECRET_ACCESS_KEY || data.AWS_SECRET_ACCESS_KEY.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AWS_SECRET_ACCESS_KEY is required and must be valid in production when STORAGE_TYPE=s3",
        path: ["AWS_SECRET_ACCESS_KEY"],
      });
    }
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n");
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;