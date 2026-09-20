// src/routes/activityRoutes.ts
import { Router } from "express";
import {
  getMyActivity,
  getProjectActivity,
  getSupervisorActivity,
  getAdminActivity,
  getCommitHeatmap,
} from "../controllers/activityController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/me", protect, getMyActivity);
router.get("/heatmap", protect, getCommitHeatmap);
router.get("/project/:projectId", protect, getProjectActivity);
router.get("/supervisor", protect, restrictTo("SUPERVISOR"), getSupervisorActivity);
router.get("/admin", protect, restrictTo("ADMIN"), getAdminActivity);

export default router;