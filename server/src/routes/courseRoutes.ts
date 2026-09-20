// src/routes/courseRoutes.ts
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = Router();

// Authenticated users — list all courses
router.get("/allcourses", protect, getAllCourses);
router.get("/:id", protect, getCourseById);

// Admin only
router.post("/create", protect, restrictTo("ADMIN"), createCourse);
router.patch("/:id", protect, restrictTo("ADMIN"), updateCourse);
router.delete("/:id", protect, restrictTo("ADMIN"), deleteCourse);

export default router;