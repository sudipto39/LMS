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

router.get("/allcourses", protect, getAllCourses);
router.get("/:id", protect, getCourseById);

router.post("/create", protect, restrictTo("admin"), createCourse);
router.patch("/:id", protect, restrictTo("admin"), updateCourse);
router.delete("/:id", protect, restrictTo("admin"), deleteCourse);

export default router;