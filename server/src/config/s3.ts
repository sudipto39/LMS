import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3Client = new S3Client({
  region: env.AWS_REGION || "ap-south-1",
  ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const BUCKET_NAME = env.AWS_S3_BUCKET_NAME;