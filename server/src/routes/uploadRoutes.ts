import { Router } from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "../middlewares/fileUploadMiddleware.js";

const router = Router();

// Generate presigned download URL for any S3 key
router.get("/presigned/*key", protect, async (req, res) => {
  const key = (req.params as Record<string, string>)["key"];
  
  if (!key) {
    res.status(400).json({ status: "fail", message: "Key required" });
    return;
  }

  const signedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: 3600 }
  );

  res.status(200).json({ status: "success", data: { url: signedUrl } });
});

export default router;