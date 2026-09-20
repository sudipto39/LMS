// src/config/db.ts
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX) || 30,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected successfully via Prisma");
  } catch (error) {
    console.error(
      "💥 Database connection failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  await prisma.$disconnect();
  await pool.end();
  console.log("📴 PostgreSQL connection closed");
};