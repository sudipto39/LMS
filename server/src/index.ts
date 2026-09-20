import "dotenv/config";
import "./config/env.js";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { emailService } from "./services/sendVerificationEmail.js";

async function startServer() {
  try {
    // 1. Start HTTP server first so Cloud Run port health check passes immediately
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(
        `🔧 Email Verification: ${env.EMAIL_VERIFICATION ? "ENABLED" : "DISABLED"}`
      );
    });

    server.on("error", (err) => {
      console.error("❌ Server failed to start:", err);
      process.exit(1);
    });

    // 2. Connect to PostgreSQL
    await connectDB();

    // 3. Connect to Redis (non-fatal)
    await connectRedis();

    // 4. Verify Nodemailer SMTP Connection
    void emailService.verifyConnection();

    // 4. Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`👋 ${signal} received. Shutting down gracefully...`);
      const forceTimer = setTimeout(() => {
        console.error("⚠️ Forcefully shutting down after timeout");
        process.exit(1);
      }, 10000);
      forceTimer.unref();

      server.close(async () => {
        await disconnectDB();
        await disconnectRedis();
        clearTimeout(forceTimer);
        console.log("✅ Graceful shutdown complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));

    // 5. Unhandled rejection safety net
    process.on("unhandledRejection", (reason) => {
      console.error("💥 Unhandled Rejection:", reason);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
