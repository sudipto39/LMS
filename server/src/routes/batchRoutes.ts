// src/routes/batchRoutes.ts
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  getCoursesForRegistration,
  getBatchesByCourse,
  createBatch,
  getAllBatches,
  deleteBatch,
  getBatchStudents,
  enrollStudentInBatch,
  removeStudentFromBatch,
} from "../controllers/batchController.js";

const router = Router();

// ─── Public routes (no auth needed — used during registration) ────────────────
router.get("/courses", getCoursesForRegistration);
router.get("/courses/:courseId/batches", getBatchesByCourse);

// ─── Authenticated users (list batches) ───────────────────────────────────────
router.get("/", protect, getAllBatches);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("ADMIN"), createBatch);
router.delete("/:id", protect, restrictTo("ADMIN"), deleteBatch);

// Batch student roster
router.get("/:id/students", protect, restrictTo("ADMIN"), getBatchStudents);
router.post("/:id/students", protect, restrictTo("ADMIN"), enrollStudentInBatch);
router.delete("/:id/students/:userId", protect, restrictTo("ADMIN"), removeStudentFromBatch);

export default router;