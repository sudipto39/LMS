// src/routes/adminRoutes.ts
import { Router } from "express";
import {
  assignSupervisorToProject,
  getAllProjectsForAdmin,
  getAdminStats,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, restrictTo("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/projects", getAllProjectsForAdmin);
router.patch("/projects/:id/assign-supervisor", assignSupervisorToProject);

export default router;