import multer from 'multer';
import path from 'path';
import { env } from '../config/env';
import { PathResolver } from '../utils/pathResolver';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PathResolver.getUploadsDir());
  },
  filename: (_req, file, cb) => {
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(sanitizedOriginalName).toLowerCase();
    const baseName = path.basename(sanitizedOriginalName, ext).slice(0, 30);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const maxSizeBytes = parseInt(env.UPLOAD_MAX_SIZE || '10485760', 10);

export const multerUpload = multer({
  storage,
  limits: {
    fileSize: isNaN(maxSizeBytes) ? 10 * 1024 * 1024 : maxSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = (env.ALLOWED_IMAGE_TYPES + ',' + env.ALLOWED_DOCUMENT_TYPES)
      .split(',')
      .map((t) => t.trim());

    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype === 'image/avif') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

