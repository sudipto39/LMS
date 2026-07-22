import dotenv from "dotenv";
import path from "path";

// Load .env file if it exists (local dev), CI uses env vars from ci.yml
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Fallbacks for local test runs without a full .env
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/lms_db";
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-access-secret-min-32-characters-long";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-min-32-characters-long";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
process.env.GITEA_BASE_URL = process.env.GITEA_BASE_URL || "http://localhost:3000";
process.env.GITEA_ADMIN_TOKEN = process.env.GITEA_ADMIN_TOKEN || "dummy-token";
process.env.GITEA_WEBHOOK_SECRET = process.env.GITEA_WEBHOOK_SECRET || "dummy-webhook-secret";
