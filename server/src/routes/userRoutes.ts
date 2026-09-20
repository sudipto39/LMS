// src/routes/userRoutes.ts
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { updateMeSchema } from "../schemas/userSchema.js";
import {
  getMe,
  updateMe,
  changePassword,
  getSSHKeys,
  addSSHKey,
  deleteSSHKey,
  regenerateGiteaToken,
  getStudentStats,
  getAllUsers,
  getUserById,
  getAllSupervisors,
} from "../controllers/userController.js";

const router = Router();

router.get("/me", protect, getMe);
router.patch("/updateMe", protect, validate(updateMeSchema), updateMe);
router.patch("/change-password", protect, changePassword);
router.get("/me/stats", protect, getStudentStats);

// SSH Keys & Gitea Git Credentials
router.get("/me/ssh-keys", protect, getSSHKeys);
router.post("/me/ssh-keys", protect, addSSHKey);
router.delete("/me/ssh-keys/:keyId", protect, deleteSSHKey);
router.post("/me/gitea-token/regenerate", protect, regenerateGiteaToken);

router.get("/supervisors", protect, getAllSupervisors);
router.get("/getAllUsers", protect, restrictTo("ADMIN"), getAllUsers);
router.get("/:id", protect, restrictTo("ADMIN"), getUserById);

export default router;