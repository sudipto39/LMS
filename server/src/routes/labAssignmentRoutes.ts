// src/routes/labAssignmentRoutes.ts
import { Router } from "express";
import { protect, restrictTo, requireVerifiedEmail } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createLabAssignment,
  getLabAssignments,
  getLabAssignmentById,
  runPublicTests,
  submitLabAssignment,
  submitLabReport,
  requestLabReupload,
  reviewLabReuploadPermission,
  getAssignmentSubmissionsRoster,
  gradeSubmission,
  deleteLabAssignment,
  updateLabAssignment,
  renameSubjectFolder,
  toggleSubjectFolderStatus,
  deleteSubjectFolder,
} from "../controllers/labAssignmentController.js";
import { upload } from "../middlewares/fileUploadMiddleware.js";
import {
  createLabAssignmentSchema,
  updateLabAssignmentSchema,
  runLabTestSchema,
  submitLabCodeSchema,
  gradeSubmissionSchema,
  renameFolderSchema,
  toggleFolderStatusSchema,
  deleteFolderSchema,
} from "../schemas/labAssignmentSchema.js";

const router = Router();

// All lab assignment routes require verified authentication
router.use(protect, requireVerifiedEmail);

// ── General Queries & Interactive Testing ─────────────────────────────────────
router.get("/", getLabAssignments);
router.get("/:id", getLabAssignmentById);
router.post("/:id/run", validate(runLabTestSchema), runPublicTests);
router.post("/:id/submit", validate(submitLabCodeSchema), submitLabAssignment);
router.post("/:id/submit-report", upload.single("file"), submitLabReport);
router.post("/:id/request-reupload", restrictTo("STUDENT"), requestLabReupload);
router.patch(
  "/submissions/:submissionId/reupload-permission",
  restrictTo("SUPERVISOR", "ADMIN"),
  reviewLabReuploadPermission
);

// ── Folder CRUD & Batch Status Operations ────────────────────────────────────
router.patch(
  "/folders/rename",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(renameFolderSchema),
  renameSubjectFolder
);

router.patch(
  "/folders/status",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(toggleFolderStatusSchema),
  toggleSubjectFolderStatus
);

router.post(
  "/folders/delete",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(deleteFolderSchema),
  deleteSubjectFolder
);

// ── Supervisor & Admin Actions on Individual Labs ─────────────────────────────
router.post(
  "/",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(createLabAssignmentSchema),
  createLabAssignment
);

router.patch(
  "/:id",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(updateLabAssignmentSchema),
  updateLabAssignment
);

router.delete(
  "/:id",
  restrictTo("SUPERVISOR", "ADMIN"),
  deleteLabAssignment
);

router.get(
  "/:id/submissions",
  restrictTo("SUPERVISOR", "ADMIN"),
  getAssignmentSubmissionsRoster
);

router.patch(
  "/submissions/:submissionId/grade",
  restrictTo("SUPERVISOR", "ADMIN"),
  validate(gradeSubmissionSchema),
  gradeSubmission
);

export default router;
