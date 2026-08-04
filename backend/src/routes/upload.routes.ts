import { Router } from 'express';
import { multerUpload } from '../middleware/upload.middleware';
import { processSecurityPipeline } from '../middleware/securityPipeline.middleware';
import { uploadController } from '../controllers/upload.controller';

const router = Router();

router.post(
  '/image',
  multerUpload.single('file'),
  processSecurityPipeline,
  uploadController.handleUpload
);

router.post(
  '/document',
  multerUpload.single('file'),
  processSecurityPipeline,
  uploadController.handleUpload
);

export default router;
