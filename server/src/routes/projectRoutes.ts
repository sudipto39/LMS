import express from "express";
import {
  createProject,
  getMyProjects,
  getProjectById,
  getSupervisedProjects,
  updateProject,
} from "../controllers/projectController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", protect, restrictTo("student"), createProject);
router.get("/me", protect, restrictTo("student"), getMyProjects);

router.get(
  "/supervised",
  protect,
  restrictTo("supervisor", "admin"),
  getSupervisedProjects,
);

// Single project by ID — must be AFTER /me and /supervised so those don't match as :id
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, restrictTo("student"), updateProject);

export default router;
