import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3Client, BUCKET_NAME } from "../config/s3.js";

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|mp4|doc|docx|zip|txt|ppt|pptx|xls|xlsx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
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
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `uploads/${name}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter,
});
