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
  updateMilestone,
  deleteMilestone,
} from "../controllers/milestoneController.js";
import { protect, restrictTo, requireVerifiedEmail } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/fileUploadMiddleware.js";

const router = Router();

router.use(protect, requireVerifiedEmail);

router.post(
  "/projects/:projectId/milestones",
  restrictTo("STUDENT"),
  createMilestone
);

router.get(
  "/projects/:projectId/milestones",
  protect,
  getProjectMilestones
);

router.patch(
  "/milestones/:id",
  protect,
  restrictTo("STUDENT", "SUPERVISOR", "ADMIN"),
  updateMilestone
);

router.delete(
  "/milestones/:id",
  protect,
  restrictTo("STUDENT", "ADMIN"),
  deleteMilestone
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