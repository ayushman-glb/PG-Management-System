import { Request, Response } from 'express';
import { catchAsync, AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export class UploadController {
  handleUpload = catchAsync(async (req: Request, res: Response): Promise<void> => {
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
  });
}

export const uploadController = new UploadController();
