// src/routes/problemStatementRoutes.ts
import { Router } from "express";
import {
  createProblemStatement,
  getApprovedCatalog,
  getMyProposals,
  getPendingProposals,
  reviewProblemStatement,
  getProblemStatementById,
} from "../controllers/problemStatementController.js";
import { protect, restrictTo } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createProblemStatementSchema,
  reviewProblemStatementSchema,
} from "../schemas/problemStatementSchema.js";

const router = Router();

router.use(protect);

// ── Catalog & Inspection ──────────────────────────────────────────────────────
router.get("/catalog", getApprovedCatalog);
router.get("/mine", restrictTo("SUPERVISOR"), getMyProposals);
router.get("/admin/pending", restrictTo("ADMIN"), getPendingProposals);
router.get("/:id", getProblemStatementById);

// ── Supervisor Proposal Creation ──────────────────────────────────────────────
router.post(
  "/",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(createProblemStatementSchema),
  createProblemStatement
);

// ── Admin Review & Vetting ───────────────────────────────────────────────────
router.patch(
  "/:id/review",
  restrictTo("ADMIN"),
  validate(reviewProblemStatementSchema),
  reviewProblemStatement
);

export default router;
