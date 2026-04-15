import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { Role } from "../generated/prisma/index.js";
import { redis } from "../config/redis.js";
import { env } from "../config/env.js";

// ─── Token signing ────────────────────────────────────────────────────────────

export const signAccessToken = (id: string, role: Role): string =>
  jwt.sign({ id, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);

export const signRefreshToken = (id: string): string =>
  jwt.sign({ id }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);

// ─── Token verification ───────────────────────────────────────────────────────

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string; role: Role };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };

// ─── Redis refresh token store ────────────────────────────────────────────────

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const storeRefreshToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    await redis.setex(`refresh:${userId}`, REFRESH_TTL_SECONDS, token);
  } catch {
    console.warn("⚠️ Could not store refresh token — Redis unavailable");
  }
};

export const getStoredRefreshToken = async (
  userId: string
): Promise<string | null> => {
  try {
    return await redis.get(`refresh:${userId}`);
  } catch {
    return null;
  }
};

export const revokeRefreshToken = async (userId: string): Promise<void> => {
  try {
    await redis.del(`refresh:${userId}`);
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

  // Store refresh token — non-fatal if Redis is down
  await storeRefreshToken(user.id, refreshToken);

  // Refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TTL_SECONDS * 1000,
  });

  res.status(statusCode).json({
    status: "success",
    accessToken,
    data: { user },
  });
};