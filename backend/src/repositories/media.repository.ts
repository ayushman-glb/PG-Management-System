import { prisma } from '../config/prisma';

export interface CreateMediaRecordData {
  url: string;
  secureUrl: string;
  publicId: string;
  assetId?: string;
  folder: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  originalFilename?: string;
  checksum?: string;
  entityType?: string;
  entityId?: string;
  uploadedBy?: string;
}

export class MediaRepository {
  /**
   * Create or update a MediaRecord document in MongoDB
   */
  async createMediaRecord(data: CreateMediaRecordData) {
    return prisma.mediaRecord.upsert({
      where: { publicId: data.publicId },
      create: {
        url: data.url,
        secureUrl: data.secureUrl,
        publicId: data.publicId,
        assetId: data.assetId,
        folder: data.folder,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        originalFilename: data.originalFilename,
        checksum: data.checksum,
        entityType: data.entityType,
        entityId: data.entityId,
        uploadedBy: data.uploadedBy,
      },
      update: {
        url: data.url,
        secureUrl: data.secureUrl,
        assetId: data.assetId,
        folder: data.folder,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        originalFilename: data.originalFilename,
        checksum: data.checksum,
        entityType: data.entityType,
        entityId: data.entityId,
        uploadedBy: data.uploadedBy,
      },
    });
  }

  /**
   * Find MediaRecord by publicId
   */
  async findByPublicId(publicId: string) {
    return prisma.mediaRecord.findUnique({
      where: { publicId },
    });
  }

  /**
   * Delete MediaRecord by publicId
   */
  async deleteByPublicId(publicId: string) {
    try {
      return await prisma.mediaRecord.delete({
        where: { publicId },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Bulk delete MediaRecord documents by publicId array
   */
  async deleteManyByPublicIds(publicIds: string[]) {
    if (!publicIds || publicIds.length === 0) return { count: 0 };
    return prisma.mediaRecord.deleteMany({
      where: {
        publicId: { in: publicIds },
      },
    });
  }

  /**
   * List MediaRecords associated with a specific entity
   */
  async findByEntity(entityType: string, entityId: string) {
    return prisma.mediaRecord.findMany({
      where: { entityType, entityId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}

export const mediaRepository = new MediaRepository();
