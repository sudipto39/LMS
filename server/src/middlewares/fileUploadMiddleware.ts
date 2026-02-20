import multer, { StorageEngine } from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

if (!config.MONGODB_URI) {
  throw new Error('❌ MONGODB_URI is required for file uploads');
}

const storage = new GridFsStorage({
  url: config.MONGODB_URI,
  file: (_req, file) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppError(
        'Invalid file type. Only PDF, JPG, PNG allowed.',
        400
      );
    }

    return {
      bucketName: 'milestoneFiles',
      filename: `${Date.now()}-${file.originalname}`,
    };
  },
}) as unknown as StorageEngine; // 🔥 KEY LINE

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
