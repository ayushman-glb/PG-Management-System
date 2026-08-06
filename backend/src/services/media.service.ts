import { cloudinaryService, CloudinaryUploadResult } from './cloudinary.service';
import { mediaRepository } from '../repositories/media.repository';
import { computeSHA256Checksum } from '../utils/crypto';

export interface UploadFileOptions {
  folder?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  originalFilename?: string;
  mimeType?: string;
}

export class MediaService {
  /**
   * Upload single image/document file, store metadata in MongoDB
   */
  async uploadSingle(
    filePathOrBuffer: string | Buffer,
    options: UploadFileOptions = {}
  ): Promise<CloudinaryUploadResult & { recordId?: string }> {
    const folder = options.folder || 'documents';
    const resourceType = options.mimeType === 'application/pdf' ? 'raw' : 'image';

    // Upload asset to Cloudinary with automatic optimization
    const uploadResult = await cloudinaryService.uploadFile(
      filePathOrBuffer,
      folder,
      resourceType,
      undefined,
      options.originalFilename
    );

    // Compute checksum
    let checksum: string | undefined;
    try {
      const buffer = Buffer.isBuffer(filePathOrBuffer)
        ? filePathOrBuffer
        : require('fs').readFileSync(filePathOrBuffer);
      checksum = computeSHA256Checksum(buffer);
    } catch (e) {}

    // Persist metadata to MongoDB with automatic rollback on DB failure
    let record: any;
    try {
      record = await mediaRepository.createMediaRecord({
        url: uploadResult.url,
        secureUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        assetId: uploadResult.assetId,
        folder: uploadResult.folder,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        originalFilename: uploadResult.originalFilename || options.originalFilename,
        checksum,
        entityType: options.entityType,
        entityId: options.entityId,
        uploadedBy: options.userId,
      });
    } catch (dbError: any) {
      console.error(`❌ DB Metadata Save Failed for publicId [${uploadResult.publicId}]: ${dbError.message}. Rolling back Cloudinary asset...`);
      await cloudinaryService.deleteFile(uploadResult.publicId, resourceType);
      throw new Error(`Database save failed. Cloudinary asset rolled back automatically: ${dbError.message}`);
    }

    return {
      ...uploadResult,
      recordId: record.id,
    };
  }

  /**
   * Upload multiple images concurrently
   */
  async uploadMultiple(
    files: Array<{ filePathOrBuffer: string | Buffer; originalFilename?: string; mimeType?: string }>,
    options: UploadFileOptions = {}
  ) {
    const uploadPromises = files.map((file) =>
      this.uploadSingle(file.filePathOrBuffer, {
        ...options,
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
      })
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Replace an existing media asset
   */
  async replaceImage(
    publicId: string,
    filePathOrBuffer: string | Buffer,
    options: UploadFileOptions = {}
  ) {
    const folder = options.folder || 'documents';
    const resourceType = options.mimeType === 'application/pdf' ? 'raw' : 'image';

    // Delete existing asset from Cloudinary
    if (publicId) {
      await cloudinaryService.deleteFile(publicId, resourceType);
      await mediaRepository.deleteByPublicId(publicId);
    }

    // Upload replacement
    return this.uploadSingle(filePathOrBuffer, options);
  }

  /**
   * Delete image from Cloudinary and MongoDB
   */
  async deleteImage(publicId: string, resourceType: 'image' | 'raw' | 'video' = 'image') {
    const cloudinaryDeleted = await cloudinaryService.deleteFile(publicId, resourceType);
    await mediaRepository.deleteByPublicId(publicId);
    return { success: cloudinaryDeleted, publicId };
  }

  /**
   * Bulk delete images from Cloudinary and MongoDB
   */
  async bulkDeleteImages(publicIds: string[], resourceType: 'image' | 'raw' | 'video' = 'image') {
    const cloudinaryResult = await cloudinaryService.bulkDeleteFiles(publicIds, resourceType);
    await mediaRepository.deleteManyByPublicIds(publicIds);
    return cloudinaryResult;
  }

  /**
   * Fetch Cloudinary and DB metadata for asset
   */
  async getMetadata(publicId: string) {
    const dbRecord = await mediaRepository.findByPublicId(publicId);
    let cloudMetadata = null;
    try {
      cloudMetadata = await cloudinaryService.getAssetMetadata(publicId);
    } catch (e) {}

    return {
      dbRecord,
      cloudinary: cloudMetadata,
    };
  }

  /**
   * Reorder array of publicIds associated with an entity
   */
  async reorderImages(publicIds: string[], entityType?: string, entityId?: string) {
    if (!publicIds || publicIds.length === 0) return [];
    
    // Fetch and return reordered asset list
    const updatedRecords = await Promise.all(
      publicIds.map(async (publicId, index) => {
        const record = await mediaRepository.findByPublicId(publicId);
        if (record && entityType && entityId) {
          await mediaRepository.createMediaRecord({
            url: record.url,
            secureUrl: record.secureUrl,
            publicId: record.publicId,
            folder: record.folder,
            entityType,
            entityId,
          });
        }
        return { publicId, order: index };
      })
    );
    return updatedRecords;
  }
}

export const mediaService = new MediaService();
