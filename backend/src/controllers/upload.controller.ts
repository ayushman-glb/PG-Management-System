import { Request, Response } from 'express';

export class UploadController {
  async handleUpload(req: Request, res: Response) {
    const uploadResult = (req as any).uploadResult;
    if (!uploadResult) {
      return res.status(500).json({ success: false, message: 'Upload processing failed' });
    }

    return res.status(200).json({
      success: true,
      message: 'File processed and uploaded successfully',
      data: {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        checksum: uploadResult.checksum,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        originalName: uploadResult.originalName,
      },
    });
  }
}

export const uploadController = new UploadController();
