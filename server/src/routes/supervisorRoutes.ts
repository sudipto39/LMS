// src/routes/supervisorRoutes.ts
import { Router } from "express";
import {
  getAllSupervisors,
  getSupervisorDashboard,
  getAssignedProjects,
  getPendingMilestones,
  reviewMilestone,
  getSupervisorActivityFeed,
  getSuperviorGrades,
} from "../controllers/supervisorController.js";
import { gradeProject } from "../controllers/projectController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

// Public to authenticated users — list all supervisors
router.get("/allsupervisors", protect, getAllSupervisors);

// Supervisor-only routes
router.use(protect, restrictTo("SUPERVISOR", "ADMIN"));

router.get("/dashboard", getSupervisorDashboard);
router.get("/projects", getAssignedProjects);
router.get("/milestones/pending", getPendingMilestones);
router.patch("/milestones/:id/review", reviewMilestone);
router.get("/activity", getSupervisorActivityFeed);
router.get("/grades", getSuperviorGrades);
router.patch("/projects/:id/grade", gradeProject);

export default router;