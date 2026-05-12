// src/controllers/uploadController.ts
import { Request, Response } from "express";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "../config/s3.js";
import { catchAsync } from "../utils/catchAsync.js";

// Upload single file
export const uploadFile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
      return;
    }

    const file = req.file as Express.MulterS3.File;

    res.status(200).json({
      status: "success",
      data: {
        fileUrl: file.location,
        key: file.key,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
    });
  }
);

// Upload multiple files
export const uploadMultipleFiles = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.files || (req.files as Express.MulterS3.File[]).length === 0) {
      res.status(400).json({
        status: "fail",
        message: "No files uploaded",
      });
      return;
    }

    const files = req.files as Express.MulterS3.File[];

    res.status(200).json({
      status: "success",
      data: files.map((file) => ({
        fileUrl: file.location,
        key: file.key,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })),
    });
  }
);

// Get presigned URL (for private files)
export const getPresignedUrl = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const key = req.params["key"] as string;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: decodeURIComponent(key),
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    res.status(200).json({
      status: "success",
      data: { url, expiresIn: 3600 },
    });
  }
);

// Delete file
export const deleteFile = catchAsync(
  async (req: Request, res: Response): Promise<void> => {
    const key = req.params["key"] as string;

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: decodeURIComponent(key),
      })
    );

    res.status(200).json({
      status: "success",
      message: "File deleted successfully",
    });
  }
);