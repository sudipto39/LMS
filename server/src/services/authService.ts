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

const SALT_ROUNDS = 12;
const OTP_TTL_SECONDS = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

// ─── OTP helpers (CSPRNG) ─────────────────────────────────────────────────────

const generateOTP = (): string =>
  crypto.randomInt(100000, 1000000).toString();

const storeOTP = async (key: string, code: string): Promise<void> => {
  try {
    await redis.setex(key, OTP_TTL_SECONDS, code);
  } catch {
    console.warn("⚠️ Could not store OTP in Redis — Redis unavailable");
  }
};

const getOTP = async (key: string): Promise<string | null> => {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

const deleteOTP = async (key: string): Promise<void> => {
  try {
    await redis.del(key);
  } catch {
    // ignore
  }
};

const checkAndIncrementAttempts = async (
  keyPrefix: string,
  email: string
): Promise<void> => {
  const attemptKey = `attempts:${keyPrefix}:${email}`;
  try {
    const attempts = await redis.incr(attemptKey);
    if (attempts === 1) {
      await redis.expire(attemptKey, OTP_TTL_SECONDS);
    }
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await deleteOTP(`${keyPrefix}:${email}`);
      await redis.del(attemptKey);
      throw new BadRequestError(
        "Maximum attempts exceeded. Please request a new code."
      );
    }
  } catch (err) {
    if (err instanceof BadRequestError) throw err;
    // continue if Redis is offline
  }
};

const clearAttempts = async (
  keyPrefix: string,
  email: string
): Promise<void> => {
  try {
    await redis.del(`attempts:${keyPrefix}:${email}`);
  } catch {
    // ignore
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
    if (storedOTP !== code) {
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
    const user = await prisma.user.findUnique({
      where: { email: data.email },
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

    if (!user) throw new UnauthorizedError("Invalid email or password");

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (env.EMAIL_VERIFICATION && !user.isEmailVerified) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in"
      );
    }

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
    if (storedOTP !== code) {
      await checkAndIncrementAttempts("reset", email);
      throw new BadRequestError("Invalid reset code");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await deleteOTP(`reset:${email}`);
    await clearAttempts("reset", email);

    return { message: "Password reset successfully. Please log in." };
  },
};