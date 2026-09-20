// src/services/authService.ts
import crypto from "crypto";
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { emailService } from "./sendVerificationEmail.js";
import { giteaService } from "./giteaService.js";
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/appError.js";
import type { SignUpInput } from "../schemas/signUpSchema.js";
import type { SignInInput } from "../schemas/signInSchema.js";
import { env } from "../config/env.js";
import { revokeRefreshToken } from "../utils/createSendToken.js";

const SALT_ROUNDS = 12;
const OTP_TTL_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

// In-memory fallback if Redis is unreachable under load/network blip
const fallbackAttempts = new Map<string, { count: number; expiresAt: number }>();
const fallbackOtps = new Map<string, { code: string; expiresAt: number }>();
const fallbackLoginAttempts = new Map<string, { count: number; expiresAt: number; lockedUntil?: number }>();

// ─── OTP helpers (CSPRNG) ─────────────────────────────────────────────────────

const generateOTP = (): string =>
  crypto.randomInt(100000, 1000000).toString();

const storeOTP = async (key: string, code: string): Promise<void> => {
  fallbackOtps.set(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000 });
  if (redis.status === "ready") {
    try {
      await redis.setex(key, OTP_TTL_SECONDS, code);
    } catch {
      console.warn("⚠️ Could not store OTP in Redis — fallback in-memory cache active");
    }
  }
};

const getOTP = async (key: string): Promise<string | null> => {
  if (redis.status === "ready") {
    try {
      const code = await redis.get(key);
      if (code) return code;
    } catch {
      // fallback to in-memory
    }
  }
  const item = fallbackOtps.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    fallbackOtps.delete(key);
    return null;
  }
  return item.code;
};

const deleteOTP = async (key: string): Promise<void> => {
  fallbackOtps.delete(key);
  if (redis.status === "ready") {
    try {
      await redis.del(key);
    } catch {
      // ignore
    }
  }
};

const checkAndIncrementAttempts = async (
  keyPrefix: string,
  email: string
): Promise<void> => {
  const attemptKey = `attempts:${keyPrefix}:${email}`;
  let attempts = 0;
  try {
    attempts = await redis.incr(attemptKey);
    if (attempts === 1) {
      await redis.expire(attemptKey, OTP_TTL_SECONDS);
    }
  } catch {
    // Redis unavailable: fallback in-memory rate limiting
    const now = Date.now();
    const current = fallbackAttempts.get(attemptKey);
    if (!current || current.expiresAt < now) {
      fallbackAttempts.set(attemptKey, { count: 1, expiresAt: now + OTP_TTL_SECONDS * 1000 });
      attempts = 1;
    } else {
      current.count += 1;
      attempts = current.count;
    }
  }

  if (attempts >= MAX_OTP_ATTEMPTS) {
    await deleteOTP(`${keyPrefix}:${email}`);
    try {
      await redis.del(attemptKey);
    } catch {
      // ignore
    }
    fallbackAttempts.delete(attemptKey);
    throw new BadRequestError(
      "Maximum attempts exceeded. Please request a new code."
    );
  }
};

const clearAttempts = async (
  keyPrefix: string,
  email: string
): Promise<void> => {
  fallbackAttempts.delete(`attempts:${keyPrefix}:${email}`);
  try {
    await redis.del(`attempts:${keyPrefix}:${email}`);
  } catch {
    // ignore
  }
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

const isAccountLocked = async (email: string): Promise<boolean> => {
  const mem = fallbackLoginAttempts.get(email);
  if (mem?.lockedUntil && mem.lockedUntil > Date.now()) {
    return true;
  }
  if (redis.status !== "ready") return false;
  try {
    const locked = await redis.get(`lockout:${email}`);
    return locked !== null;
  } catch {
    return false;
  }
};

const handleFailedLogin = async (email: string): Promise<void> => {
  const now = Date.now();
  const mem = fallbackLoginAttempts.get(email);
  if (!mem || mem.expiresAt < now) {
    fallbackLoginAttempts.set(email, { count: 1, expiresAt: now + LOCKOUT_DURATION_SECONDS * 1000 });
  } else {
    mem.count += 1;
    if (mem.count >= MAX_LOGIN_ATTEMPTS) {
      mem.lockedUntil = now + LOCKOUT_DURATION_SECONDS * 1000;
    }
  }

  if (redis.status !== "ready") return;
  const attemptsKey = `login_attempts:${email}`;
  try {
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, LOCKOUT_DURATION_SECONDS);
    }
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await redis.setex(`lockout:${email}`, LOCKOUT_DURATION_SECONDS, "locked");
      await redis.del(attemptsKey);
    }
  } catch {
    // continue if Redis is offline
  }
};

