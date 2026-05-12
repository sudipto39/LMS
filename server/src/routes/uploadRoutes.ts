// src/routes/uploadRoutes.ts
import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadToS3 } from "../middlewares/uploadMiddleware.js";
import {
  uploadFile,
  uploadMultipleFiles,
  getPresignedUrl,
  deleteFile,
} from "../controllers/uploadController.js";

const router = Router();

router.use(protect);

// Single file upload
router.post("/single", uploadToS3.single("file"), uploadFile);

// Multiple files upload
router.post("/multiple", uploadToS3.array("files", 10), uploadMultipleFiles);

// Get presigned URL for private file
router.get("/presigned/:key(*)", getPresignedUrl);

// Delete file
router.delete("/:key(*)", deleteFile);

export default router;