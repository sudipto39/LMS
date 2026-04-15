import { Router } from "express";
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

const router = Router();

router.post("/register", validate(signUpSchema), register);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/login", validate(signInSchema), login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.patch("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", protect, logout);

export default router;