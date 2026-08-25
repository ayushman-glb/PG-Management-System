import { Router } from 'express';
import { DocumentController } from './document.controller';
import { authenticate, requireRole } from '../../middleware/authMiddleware';
import { handleSingleFileUpload } from '../../middleware/upload.middleware';
import { processSecurityPipeline } from '../../middleware/securityPipeline.middleware';
import { uploadLimiter } from '../../middleware/rateLimiter';
import { Role } from '@prisma/client';

const documentController = new DocumentController();
const router = Router();

router.use(authenticate);

router.get('/', documentController.getUserDocuments);
router.post(
  '/upload',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  documentController.uploadDocument
);
router.post(
  '/:id/reupload',
  uploadLimiter,
  handleSingleFileUpload,
  processSecurityPipeline,
  documentController.reuploadDocument
);
router.get('/:id', documentController.getDocument);
router.get('/:id/history', documentController.getVersionHistory);
router.patch(
  '/:id/verify',
  requireRole(Role.PG_OWNER, Role.ADMIN),
  documentController.verifyDocument
);

export { router as documentRoutes };
