import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
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

    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype === 'image/avif' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

/**
 * Robust middleware wrapper that handles flexible multipart form field names ('file', 'image', 'document', 'photo', 'avatar')
 * and captures Multer errors cleanly, returning 400 Bad Request instead of throwing 500.
 */
export const handleSingleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = (req.headers['content-type'] || (req.headers as any)['Content-Type'] || '') as string;

  if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) {
    console.warn(`⚠️ Upload Error: Request Content-Type [${contentType}] is missing or not multipart/form-data.`);
    return res.status(400).json({
      success: false,
      message: 'Invalid Content-Type header. File uploads must use multipart/form-data with a valid boundary parameter.',
    });
  }

  if (!contentType.includes('boundary=')) {
    console.warn(`⚠️ Upload Error: Request Content-Type [${contentType}] is missing required boundary parameter.`);
    return res.status(400).json({
      success: false,
      message: 'Invalid Content-Type header: missing boundary parameter. Do not manually override the Content-Type header on FormData requests.',
    });
  }

  const uploadHandler = multerUpload.any();

  uploadHandler(req, res, (err: any) => {
    if (err) {
      console.error('❌ Multer Parsing Error on Render:', err);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `File upload error [Multer]: ${err.message}`,
          code: err.code,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload parsing failed',
      });
    }

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      req.file = files[0];
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was attached to the request. Please attach a file under field name "file" or "image".',
      });
    }

    next();
  });
};
