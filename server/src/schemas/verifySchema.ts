// src/schemas/verifySchema.ts
import { z } from "zod";

// For OTP-based email verification (6-digit code)
export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    code: z
      .string()
      .length(6, "Verification code must be exactly 6 characters")
      .regex(/^\d{6}$/, "Verification code must be 6 digits"),
  }),
});

// For password reset request
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
  }),
});

// For password reset with OTP code
export const resetPasswordSchema = z.object({
  body: z
    .object({
      email: z.string().email("Invalid email address").toLowerCase().optional(),
      code: z
        .string()
        .length(6, "Reset code must be exactly 6 characters")
        .regex(/^\d{6}$/, "Reset code must be 6 digits")
        .optional(),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must contain at least one special character"
        ),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => !data.confirmPassword || data.password === data.confirmPassword,
      {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      }
    ),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];