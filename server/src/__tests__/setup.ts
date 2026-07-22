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
// AWS — dummy values so S3Client initializes without crashing (not called in unit/integration tests)
process.env.AWS_REGION = process.env.AWS_REGION || "us-east-1";
process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "AKIADUMMYACCESSKEYID";
process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "dummySecretAccessKey1234567890123456";
process.env.AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "dummy-bucket";
