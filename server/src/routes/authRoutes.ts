import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { signUpSchema } from "../schemas/signUpSchema.js";
import { signInSchema } from "../schemas/signInSchema.js";
import {
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/verifySchema.js";

// M-01: Strict rate limit for password-reset to prevent email enumeration + spam
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many password reset attempts. Please try again in 15 minutes." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many login attempts. Please try again in 15 minutes." },
});

const router = Router();

router.post("/register", validate(signUpSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/login", loginLimiter, validate(signInSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPasswordLimiter, validate(forgotPasswordSchema), forgotPassword);
router.patch("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", protect, logout);

export default router;