const handleSuccessfulLogin = async (email: string): Promise<void> => {
  fallbackLoginAttempts.delete(email);
  if (redis.status !== "ready") return;
  try {
    await redis.del(`login_attempts:${email}`);
    await redis.del(`lockout:${email}`);
  } catch {
    // continue if Redis is offline
  }
};

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  async registerUser(data: SignUpInput) {
    // 1. Check existing by email OR universityId
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { universityId: data.universityId },
        ],
      },
      select: { id: true, email: true, universityId: true },
    });

    if (existing) {
      if (existing.email === data.email) {
        throw new ConflictError("Email already registered");
      }
      throw new ConflictError("University ID already registered");
    }

    // 2. Validate batchId if provided
    if (data.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: data.batchId },
        select: { id: true, isActive: true },
      });
      if (!batch || !batch.isActive) {
        throw new BadRequestError("Invalid or inactive batch selected");
      }
    }

    // 3. Generate Gitea username from email BEFORE hashing password
    const giteaUsername = data.email
      .split("@")[0]!
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 5. Create user in DB — enforce role to STUDENT on self-registration
    const user = await prisma.user.create({
      data: {
        name: data.name,
        universityId: data.universityId,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        department: data.department,
        role: "STUDENT",
        isEmailVerified: !env.EMAIL_VERIFICATION,
        giteaUsername,
        ...(data.batchId && {
          enrollments: {
            create: { batchId: data.batchId },
          },
        }),
      },
      select: {
        id: true,
        name: true,
        universityId: true,
        email: true,
        phoneNumber: true,
        department: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
        enrollments: {
          select: {
            batch: {
              select: {
                id: true,
                name: true,
                startYear: true,
                endYear: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 6. Auto-create Gitea account (non-fatal)
    try {
      // Use a separate random password for Gitea — never forward the user's LMS password
      const giteaPassword = crypto.randomBytes(16).toString("hex");
      await giteaService.createGiteaUser(
        giteaUsername,
        data.email,
        giteaPassword
      );
      console.log(`✅ Gitea user created: ${giteaUsername}`);
    } catch {
      console.warn(
        `⚠️ Gitea user creation failed for ${giteaUsername} — Gitea may be offline`
      );
    }

    // 7. Send OTP only if email verification is enabled
    if (env.EMAIL_VERIFICATION) {
      const otp = generateOTP();
      await storeOTP(`otp:${user.email}`, otp);
      await clearAttempts("otp", user.email);
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: otp,
      });
    }

    return { userId: user.id, message: "Registration successful" };
  },

  async verifyEmail(email: string, code: string) {
    const storedOTP = await getOTP(`otp:${email}`);
    if (!storedOTP) {
      throw new BadRequestError(
        "Verification code expired or invalid. Please request a new one"
      );
    }
    const isMatch =
      typeof code === "string" &&
      storedOTP.length === code.length &&
      crypto.timingSafeEqual(Buffer.from(storedOTP), Buffer.from(code));

    if (!isMatch) {
      await checkAndIncrementAttempts("otp", email);
      throw new BadRequestError("Invalid verification code");
    }

    const user = await prisma.user.update({
      where: { email },
      data: { isEmailVerified: true },
      select: {
        id: true,
        name: true,
        universityId: true,
        email: true,
        phoneNumber: true,
        department: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
      },
    });

    await deleteOTP(`otp:${email}`);
    await clearAttempts("otp", email);
    return user;
  },

  async loginUser(data: SignInInput) {
    const cleanEmail = data.email.trim().toLowerCase();

    if (await isAccountLocked(cleanEmail)) {
      throw new UnauthorizedError(
        "Account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        name: true,
        universityId: true,
        email: true,
        password: true,
        phoneNumber: true,
        department: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
      },
    });

    if (!user) {
      await handleFailedLogin(cleanEmail);
      throw new UnauthorizedError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      await handleFailedLogin(cleanEmail);
      throw new UnauthorizedError("Invalid email or password");
    }

    if (env.EMAIL_VERIFICATION && !user.isEmailVerified) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in"
      );
    }

    await handleSuccessfulLogin(cleanEmail);

    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      // Artificial delay to equalize response time and prevent email enumeration
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));
      return { message: "If that email exists, a reset code has been sent" };
    }

    const otp = generateOTP();
    await storeOTP(`reset:${email}`, otp);
    await clearAttempts("reset", email);

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code: otp,
    });

    return { message: "If that email exists, a reset code has been sent" };
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    if (!email || !code || !newPassword) {
      throw new BadRequestError("Email, code, and new password are required");
    }
    const storedOTP = await getOTP(`reset:${email}`);
    if (!storedOTP) {
      throw new BadRequestError(
        "Reset code expired or invalid. Please request a new one"
      );
    }
    const isMatch =
      typeof code === "string" &&
      storedOTP.length === code.length &&
      crypto.timingSafeEqual(Buffer.from(storedOTP), Buffer.from(code));

    if (!isMatch) {
      await checkAndIncrementAttempts("reset", email);
      throw new BadRequestError("Invalid reset code");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
      select: { id: true, giteaUsername: true },
    });

    if (user?.id) {
      await revokeRefreshToken(user.id);
    }

    if (user?.giteaUsername) {
      await giteaService.updateUserPassword(user.giteaUsername, newPassword);
    }

    await deleteOTP(`reset:${email}`);
    await clearAttempts("reset", email);

    return { message: "Password reset successfully. Please log in." };
  },
};