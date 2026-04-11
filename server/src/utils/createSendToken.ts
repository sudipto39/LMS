// src/utils/createSendToken.ts
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

export const storeRefreshToken = (userId: string, token: string) =>
  redis.setex(`refresh:${userId}`, REFRESH_TTL_SECONDS, token);

export const getStoredRefreshToken = (userId: string) =>
  redis.get(`refresh:${userId}`);

export const revokeRefreshToken = (userId: string) =>
  redis.del(`refresh:${userId}`);

// ─── Main helper ──────────────────────────────────────────────────────────────

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  giteaUsername: string | null;
  createdAt: Date;
}

export const createSendToken = async (
  user: SafeUser,
  statusCode: number,
  res: Response
): Promise<void> => {
  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  // Store refresh token in Redis
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