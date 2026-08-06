import { Router } from 'express';
import { handleSingleFileUpload } from '../middleware/upload.middleware';
import { processSecurityPipeline } from '../middleware/securityPipeline.middleware';
import { uploadController } from '../controllers/upload.controller';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post(
  '/image',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  uploadController.handleUpload
);

router.post(
  '/document',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  uploadController.handleUpload
);

export default router;
