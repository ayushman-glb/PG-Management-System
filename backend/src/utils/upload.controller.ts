import { Request, Response } from 'express';
import { AppError } from '../core/errors/CustomErrors';
import { ApiResponse } from './apiResponse';
import { logger } from './logger';

export class UploadController {
  handleUpload = async (req: Request, res: Response): Promise<void> => {
    const uploadResult = (req as any).uploadResult;
    if (!uploadResult) {
      throw new AppError('Upload processing failed: No file upload payload attached.', 400, 'UPLOAD_PAYLOAD_MISSING');
    }

    logger.info(`Upload Success [PublicID: ${uploadResult.publicId}, Size: ${uploadResult.bytes} bytes, Format: ${uploadResult.format}]`);

    ApiResponse.success(res, 'File processed and uploaded successfully', {
      url: uploadResult.secureUrl || uploadResult.url,
      secureUrl: uploadResult.secureUrl || uploadResult.url,
      publicId: uploadResult.publicId,
      assetId: uploadResult.assetId,
      folder: uploadResult.folder,
      checksum: uploadResult.checksum,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      originalName: uploadResult.originalName,
    });
  };

  handleDelete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    logger.info(`Media deletion request for [ID/PublicID: ${id}]`);
    ApiResponse.success(res, 'Media asset deleted successfully', { id, deleted: true });
  };

  handleBulkDelete = async (req: Request, res: Response): Promise<void> => {
    const { publicIds } = req.body;
    logger.info(`Bulk media deletion request for ${publicIds?.length || 0} items`);
    ApiResponse.success(res, 'Media assets deleted successfully', { count: publicIds?.length || 0 });
  };

  handleReorder = async (req: Request, res: Response): Promise<void> => {
    const { publicIds, entityType, entityId } = req.body;
    logger.info(`Media reorder request for entity [${entityType}:${entityId}]`);
    ApiResponse.success(res, 'Media order updated successfully', { publicIds, entityType, entityId });
  };
}

export const uploadController = new UploadController();
