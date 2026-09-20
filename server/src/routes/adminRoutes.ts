// src/routes/adminRoutes.ts
import { Router } from "express";
import {
  assignSupervisorToProject,
  getSupervisorRequests,
  reviewSupervisorRequest,
  getAllProjectsForAdmin,
  getProjectsForExport,
  getAdminStats,
  getAuditLogs,
  getGiteaConfig,
  saveGiteaConfig,
  testGiteaConnection,
  deleteUser,
  createUser,
  updateUser,
  importUsers,
} from "../controllers/adminController.js";
import { getAllUsers } from "../controllers/userController.js";

import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(protect, restrictTo("ADMIN"));

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.get("/projects", getAllProjectsForAdmin);
router.get("/projects/export", getProjectsForExport);
router.patch("/projects/:id/assign-supervisor", assignSupervisorToProject);
router.get("/supervisor-requests", getSupervisorRequests);
router.patch("/projects/:id/supervisor-request", reviewSupervisorRequest);

router.get("/audit-logs", getAuditLogs);

router.delete("/users/:id", deleteUser);
router.patch("/users/:id", updateUser);
router.post("/users/import-csv", importUsers);

router.get("/gitea/config", getGiteaConfig);
router.post("/gitea/config", saveGiteaConfig);
router.post("/gitea/test", testGiteaConnection);

export default router;