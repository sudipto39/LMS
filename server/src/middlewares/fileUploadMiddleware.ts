// src/middlewares/fileUploadMiddleware.ts
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import type { Request } from "express";
import { AppError } from "../utils/appError.js";
import { s3Client, BUCKET_NAME } from "../config/s3.js";
import { env } from "../config/env.js";

export const s3 = s3Client;
export const BUCKET = BUCKET_NAME;

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".zip"]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMime = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "application/zip",
    "application/x-zip-compressed",
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  // Validate both extension and MIME type to prevent polyglots and extension spoofing
  if (!ALLOWED_EXTENSIONS.has(ext) || !allowedMime.includes(file.mimetype)) {
    cb(new AppError("Only PDF, DOC, DOCX, JPG, PNG, ZIP allowed.", 400));
    return;
  }

  cb(null, true);
};

const useS3 =
  env.STORAGE_TYPE === "s3" &&
  Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_ACCESS_KEY_ID.length > 4) &&
  Boolean(env.AWS_SECRET_ACCESS_KEY && env.AWS_SECRET_ACCESS_KEY.length > 4);

// Local disk storage fallback for self-hosted university server deployment
const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDirectory)) {
  try {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  } catch (err) {
    console.warn("Could not create upload directory:", err);
  }
}

const baseDiskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const unique = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

export const validateMagicBytes = async (filePath: string, ext: string): Promise<boolean> => {
  try {
    const handle = await fs.promises.open(filePath, "r");
    const buffer = Buffer.alloc(8);
    const { bytesRead } = await handle.read(buffer, 0, 8, 0);
    await handle.close();

    if (bytesRead < 4) return false;

    if (ext === ".pdf") {
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }
    if (ext === ".docx") {
      return buffer[0] === 0x50 && buffer[1] === 0x4b;
    }
    if (ext === ".doc") {
      return buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
    }
    if (ext === ".png") {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    if (ext === ".jpg" || ext === ".jpeg") {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (ext === ".zip") {
      return buffer[0] === 0x50 && buffer[1] === 0x4b;
    }
    return false;
  } catch {
    return false;
  }
};

export const isSafeArchiveEntry = (entryPath: string): boolean => {
  return !entryPath.includes("..") && !path.isAbsolute(entryPath);
};

const wrappedDiskStorage: multer.StorageEngine = {
  _handleFile(req, file, cb) {
    baseDiskStorage._handleFile(req, file, async (err, info) => {
      if (err) return cb(err);
      if (info) {
        const savedFilename = (info as any).filename || file.filename;
        if (!savedFilename) return cb(new AppError("File upload error", 400));
        const ext = path.extname(file.originalname).toLowerCase();
        const fullPath = path.join(uploadDirectory, savedFilename);
        const isValid = await validateMagicBytes(fullPath, ext);
        if (!isValid) {
          try {
            await fs.promises.unlink(fullPath);
          } catch {
            // ignore
          }
          return cb(new AppError("Uploaded file signature does not match its extension.", 400));
        }

        (info as any).key = savedFilename;
        (info as any).location = `/api/v1/uploads/files/${savedFilename}`;
      }
      cb(null, info);
    });
  },
  _removeFile(req, file, cb) {
    baseDiskStorage._removeFile(req, file, cb);
  },
};

export const validateBufferMagicBytes = (buffer: Buffer, ext: string): boolean => {
  if (buffer.length < 4) return false;
  if (ext === ".pdf") {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }
  if (ext === ".png") {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === ".zip") {
    return buffer[0] === 0x50 && buffer[1] === 0x4b;
  }
  return false;
};

export const storage = useS3
  ? multerS3({
      s3,
      bucket: BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (_req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `project-files/${unique}${ext}`);
      },
    })
  : wrappedDiskStorage;

export const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 5,
  },
  fileFilter,
});

/**
 * FLAW-04 fix: Validate magic bytes for S3 uploads after multer processes the file.
 * Reads the file from S3, checks the first 8 bytes, and rejects polyglot files.
 */
export const validateS3MagicBytesMiddleware = useS3
  ? async (
      req: import("express").Request,
      _res: import("express").Response,
      next: import("express").NextFunction
    ) => {
      if (!req.file && (!req.files || (Array.isArray(req.files) && req.files.length === 0))) {
        return next();
      }

      const filesToCheck: Express.MulterS3.File[] = req.file
        ? [req.file as Express.MulterS3.File]
        : (req.files as Express.MulterS3.File[]) || [];

      for (const file of filesToCheck) {
        const s3Key = (file as any).key;
        const ext = path.extname(file.originalname).toLowerCase();

        if (!s3Key) continue;

        try {
          // Pull first 8 bytes from S3
          const getParams = {
            Bucket: BUCKET,
            Key: s3Key,
            Range: "bytes=0-7",
          };
          const { GetObjectCommand } = await import("@aws-sdk/client-s3");
          const result = await s3.send(new GetObjectCommand(getParams));
          const bodyStream = result.Body as import("stream").Readable;

          const headerBuf = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            bodyStream.on("data", (chunk: Buffer) => chunks.push(chunk));
            bodyStream.on("end", () => resolve(Buffer.concat(chunks)));
            bodyStream.on("error", reject);
          });

          if (!validateBufferMagicBytes(headerBuf, ext)) {
            // Delete the offending file from S3
            try {
              const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
              await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: s3Key }));
            } catch {
              // ignore cleanup errors
            }
            return next(new AppError("Uploaded file signature does not match its extension.", 400));
          }
        } catch {
          // If we can't read from S3 to verify, reject the upload
          return next(new AppError("File upload verification failed. Please try again.", 400));
        }
      }

      next();
    }
  : (_req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => next();