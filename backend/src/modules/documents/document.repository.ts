import { PrismaClient, Document, DocumentType, VerificationStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class DocumentRepository {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  async findByUserId(userId: string, isCurrentOnly = true): Promise<Document[]> {
    const where: any = { userId };
    if (isCurrentOnly) {
      where.isCurrent = true;
    }
    return this.db.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return this.db.document.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, username: true, role: true },
        },
      },
    });
  }

  async findVersionHistory(parentOrDocId: string): Promise<Document[]> {
    return this.db.document.findMany({
      where: {
        OR: [
          { id: parentOrDocId },
          { parentDocumentId: parentOrDocId },
        ],
      },
      orderBy: { version: 'asc' },
    });
  }

  async create(data: {
    userId: string;
    documentType: DocumentType;
    title?: string;
    documentNumber?: string;
    fileUrl: string;
    mimeType?: string;
    fileSize?: number;
    status?: VerificationStatus;
    version?: number;
    isCurrent?: boolean;
    parentDocumentId?: string;
    hash?: string;
    cloudinaryPublicId?: string;
  }): Promise<Document> {
    return this.db.document.create({
      data: {
        userId: data.userId,
        documentType: data.documentType,
        title: data.title,
        documentNumber: data.documentNumber,
        fileUrl: data.fileUrl,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        status: data.status || VerificationStatus.PENDING,
        version: data.version || 1,
        isCurrent: data.isCurrent ?? true,
        parentDocumentId: data.parentDocumentId,
        hash: data.hash,
        cloudinaryPublicId: data.cloudinaryPublicId,
      },
    });
  }

  async archivePreviousVersions(userId: string, documentType: DocumentType): Promise<void> {
    await this.db.document.updateMany({
      where: {
        userId,
        documentType,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });
  }

  async updateVerification(
    id: string,
    verifiedById: string,
    status: VerificationStatus,
    rejectionReason?: string
  ): Promise<Document> {
    return this.db.document.update({
      where: { id },
      data: {
        status,
        verifiedById,
        verifiedAt: new Date(),
        rejectionReason: rejectionReason || null,
      },
    });
  }
}
