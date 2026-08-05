import { Router } from 'express';
import { multerUpload } from '../middleware/upload.middleware';
import { processSecurityPipeline } from '../middleware/securityPipeline.middleware';
import { uploadController } from '../controllers/upload.controller';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/image',
  uploadLimiter,
  multerUpload.single('file'),
  processSecurityPipeline,
  uploadController.handleUpload
);

router.post(
  '/document',
  uploadLimiter,
  multerUpload.single('file'),
  processSecurityPipeline,
  uploadController.handleUpload
);

export default router;
