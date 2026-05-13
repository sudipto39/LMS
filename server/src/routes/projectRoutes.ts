// src/routes/projectRoutes.ts
import { Router } from "express";
import {
  createProject,
  getMyProjects,
  getProjectById,
  getSupervisedProjects,
  updateProject,
  getProjectFiles,
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
// /:id must be AFTER named routes
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, restrictTo("STUDENT"), updateProject);
router.get("/supervised", protect, restrictTo("SUPERVISOR"), getSupervisedProjects);
router.get("/:id/files", protect, getProjectFiles);

export default router;