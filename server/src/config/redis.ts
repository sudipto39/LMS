// src/config/redis.ts
import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch (error) {
    console.error(
      "💥 Redis connection failed:",
      error instanceof Error ? error.message : error
    );
  }
};

export const disconnectRedis = async (): Promise<void> => {
  await redis.quit();
  console.log("📴 Redis connection closed");
};