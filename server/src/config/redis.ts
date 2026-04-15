import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn("⚠️ Redis unavailable — refresh tokens disabled");
      return null; // stop retrying
    }
    return Math.min(times * 500, 2000);
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