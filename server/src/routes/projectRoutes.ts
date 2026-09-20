// src/routes/projectRoutes.ts
import { Router } from "express";
import {
  createProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  getSupervisedProjects,
  updateProject,
  getProjectFiles,
  getProjectFeedback,
  postProjectFeedback,
  replyProjectFeedback,
  resolveProjectFeedback,
  getCommitDiff,
  getCodeReviewComments,
  postCodeReviewComment,
  resolveCodeReviewComment,
  submitFinalProject,
  getPotentialMembers,
  addProjectMember,
  removeProjectMember,
  extendProject,
  commitAndPushSandbox,
} from "../controllers/projectController.js";
import { protect, restrictTo, requireVerifiedEmail } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createProjectSchema,
  postFeedbackSchema,
  replyFeedbackSchema,
  postCodeReviewCommentSchema,
} from "../schemas/projectSchema.js";

const router = Router();

router.use(protect, requireVerifiedEmail);

router.post("/create", restrictTo("STUDENT"), validate(createProjectSchema), createProject);
router.get("/me", restrictTo("STUDENT"), getMyProjects);
router.get(
  "/supervised",
  protect,
  restrictTo("SUPERVISOR", "ADMIN"),
  getSupervisedProjects
);

// ── Specific /:id sub-routes BEFORE /:id ──────────────────────────────────────
router.get("/:id/files", protect, getProjectFiles);
router.post("/:id/extend", protect, restrictTo("STUDENT"), extendProject);
router.post("/:id/commit", protect, commitAndPushSandbox);

// In-App Code Review & Diffs
router.get("/:id/diff/:commitSha", protect, getCommitDiff);
router.get("/:id/code-review/comments", protect, getCodeReviewComments);
router.post("/:id/code-review/comments", protect, validate(postCodeReviewCommentSchema), postCodeReviewComment);
router.patch("/:id/code-review/comments/:commentId/resolve", protect, resolveCodeReviewComment);

// Threaded Feedback Discussions
router.get("/:id/feedback", protect, getProjectFeedback);
router.post("/:id/feedback", protect, validate(postFeedbackSchema), postProjectFeedback);
router.post("/:id/feedback/:feedbackId/reply", protect, validate(replyFeedbackSchema), replyProjectFeedback);
router.patch("/:id/feedback/:feedbackId/resolve", protect, resolveProjectFeedback);

// Team Members
router.get("/:id/potential-members", protect, restrictTo("STUDENT"), getPotentialMembers);
router.post("/:id/members", protect, restrictTo("STUDENT"), addProjectMember);
router.delete("/:id/members/:userId", protect, removeProjectMember);

// /:id must be AFTER named routes
router.get("/:id", protect, getProjectById);
router.patch("/:id", protect, restrictTo("STUDENT"), updateProject);
router.post("/:id/submit-final", protect, restrictTo("STUDENT"), submitFinalProject);
router.delete("/:id", protect, restrictTo("STUDENT", "ADMIN"), deleteProject);

export default router;