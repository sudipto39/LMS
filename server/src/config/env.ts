// src/config/env.ts
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

  // JWT
  JWT_ACCESS_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters").default("supersecretkey1234567890abcdefghijklmnopqrst")
    ),
  JWT_REFRESH_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters").default("ecretkey1234567890abcdefghijklmnopqrst")
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
      z.string().url("CLIENT_URL must be a valid URL").default("http://localhost:5173")
    ),

  // Resend
  RESEND_API_KEY: z
    .preprocess(emptyToUndefined, z.string().default("")),

  // Gitea
  GITEA_BASE_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().url("GITEA_BASE_URL must be a valid URL").default("http://34.93.254.1:3000/api/v1")
    ),
  GITEA_ADMIN_TOKEN: z
    .preprocess(
      emptyToUndefined,
      z.string().default("a169a45af58148dd73f821aa5b8f4f3d19320713")
    ),
  GITEA_WEBHOOK_SECRET: z
    .preprocess(
      emptyToUndefined,
      z.string().default("supersecretkey1234567890abcdefghijklmnopqrst")
    ),

  // Judge0 Code Execution
  JUDGE0_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().url("JUDGE0_URL must be a valid URL").default("http://34.93.254.1:2358")
    ),
  JUDGE0_AUTH_TOKEN: z
    .preprocess(emptyToUndefined, z.string().optional().default("")),
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