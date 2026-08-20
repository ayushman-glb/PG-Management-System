import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { mediaService } from '../services/media.service';
import { catchAsync, AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';

export class MediaController {
  /**
   * Single file upload endpoint
   */
  uploadSingle = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.file) {
      throw new AppError('No file provided for upload.', 400, 'FILE_MISSING');
    }

    const folder = (req.body.folder as string) || 'documents';
    const entityType = req.body.entityType as string | undefined;
    const entityId = req.body.entityId as string | undefined;
    const userId = req.user?.id;

    const uploadResult = await mediaService.uploadSingle(req.file.path, {
      folder,
      entityType,
      entityId,
      userId,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    ApiResponse.success(res, 'Image/Media uploaded and optimized successfully.', uploadResult, 201);
  });

  /**
   * Multiple files upload endpoint (up to 10 files)
   */
  uploadMultiple = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('No files provided for batch upload.', 400, 'FILES_MISSING');
    }

    const folder = (req.body.folder as string) || 'documents';
    const entityType = req.body.entityType as string | undefined;
    const entityId = req.body.entityId as string | undefined;
    const userId = req.user?.id;

    const filePayloads = files.map((file) => ({
      filePathOrBuffer: file.path,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
    }));

    const uploadResults = await mediaService.uploadMultiple(filePayloads, {
      folder,
      entityType,
      entityId,
      userId,
    });

    ApiResponse.success(
      res,
      `${uploadResults.length} files uploaded and optimized successfully.`,
      uploadResults,
      201
    );
  });

  /**
   * Replace existing image by publicId endpoint
   */
  replaceImage = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const publicId = req.params.publicId || req.body.publicId;
    if (!publicId) {
      throw new AppError('Existing publicId is required for image replacement.', 400, 'PUBLIC_ID_REQUIRED');
    }

    if (!req.file) {
      throw new AppError('New file is required for image replacement.', 400, 'FILE_MISSING');
    }

    const folder = (req.body.folder as string) || 'documents';
    const entityType = req.body.entityType as string | undefined;
    const entityId = req.body.entityId as string | undefined;
    const userId = req.user?.id;

    const result = await mediaService.replaceImage(publicId, req.file.path, {
      folder,
      entityType,
      entityId,
      userId,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    ApiResponse.success(res, 'Image replaced and optimized successfully.', result);
  });

  /**
   * Delete single image by publicId endpoint
   */
  deleteImage = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const publicId = req.params.publicId || req.query.publicId || req.body.publicId;
    if (!publicId) {
      throw new AppError('publicId parameter is required for deletion.', 400, 'PUBLIC_ID_REQUIRED');
    }

    const resourceType = (req.query.resourceType as any) || 'image';
    const result = await mediaService.deleteImage(publicId as string, resourceType);

    ApiResponse.success(res, 'Image deleted from Cloudinary and database metadata removed.', result);
  });

  /**
   * Bulk delete images by publicIds array endpoint
   */
  bulkDeleteImages = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const { publicIds, resourceType } = req.body;
    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      throw new AppError('publicIds array is required for bulk deletion.', 400, 'PUBLIC_IDS_REQUIRED');
    }

    const result = await mediaService.bulkDeleteImages(publicIds, resourceType || 'image');
    ApiResponse.success(res, 'Bulk deletion complete.', result);
  });

  /**
   * Get metadata endpoint
   */
  getMetadata = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const publicId = req.params.publicId || (req.query.publicId as string);
    if (!publicId) {
      throw new AppError('publicId parameter is required.', 400, 'PUBLIC_ID_REQUIRED');
    }

    const metadata = await mediaService.getMetadata(publicId);
    ApiResponse.success(res, 'Media metadata retrieved successfully.', metadata);
  });

  /**
   * Reorder images endpoint
   */
  reorderImages = catchAsync(async (req: AuthRequest, res: Response): Promise<void> => {
    const { publicIds, entityType, entityId } = req.body;
    if (!publicIds || !Array.isArray(publicIds)) {
      throw new AppError('publicIds array is required for reordering.', 400, 'PUBLIC_IDS_REQUIRED');
    }

    const reordered = await mediaService.reorderImages(publicIds, entityType, entityId);
    ApiResponse.success(res, 'Image order updated successfully.', reordered);
  });
}

export const mediaController = new MediaController();
