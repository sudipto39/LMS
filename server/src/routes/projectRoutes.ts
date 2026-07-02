// src/routes/projectRoutes.ts
import { Router } from "express";
import {
  createProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  getSupervisedProjects,
  updateProject,
  getProjectFiles,
  getProjectFeedback,
  postProjectFeedback,
} from "../controllers/projectController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/create", protect, restrictTo("STUDENT"), createProject);
router.get("/me", protect, restrictTo("STUDENT"), getMyProjects);
router.get(
  "/supervised",
  protect,
  restrictTo("SUPERVISOR", "ADMIN"),
  getSupervisedProjects
);

// ── specific /:id sub-routes BEFORE /:id ──────────────────────────────────────
router.get("/:id/files", protect, getProjectFiles);
// Feedback thread — GET to read, POST to reply (student + supervisor)
router.get("/:id/feedback", protect, getProjectFeedback);
router.post("/:id/feedback", protect, postProjectFeedback);

// /:id must be AFTER named routes
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, restrictTo("STUDENT"), updateProject);
router.delete("/:id", protect, restrictTo("STUDENT", "ADMIN"), deleteProject);
router.get("/supervised", protect, restrictTo("SUPERVISOR"), getSupervisedProjects);

export default router;