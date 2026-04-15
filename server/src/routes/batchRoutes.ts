// src/routes/batchRoutes.ts
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  getCoursesForRegistration,
  getBatchesByCourse,
  createBatch,
  getAllBatches,
  deleteBatch,
} from "../controllers/batchController.js";

const router = Router();

// ─── Public routes (no auth needed — used during registration) ────────────────
router.get("/courses", getCoursesForRegistration);
router.get("/courses/:courseId/batches", getBatchesByCourse);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.get("/", protect, restrictTo("ADMIN"), getAllBatches);
router.post("/", protect, restrictTo("ADMIN"), createBatch);
router.delete("/:id", protect, restrictTo("ADMIN"), deleteBatch);

export default router;