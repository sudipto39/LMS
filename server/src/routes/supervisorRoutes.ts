import express from "express";

import {
  getSupervisorDashboard,
  getAssignedProjects,
  getPendingMilestones,
  reviewMilestone,
  getSupervisorActivity,
} from "../controllers/supervisorController.js";

import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import requireObjectId from "../utils/requireObjectId.js";
import { getAllSupervisors } from "../controllers/userController.js";

const router = express.Router();

router.use("/allsupervisors", protect, getAllSupervisors);

router.use(protect, restrictTo("supervisor"));

router.get("/dashboard", getSupervisorDashboard);

router.get("/projects", getAssignedProjects);

router.get("/milestones/pending", getPendingMilestones);

router.patch(
  "/milestones/:id/review",
  requireObjectId("id"),
  reviewMilestone
);

router.get("/activity", getSupervisorActivity);

export default router;