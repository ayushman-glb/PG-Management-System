import { PrismaClient } from '@prisma/client';

export type DocumentStatus = 'PENDING' | 'GENERATING' | 'READY' | 'FAILED' | 'STORAGE_MISSING';

export interface CreateDocumentData {
  documentKey: string;
  documentType: string;
  entityType: string;
  entityId: string;
  ownerId?: string;
  residentId?: string;
  fileName: string;
  version?: number;
  status?: DocumentStatus;
  sourceSnapshot?: string;
}

export interface UpdateDocumentData {
  status?: DocumentStatus;
  storagePublicId?: string;
  storageUrl?: string;
  fileSize?: number;
  sha256Hash?: string;
  generatedAt?: Date;
  sourceSnapshot?: string;
}

export class DocumentRepository {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Find an existing document by its deterministic key.
   */
  async findByKey(documentKey: string) {
    return this.db.generatedDocument.findUnique({ where: { documentKey } });
  }

  /**
   * Find by internal document ID.
   */
  async findById(id: string) {
    return this.db.generatedDocument.findUnique({ where: { id } });
  }

  /**
   * Atomically create a new document record with PENDING status,
   * only if one with the same documentKey doesn't already exist.
   * Returns the existing record if it already exists (idempotent).
   */
  async findOrCreate(data: CreateDocumentData) {
    const existing = await this.findByKey(data.documentKey);
    if (existing) return { record: existing, created: false };

    const record = await this.db.generatedDocument.create({
      data: {
        documentKey: data.documentKey,
        documentType: data.documentType,
        entityType: data.entityType,
        entityId: data.entityId,
        ownerId: data.ownerId,
        residentId: data.residentId,
        fileName: data.fileName,
        version: data.version ?? 1,
        status: data.status ?? 'PENDING',
        sourceSnapshot: data.sourceSnapshot,
      },
    });
    return { record, created: true };
  }

  /**
   * Atomically transition status from PENDING → GENERATING.
   * Uses updateMany with a WHERE clause on the current status to prevent
   * race conditions — only one request "wins" the GENERATING state.
   * Returns true if the transition succeeded (this request owns generation).
   */
  async tryClaimGenerating(documentKey: string): Promise<boolean> {
    const result = await this.db.generatedDocument.updateMany({
      where: { documentKey, status: 'PENDING' },
      data: { status: 'GENERATING' },
    });
    return result.count > 0;
  }

  /**
   * Mark document as READY after successful generation + storage.
   */
  async markReady(documentKey: string, data: UpdateDocumentData) {
    return this.db.generatedDocument.update({
      where: { documentKey },
      data: {
        status: 'READY',
        storagePublicId: data.storagePublicId,
        storageUrl: data.storageUrl,
        fileSize: data.fileSize,
        sha256Hash: data.sha256Hash,
        generatedAt: data.generatedAt ?? new Date(),
        ...(data.sourceSnapshot ? { sourceSnapshot: data.sourceSnapshot } : {}),
      },
    });
  }

  /**
   * Mark document FAILED — generation or storage did not succeed.
   */
  async markFailed(documentKey: string) {
    return this.db.generatedDocument.update({
      where: { documentKey },
      data: { status: 'FAILED' },
    });
  }

  /**
   * Mark document STORAGE_MISSING — DB record exists but Cloudinary asset is gone.
   */
  async markStorageMissing(documentKey: string) {
    return this.db.generatedDocument.update({
      where: { documentKey },
      data: { status: 'STORAGE_MISSING' },
    });
  }

  /**
   * Reset from FAILED/STORAGE_MISSING → PENDING so generation can be retried.
   */
  async resetToPending(documentKey: string) {
    return this.db.generatedDocument.update({
      where: { documentKey },
      data: { status: 'PENDING', storagePublicId: null, storageUrl: null, sha256Hash: null },
    });
  }

  /**
   * Update storage reference after recovery (STORAGE_MISSING → READY).
   */
  async updateStorage(documentKey: string, data: UpdateDocumentData) {
    return this.db.generatedDocument.update({
      where: { documentKey },
      data: {
        status: data.status ?? 'READY',
        storagePublicId: data.storagePublicId,
        storageUrl: data.storageUrl,
        fileSize: data.fileSize,
        sha256Hash: data.sha256Hash,
        generatedAt: data.generatedAt,
      },
    });
  }

  /**
   * Find all documents by residentId (for authorization checks).
   */
  async findByResidentId(residentId: string) {
    return this.db.generatedDocument.findMany({
      where: { residentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find all documents by ownerId.
   */
  async findByOwnerId(ownerId: string) {
    return this.db.generatedDocument.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Append a DocumentAuditLog entry.
   */
  async logAuditEvent(data: {
    documentId?: string;
    documentKey?: string;
    documentType: string;
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
    version?: number;
  }) {
    return this.db.documentAuditLog.create({
      data: {
        documentId: data.documentId,
        documentKey: data.documentKey,
        documentType: data.documentType,
        userId: data.userId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success ?? true,
        errorMessage: data.errorMessage,
        version: data.version ?? 1,
      },
    });
  }

  /**
   * Find resident ID associated with a user ID.
   */
  async findResidentByUserId(userId: string) {
    return this.db.resident.findFirst({ where: { userId } });
  }

  /**
   * Find owner ID associated with a user ID.
   */
  async findOwnerByUserId(userId: string) {
    return this.db.owner.findFirst({ where: { userId } });
  }
}
