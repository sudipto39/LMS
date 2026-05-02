// src/routes/adminRoutes.ts
import { Router } from "express";
import {
  assignSupervisorToProject,
  getAllProjectsForAdmin,
  getAdminStats,
  getAuditLogs,
  getGiteaConfig,
  saveGiteaConfig,
  testGiteaConnection
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, restrictTo("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/projects", getAllProjectsForAdmin);
router.patch("/projects/:id/assign-supervisor", assignSupervisorToProject);
router.get("/audit-logs", getAuditLogs);

router.get("/gitea/config", getGiteaConfig);
router.post("/gitea/config", saveGiteaConfig);
router.post("/gitea/test", testGiteaConnection);

export default router;