// src/routes/milestoneRoutes.ts
import { Router } from "express";
import {
  createMilestone,
  getProjectMilestones,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
  getMySubmissions,
  startMilestone,
} from "../controllers/milestoneController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/fileUploadMiddleware.js";

const router = Router();

router.post(
  "/projects/:projectId/milestones",
  protect,
  restrictTo("STUDENT"),
  createMilestone
);

router.get(
  "/projects/:projectId/milestones",
  protect,
  getProjectMilestones
);

router.patch(
  "/milestones/:id/submit",
  protect,
  restrictTo("STUDENT"),
  upload.array("files", 5),
  submitMilestone
);

router.patch(
  "/milestones/:id/approve",
  protect,
  restrictTo("SUPERVISOR", "ADMIN"),
  approveMilestone
);

router.patch(
  "/milestones/:id/reject",
  protect,
  restrictTo("SUPERVISOR", "ADMIN"),
  rejectMilestone
);

router.get(
  "/me/submissions",
  protect,
  restrictTo("STUDENT"),
  getMySubmissions
);

router.patch(
  "/milestones/:id/start",
  protect,
  restrictTo("STUDENT"),
  startMilestone
);

export default router;