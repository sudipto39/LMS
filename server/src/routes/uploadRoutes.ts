import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "../middlewares/fileUploadMiddleware.js";
import { prisma } from "../config/db.js";
import { catchAsync } from "../utils/catchAsync.js";
import { NotFoundError, BadRequestError } from "../utils/appError.js";

import { Prisma } from "../generated/prisma/index.js";

const router = Router();

// Generate presigned download URL for authorized S3 keys
router.get(
  "/presigned/*key",
  protect,
  catchAsync(async (req, res) => {
    const key = (req.params as Record<string, string>)["key"];

    if (!key) {
      throw new BadRequestError("S3 Key is required");
    }

    const user = req.user!;

    // Admins have universal download access
    if (user.role !== "ADMIN") {
      // Find milestones only within projects accessible to the requesting user
      const accessibleMilestones = await prisma.milestone.findMany({
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
      });

      const hasAccess = accessibleMilestones.some((m) => {
        const atts = m.attachments as Array<{ key?: string }> | null;
        return Array.isArray(atts) && atts.some((a) => a.key === key);
      });

      if (!hasAccess) {
        throw new NotFoundError("File not found or access denied");
      }
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