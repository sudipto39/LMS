import express from "express";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";

import {
  createRepository,
  getRepository,
  listCommits,
  listBranches,
} from "../controllers/giteaController.js";

const router = express.Router();

router.use(protect);

router.post("/repos", restrictTo("student"), createRepository);

router.get("/repos/:owner/:repo", getRepository);

router.get("/repos/:owner/:repo/commits", listCommits);

router.get("/repos/:owner/:repo/branches", listBranches);

export default router;