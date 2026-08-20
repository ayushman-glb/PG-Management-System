import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { multerUpload } from '../middleware/upload.middleware';
import { processSecurityPipeline } from '../middleware/securityPipeline.middleware';
import { mediaController } from '../controllers/media.controller';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

// Protect all media endpoints with JWT Authentication
router.use(authenticate);

/**
 * @route POST /api/v1/media/upload/single
 * @desc Upload a single image or document asset
 */
router.post(
  '/upload/single',
  uploadLimiter,
  multerUpload.single('file'),
  processSecurityPipeline,
  (req, res, next) => mediaController.uploadSingle(req as any, res, next)
);

/**
 * @route POST /api/v1/media/upload/multiple
 * @desc Batch upload up to 10 images
 */
router.post(
  '/upload/multiple',
  uploadLimiter,
  multerUpload.array('files', 10),
  (req, res, next) => mediaController.uploadMultiple(req as any, res, next)
);

/**
 * @route PUT /api/v1/media/replace/:publicId
 * @desc Replace an existing media asset by publicId
 */
router.put(
  '/replace/:publicId',
  uploadLimiter,
  multerUpload.single('file'),
  processSecurityPipeline,
  (req, res, next) => mediaController.replaceImage(req as any, res, next)
);

/**
 * @route DELETE /api/v1/media/:publicId
 * @desc Delete a single media asset from Cloudinary and MongoDB
 */
router.delete('/:publicId', (req, res, next) => mediaController.deleteImage(req as any, res, next));

/**
 * @route POST /api/v1/media/bulk-delete
 * @desc Delete multiple media assets by publicIds
 */
router.post('/bulk-delete', (req, res, next) => mediaController.bulkDeleteImages(req as any, res, next));

/**
 * @route GET /api/v1/media/metadata/:publicId
 * @desc Fetch Cloudinary and MongoDB metadata for an asset
 */
router.get('/metadata/:publicId', (req, res, next) => mediaController.getMetadata(req as any, res, next));

/**
 * @route PATCH /api/v1/media/reorder
 * @desc Reorder multiple media asset references
 */
router.patch('/reorder', (req, res, next) => mediaController.reorderImages(req as any, res, next));

export default router;
