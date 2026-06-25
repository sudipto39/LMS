// src/routes/giteaRoutes.ts
import { Router } from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import {
  createRepository,
  getRepository,
  listCommits,
  listBranches,
  getRepoCommits,
} from "../controllers/giteaController.js";

const router = Router();

router.use(protect);

router.post("/repos", restrictTo("STUDENT"), createRepository);
router.get("/repos/:owner/:repo", getRepository);
router.get("/repos/:owner/:repo/commits", listCommits);
router.get("/repos/:owner/:repo/branches", listBranches);
router.get("/repos/:owner/:repo/commits", protect, getRepoCommits);

export default router;