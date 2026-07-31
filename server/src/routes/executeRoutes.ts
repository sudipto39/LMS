// src/routes/executeRoutes.ts
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { executeCode, getLanguages } from "../controllers/executeController.js";
import { executeCodeSchema } from "../schemas/executeSchema.js";

const router = Router();

// Allow authenticated users to execute code
router.use(protect);

router.post("/", validate(executeCodeSchema), executeCode);
router.get("/languages", getLanguages);

export default router;
