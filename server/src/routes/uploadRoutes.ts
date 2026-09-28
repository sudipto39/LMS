import { Router } from "express";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET, upload } from "../middlewares/fileUploadMiddleware.js";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";

import { Prisma } from "../generated/prisma/index.js";

const router = Router();

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR || "uploads");

// Serve locally uploaded files directly (requires authentication)
router.get(
  "/files/:filename",
  protect,
  catchAsync(async (req, res) => {
    const rawFilename = req.params["filename"];
    const filename = Array.isArray(rawFilename) ? rawFilename[0] : rawFilename;
    if (!filename) throw new BadRequestError("Filename required");

    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDirectory, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundError("File not found on server");
    }

    const user = req.user!;
    if (user.role !== "ADMIN") {
      const fileUrlPart = safeFilename;

      const labManual = await prisma.labAssignment.findFirst({
        where: {
          manualUrl: { contains: fileUrlPart },
          OR: [
            { creatorId: user.id },
            { batch: { enrollments: { some: { userId: user.id } } } },
            { status: "PUBLISHED" },
          ],
        },
        select: { id: true, manualName: true },
      });

      const labSubmission = !labManual
        ? await prisma.labSubmission.findFirst({
            where: {
              fileUrl: { contains: fileUrlPart },
              ...(user.role === "SUPERVISOR"
                ? {}
                : {
                    OR: [
                      { studentId: user.id },
                      { assignment: { creatorId: user.id } },
                    ],
                  }),
            },
            select: { id: true },
          })
        : null;

      const accessibleMilestones = !labManual && !labSubmission
        ? await prisma.milestone.findMany({
            where: {
              attachments: { not: Prisma.JsonNull },
              project: {
                OR: [
                  { ownerId: user.id },
                  { supervisorId: user.id },
                  { members: { some: { userId: user.id } } },
                ],
              },
            },
            select: { attachments: true },
          })
        : [];

      const hasMilestoneAccess = accessibleMilestones.some((m) => {
        const atts = m.attachments as Array<{ key?: string; url?: string }> | null;
        return Array.isArray(atts) && atts.some((a) => a.key?.includes(safeFilename) || a.url?.includes(safeFilename));
      });

      if (!labManual && !labSubmission && !hasMilestoneAccess) {
        throw new NotFoundError("File not found or access denied");
      }
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".zip": "application/zip",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const isInlineType = [".png", ".jpg", ".jpeg", ".pdf"].includes(ext);
    const forceDownload = req.query["download"] === "true";
    const disposition = forceDownload ? "attachment" : isInlineType ? "inline" : "attachment";

    // Determine the proper download filename with guaranteed extension
    // Sanitize: strip header-injection chars (CR, LF, quotes, semicolons)
    let requestedName = safeFilename;
    if (typeof req.query["filename"] === "string" && req.query["filename"].trim()) {
      const rawName = path.basename(req.query["filename"].trim());
      // Allow only safe filename characters; reject anything with CR/LF or header control chars
      const sanitizedName = rawName.replace(/[^\w.\-]/g, "_").replace(/\.{2,}/g, ".");
      if (sanitizedName && sanitizedName !== "." && sanitizedName !== "_") {
        requestedName = sanitizedName;
      }
    }
    const finalFilename = requestedName.toLowerCase().endsWith(ext) ? requestedName : `${requestedName}${ext}`;

    res.setHeader("X-Content-Type-Options", "nosniff");
    if (ext === ".pdf") {
      res.setHeader("Content-Security-Policy", "default-src 'self' 'unsafe-inline' blob: data:; object-src 'self' blob:; frame-ancestors 'self'");
    } else if (!isInlineType) {
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    }
    res.setHeader("Content-Type", mimeMap[ext] || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${finalFilename}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`
    );
    res.sendFile(filePath);
  })
);

// General single file upload endpoint (e.g. for faculty lab manuals, document attachments)
router.post(
  "/file",
  protect,
  upload.single("file"),
  catchAsync(async (req, res) => {
    const file = req.file as any;
    if (!file) {
      throw new BadRequestError("No file uploaded");
    }

    res.status(201).json({
      status: "success",
      data: {
        url: file.location || `/api/v1/uploads/files/${file.filename}`,
        key: file.key || file.filename,
        name: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  })
);

// Generate presigned download URL for authorized S3 keys (or local link)
router.get(
  "/presigned/*key",
  protect,
  catchAsync(async (req, res) => {
    const key = (req.params as Record<string, string>)["key"];

    if (!key) {
      throw new BadRequestError("File Key is required");
    }

    const user = req.user!;

    // Admins have universal download access
    if (user.role !== "ADMIN") {
      const safeKey = path.basename(key);

      const labManual = await prisma.labAssignment.findFirst({
        where: {
          manualUrl: { contains: safeKey },
          OR: [
            { creatorId: user.id },
            { batch: { enrollments: { some: { userId: user.id } } } },
          ],
        },
        select: { id: true },
      });

      const labSubmission = !labManual
        ? await prisma.labSubmission.findFirst({
            where: {
              fileUrl: { contains: safeKey },
              OR: [
                { studentId: user.id },
                { assignment: { creatorId: user.id } },
              ],
            },
            select: { id: true },
          })
        : null;

      // Find milestones only within projects accessible to the requesting user
      const accessibleMilestones = !labManual && !labSubmission
        ? await prisma.milestone.findMany({
            where: {
              attachments: { not: Prisma.JsonNull },
              project: {
                OR: [
                  { ownerId: user.id },
                  { supervisorId: user.id },
                  { members: { some: { userId: user.id } } },
                ],
              },
            },
            select: { attachments: true },
          })
        : [];

      const hasMilestoneAccess = accessibleMilestones.some((m) => {
        const atts = m.attachments as Array<{ key?: string; url?: string }> | null;
        return Array.isArray(atts) && atts.some((a) => a.key === key || a.key?.includes(safeKey) || a.url?.includes(safeKey));
      });

      if (!labManual && !labSubmission && !hasMilestoneAccess) {
        throw new NotFoundError("File not found or access denied");
      }
    }

    // If local storage mode, return local file URL directly
    const localPath = path.join(uploadDirectory, path.basename(key));
    if (env.STORAGE_TYPE === "local" || fs.existsSync(localPath)) {
      res.status(200).json({
        status: "success",
        data: { url: `/api/v1/uploads/files/${path.basename(key)}` },
      });
      return;
    }

    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 3600 }
    );

    res.status(200).json({ status: "success", data: { url: signedUrl } });
  })
);

export default router;