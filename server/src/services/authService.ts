// src/services/authService.ts
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { emailService } from "./sendVerificationEmail.js";
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

// ─── OTP helpers ──────────────────────────────────────────────────────────────

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

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

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 4. Create user — with optional batch enrollment in one transaction
    const user = await prisma.user.create({
      data: {
        name: data.name,
        universityId: data.universityId,
        email: data.email,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        department: data.department,
        role: data.role,
        // Auto-verify when email verification is disabled
        isEmailVerified: !env.EMAIL_VERIFICATION,
        // Create batch enrollment if batchId provided
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

    // 5. Send OTP only if email verification is enabled
    if (env.EMAIL_VERIFICATION) {
      const otp = generateOTP();
      await storeOTP(`otp:${user.email}`, otp);
      await emailService.sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: otp,
      });
    }

    return { userId: user.id, message: "Registration successful" };
  },

  async verifyEmail(email: string, code: string) {
    // 1. Get OTP from Redis
    const storedOTP = await getOTP(`otp:${email}`);
    if (!storedOTP) {
      throw new BadRequestError(
        "Verification code expired. Please request a new one"
      );
    }
    if (storedOTP !== code) {
      throw new BadRequestError("Invalid verification code");
    }

    // 2. Mark user as verified
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

    // 3. Delete OTP
    await deleteOTP(`otp:${email}`);
    return user;
  },

  async loginUser(data: SignInInput) {
    // 1. Find user with password
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

    // Same error for both cases — prevents user enumeration
    if (!user) throw new UnauthorizedError("Invalid email or password");

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // 3. Check email verification
    if (env.EMAIL_VERIFICATION && !user.isEmailVerified) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in"
      );
    }

    // 4. Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always return same message — prevents email enumeration
    if (!user) {
      return {
        message: "If that email exists, a reset code has been sent",
      };
    }

    const otp = generateOTP();
    await storeOTP(`reset:${email}`, otp);

    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      code: otp,
    });

    return { message: "If that email exists, a reset code has been sent" };
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    // 1. Verify reset OTP
    const storedOTP = await getOTP(`reset:${email}`);
    if (!storedOTP) {
      throw new BadRequestError(
        "Reset code expired. Please request a new one"
      );
    }
    if (storedOTP !== code) {
      throw new BadRequestError("Invalid reset code");
    }

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 3. Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 4. Clean up OTP
    await deleteOTP(`reset:${email}`);

    return { message: "Password reset successfully. Please log in." };
  },
};