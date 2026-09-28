import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { Role } from "../generated/prisma/index.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";

// ─── Token signing ────────────────────────────────────────────────────────────

export const signAccessToken = (id: string, role: Role): string =>
  jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);

export const signRefreshToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

import crypto from "crypto";

// ─── Token verification ───────────────────────────────────────────────────────

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; role: Role; iat?: number };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string; iat?: number };

// ─── Cryptographic token hashing & timing-safe compare ────────────────────────

export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

export const safeTokenCompare = (a: string, b: string): boolean => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export const matchesRefreshToken = (stored: string, candidate: string): boolean => {
  const hashedCandidate = hashToken(candidate);
  if (safeTokenCompare(stored, hashedCandidate)) return true;
  if (safeTokenCompare(stored, candidate)) return true; // Legacy plaintext fallback
  return false;
};

// ─── Refresh token store (Redis + DB fallback) ────────────────────────────────

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/** Store refresh token — hashes before persisting in Redis and DB */
export const storeRefreshToken = async (
  userId: string,
  token: string
): Promise<void> => {
  const hashed = hashToken(token);
  // Always persist in DB so sessions survive Redis restarts
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  } catch (err) {
    console.warn("⚠️ Could not persist refresh token to DB:", err);
  }

  // Also try Redis for speed
  if (redis.status === "ready") {
    try {
      await redis.setex(`refresh:${userId}`, REFRESH_TTL_SECONDS, hashed);
    } catch {
      // Redis unavailable — DB fallback already done above
    }
  }
};

/** Get stored refresh token — checks Redis first, falls back to DB */
export const getStoredRefreshToken = async (
  userId: string
): Promise<string | null> => {
  // Try Redis first (fastest)
  if (redis.status === "ready") {
    try {
      const cached = await redis.get(`refresh:${userId}`);
      if (cached) return cached;
    } catch {
      // Redis down — fall through to DB
    }
  }

  // Fallback: read from DB
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true },
    });
    return user?.refreshToken ?? null;
  } catch {
    return null;
  }
};

// In-memory fallback if Redis is unreachable under load/network blip
const inMemoryRevokedBefore = new Map<string, number>();

export const parseDurationToSeconds = (durationStr: string, defaultSec: number = 900): number => {
  if (!durationStr || typeof durationStr !== "string") return defaultSec;
  const match = durationStr.trim().match(/^(\d+)([smhd]?)$/i);
  if (!match || !match[1]) return defaultSec;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || "s").toLowerCase();
  switch (unit) {
    case "s": return num;
    case "m": return num * 60;
    case "h": return num * 3600;
    case "d": return num * 86400;
    default: return defaultSec;
  }
};

export const getInMemoryRevokedBefore = (userId: string): number | null => {
  const ts = inMemoryRevokedBefore.get(userId);
  if (!ts) return null;
  const accessTtlSec = Math.max(900, parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN, 900));
  if (Math.floor(Date.now() / 1000) - ts > accessTtlSec) {
    inMemoryRevokedBefore.delete(userId);
    return null;
  }
  return ts;
};

export const generateSignedCsrfToken = (secret: string = env.JWT_ACCESS_SECRET): string => {
  const random = crypto.randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const payload = `${random}.${ts}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${sig}`;
};

/** Revoke refresh token — removes from both Redis and DB, records revocation time */
export const revokeRefreshToken = async (userId: string): Promise<void> => {
  const nowSec = Math.floor(Date.now() / 1000);
  inMemoryRevokedBefore.set(userId, nowSec);

  if (redis.status === "ready") {
    try {
      await redis.del(`refresh:${userId}`);
    } catch {
      // ignore
    }
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  } catch {
    // ignore
  }
  try {
    if (redis.status === "ready") {
      const accessTtlSec = Math.max(900, parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN, 900));
      await redis.setex(`revoked_before:${userId}`, accessTtlSec, nowSec.toString());
    }
  } catch {
    // ignore
  }
};

// ─── Safe user type ───────────────────────────────────────────────────────────

interface SafeUser {
  id: string;
  name: string;
  universityId?: string | null;
  email: string;
  phoneNumber?: string | null;
  department?: string | null;
  role: Role;
  isEmailVerified: boolean;
  giteaUsername?: string | null;
  createdAt: Date;
}

// ─── Main helper ──────────────────────────────────────────────────────────────

export const createSendToken = async (
  user: SafeUser,
  statusCode: number,
  res: Response
): Promise<void> => {
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token (Redis + DB)
  await storeRefreshToken(user.id, refreshToken);

  // Refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });

  // Issue double-submit CSRF token (signed & time-stamped)
  const csrfToken = generateSignedCsrfToken();
  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });
  res.setHeader("X-CSRF-Token", csrfToken);

  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: { user },
  });
};
