import express from "express";
import {
  createProject,
  getMyProjects,
  getSupervisedProjects,
  updateProject,
} from "../controllers/projectController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, restrictTo("student"), createProject);
router.get("/me", protect, restrictTo("student"), getMyProjects);
router.patch("/:id", protect, restrictTo("student"), updateProject);

router.get(
  "/supervised",
  protect,
  restrictTo("projectSupervisor", "admin"),
  getSupervisedProjects,
);

export default router;
