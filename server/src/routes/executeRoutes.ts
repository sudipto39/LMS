// src/routes/executeRoutes.ts
import { Router } from "express";
import { protect, requireVerifiedEmail } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  executeCode,
  getLanguages,
  getCodeTemplate,
} from "../controllers/executeController.js";
import { executeCodeSchema } from "../schemas/executeSchema.js";

const router = Router();

// Allow verified authenticated users to execute code
router.use(protect, requireVerifiedEmail);

router.post("/", validate(executeCodeSchema), executeCode);
router.get("/languages", getLanguages);
router.get("/templates/:language", getCodeTemplate);

export default router;
