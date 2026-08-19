// src/controllers/uploadController.ts
// ⚠️  DEPRECATED — these handlers have been replaced by the secure implementations
// in src/routes/uploadRoutes.ts which include proper project-ownership authorization.
// Do NOT re-export or re-wire these. They are intentionally disabled.

import type { Request, Response } from "express";

const disabled = (_req: Request, res: Response): void => {
  res.status(410).json({
    status: "fail",
    message: "This endpoint has been disabled. Use /api/v1/uploads/presigned/:key instead.",
  });
};

/** @deprecated Use the authorized handler in uploadRoutes.ts */
export const uploadFile = disabled;
/** @deprecated Use the authorized handler in uploadRoutes.ts */
export const uploadMultipleFiles = disabled;
/** @deprecated No authorization — do not use. S3 deletion is admin-only via AWS Console. */
export const deleteFile = disabled;
/** @deprecated No authorization — do not use. Use GET /api/v1/uploads/presigned/:key. */
export const getPresignedUrl = disabled;