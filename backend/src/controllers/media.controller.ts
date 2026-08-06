import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { mediaService } from '../services/media.service';

export class MediaController {
  /**
   * Single file upload endpoint
   */
  async uploadSingle(req: AuthRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file provided for upload.' });
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

      return res.status(201).json({
        success: true,
        message: 'Image/Media uploaded and optimized successfully.',
        data: uploadResult,
      });
    } catch (error: any) {
      console.error('❌ Upload Single Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Single media upload failed.',
      });
    }
  }

  /**
   * Multiple files upload endpoint (up to 10 files)
   */
  async uploadMultiple(req: AuthRequest, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files provided for batch upload.' });
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

      return res.status(201).json({
        success: true,
        message: `${uploadResults.length} files uploaded and optimized successfully.`,
        data: uploadResults,
      });
    } catch (error: any) {
      console.error('❌ Upload Multiple Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Multiple media upload failed.',
      });
    }
  }

  /**
   * Replace existing image by publicId endpoint
   */
  async replaceImage(req: AuthRequest, res: Response) {
    try {
      const publicId = req.params.publicId || req.body.publicId;
      if (!publicId) {
        return res.status(400).json({ success: false, message: 'Existing publicId is required for image replacement.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'New file is required for image replacement.' });
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

      return res.status(200).json({
        success: true,
        message: 'Image replaced and optimized successfully.',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Replace Image Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Image replacement failed.',
      });
    }
  }

  /**
   * Delete single image by publicId endpoint
   */
  async deleteImage(req: AuthRequest, res: Response) {
    try {
      const publicId = req.params.publicId || req.query.publicId || req.body.publicId;
      if (!publicId) {
        return res.status(400).json({ success: false, message: 'publicId parameter is required for deletion.' });
      }

      const resourceType = (req.query.resourceType as any) || 'image';
      const result = await mediaService.deleteImage(publicId, resourceType);

      return res.status(200).json({
        success: true,
        message: 'Image deleted from Cloudinary and database metadata removed.',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Delete Image Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Image deletion failed.',
      });
    }
  }

  /**
   * Bulk delete images by publicIds array endpoint
   */
  async bulkDeleteImages(req: AuthRequest, res: Response) {
    try {
      const { publicIds, resourceType } = req.body;
      if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
        return res.status(400).json({ success: false, message: 'publicIds array is required for bulk deletion.' });
      }

      const result = await mediaService.bulkDeleteImages(publicIds, resourceType || 'image');

      return res.status(200).json({
        success: true,
        message: 'Bulk deletion complete.',
        data: result,
      });
    } catch (error: any) {
      console.error('❌ Bulk Delete Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Bulk deletion failed.',
      });
    }
  }

  /**
   * Get metadata endpoint
   */
  async getMetadata(req: AuthRequest, res: Response) {
    try {
      const publicId = req.params.publicId || (req.query.publicId as string);
      if (!publicId) {
        return res.status(400).json({ success: false, message: 'publicId parameter is required.' });
      }

      const metadata = await mediaService.getMetadata(publicId);
      return res.status(200).json({
        success: true,
        data: metadata,
      });
    } catch (error: any) {
      console.error('❌ Get Metadata Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Fetching media metadata failed.',
      });
    }
  }

  /**
   * Reorder images endpoint
   */
  async reorderImages(req: AuthRequest, res: Response) {
    try {
      const { publicIds, entityType, entityId } = req.body;
      if (!publicIds || !Array.isArray(publicIds)) {
        return res.status(400).json({ success: false, message: 'publicIds array is required for reordering.' });
      }

      const reordered = await mediaService.reorderImages(publicIds, entityType, entityId);
      return res.status(200).json({
        success: true,
        message: 'Image order updated successfully.',
        data: reordered,
      });
    } catch (error: any) {
      console.error('❌ Reorder Images Controller Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Reordering images failed.',
      });
    }
  }
}

export const mediaController = new MediaController();
