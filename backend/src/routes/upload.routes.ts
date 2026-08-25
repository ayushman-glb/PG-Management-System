import { Router } from 'express';
import { handleSingleFileUpload } from '../middleware/upload.middleware';
import { processSecurityPipeline } from '../middleware/securityPipeline.middleware';
import { uploadController } from '../utils/upload.controller';
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

router.post(
  '/upload/single',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  uploadController.handleUpload
);

router.put(
  '/replace/:id',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  uploadController.handleUpload
);

router.delete('/:id', uploadController.handleDelete);
router.post('/bulk-delete', uploadController.handleBulkDelete);
router.patch('/reorder', uploadController.handleReorder);

export { router as uploadRoutes };
