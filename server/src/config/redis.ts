import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 800,
  commandTimeout: 800,
  retryStrategy: (times: number) => {
    if (times > 2) {
      return null; // stop retrying quickly
    }
    return 500;
  },
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redis.on("error", () => {
  // silenced after retryStrategy gives up
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
  } catch {
    console.warn("⚠️ Redis not available — continuing without it");
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    console.log("📴 Redis connection closed");
  } catch {
    // already disconnected
  }
};