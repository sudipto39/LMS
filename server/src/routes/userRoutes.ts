import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  getMe,
  updateMe,
  getAllUsers,
  getUserById,
  getAllSupervisors,
} from "../controllers/userController.js";

const router = Router();

router.get("/me", protect, getMe);
router.patch("/updateMe", protect, updateMe);
router.get("/supervisors", protect, getAllSupervisors);
router.get("/getAllUsers", protect, restrictTo("ADMIN"), getAllUsers);
router.get("/:id", protect, restrictTo("ADMIN"), getUserById);

export default router;