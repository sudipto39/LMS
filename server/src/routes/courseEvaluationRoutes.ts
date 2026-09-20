// src/routes/courseEvaluationRoutes.ts
import { Router } from "express";
import {
  getCourseEvaluations,
  upsertStudentEvaluation,
  bulkUpsertCourseEvaluations,
} from "../controllers/courseEvaluationController.js";
import { protect, restrictTo, requireVerifiedEmail } from "../middlewares/authMiddleware.js";

const router = Router();

// Evaluation operations restricted to Supervisors and Admins
router.use(protect, requireVerifiedEmail, restrictTo("SUPERVISOR", "ADMIN"));

router.get("/course/:courseCode", getCourseEvaluations);
router.put("/course/:courseCode/student/:studentId", upsertStudentEvaluation);
router.post("/course/:courseCode/bulk", bulkUpsertCourseEvaluations);

export default router;
