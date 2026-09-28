import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import crypto from "crypto";
import { s3Client, BUCKET_NAME } from "../config/s3.js";
import { AppError } from "../utils/appError.js";

// Restricted to the same safe types as fileUploadMiddleware.ts
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/zip",
  "application/x-zip-compressed",
];

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".zip"]);

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMETYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type: ${file.mimetype}. Only PDF, JPG, PNG, ZIP are allowed.`, 400));
  }
};

export const uploadToS3 = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: BUCKET_NAME,
    metadata: (_req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (_req, file, cb) => {
      // FLAW-15: Use UUID only — never embed original filename in S3 key
      const unique = crypto.randomUUID();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `uploads/${unique}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB — aligned with fileUploadMiddleware.ts
  },
  fileFilter,
});
