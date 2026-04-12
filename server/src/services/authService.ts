// src/services/authService.ts
import bcrypt from "bcrypt";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.js";
import { emailService } from "./sendVerificationEmail.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
} from "../utils/appError.js";
import type { SignUpInput } from "../schemas/signUpSchema.js";
import type { SignInInput } from "../schemas/signInSchema.js";

const SALT_ROUNDS = 12;
const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

// ─── OTP helpers (stored in Redis, not DB) ────────────────────────────────────

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const storeOTP = (email: string, code: string) =>
  redis.setex(`otp:${email}`, OTP_TTL_SECONDS, code);

const getOTP = (email: string) => redis.get(`otp:${email}`);

const deleteOTP = (email: string) => redis.del(`otp:${email}`);

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  async registerUser(data: SignUpInput) {
    // 1. Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) throw new ConflictError("Email already registered");

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
      },
    });

    // 4. Generate OTP and store in Redis
    const otp = generateOTP();
    await storeOTP(user.email, otp);

    // 5. Send verification email
    await emailService.sendVerificationEmail({
      to: user.email,
      name: user.name,
      code: otp,
    });

    return { userId: user.id, message: "Verification email sent" };
  },

  async verifyEmail(email: string, code: string) {
    // 1. Get OTP from Redis
    const storedOTP = await getOTP(email);
    if (!storedOTP) {
      throw new BadRequestError("Verification code expired. Please request a new one");
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
        email: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
      },
    });

    // 3. Delete OTP from Redis
    await deleteOTP(email);

    return user;
  },

  async loginUser(data: SignInInput) {
    // 1. Find user with password
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isEmailVerified: true,
        giteaUsername: true,
        createdAt: true,
      },
    });

    if (!user) throw new UnauthorizedError("Invalid email or password");

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError("Invalid email or password");

    // 3. Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Don't reveal if email exists or not — always return same message
    if (!user) return { message: "If that email exists, a reset code has been sent" };

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
    if (!storedOTP) throw new BadRequestError("Reset code expired. Please request a new one");
    if (storedOTP !== code) throw new BadRequestError("Invalid reset code");

    // 2. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 3. Update password
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // 4. Clean up OTP
    await deleteOTP(`reset:${email}`);

    return { message: "Password reset successfully" };
  },
};