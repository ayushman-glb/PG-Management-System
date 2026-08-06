import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class UploadController {
  async handleUpload(req: Request, res: Response) {
    try {
      const uploadResult = (req as any).uploadResult;
      if (!uploadResult) {
        console.error('❌ UploadController Error: req.uploadResult is undefined.');
        return res.status(400).json({
          success: false,
          message: 'Upload processing failed: No file upload payload attached.',
        });
      }

      console.log(`✅ Upload Success [PublicID: ${uploadResult.publicId}, Size: ${uploadResult.bytes} bytes, Format: ${uploadResult.format}]`);

      return res.status(200).json({
        success: true,
        message: 'File processed and uploaded successfully',
        data: {
          url: uploadResult.secureUrl || uploadResult.url,
          secureUrl: uploadResult.secureUrl || uploadResult.url,
          publicId: uploadResult.publicId,
          assetId: uploadResult.assetId,
          folder: uploadResult.folder,
          checksum: uploadResult.checksum,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
          originalName: uploadResult.originalName,
        },
      });
    } catch (error: any) {
      console.error('❌ UploadController Uncaught Error on Render:', error);
      logger.error('UploadController Uncaught Exception:', error);
      return res.status(500).json({
        success: false,
        message: `Internal upload handling error: ${error.message || 'Unknown failure'}`,
      });
    }
  }
}

export const uploadController = new UploadController();
