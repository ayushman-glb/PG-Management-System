import { Document, DocumentType, VerificationStatus, Role } from '@prisma/client';
import { DocumentRepository } from './document.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { UploadDocumentDTO, VerifyDocumentDTO } from './document.dto';

export class DocumentService {
  constructor(private readonly documentRepo: DocumentRepository = new DocumentRepository()) {}

  async getUserDocuments(
    requesterId: string,
    requesterRole: Role,
    targetUserId?: string
  ): Promise<Document[]> {
    const effectiveUserId = targetUserId && (requesterRole === Role.PG_OWNER || requesterRole === Role.ADMIN)
      ? targetUserId
      : requesterId;

    return this.documentRepo.findByUserId(effectiveUserId, true);
  }

  async uploadDocument(
    userId: string,
    data: UploadDocumentDTO,
    uploadResult: {
      url?: string;
      secureUrl?: string;
      publicId?: string;
      checksum?: string;
      mimeType?: string;
      bytes?: number;
      originalName?: string;
    }
  ): Promise<Document> {
    if (!data.documentType) {
      throw new BadRequestError('documentType is required.');
    }

    const fileUrl = uploadResult.secureUrl || uploadResult.url;
    if (!fileUrl) {
      throw new BadRequestError('File upload failed: No secure URL provided by storage service.');
    }

    // Archive previous version if exists for this user and doc type
    await this.documentRepo.archivePreviousVersions(userId, data.documentType);

    return this.documentRepo.create({
      userId,
      documentType: data.documentType,
      title: data.title || uploadResult.originalName || String(data.documentType),
      documentNumber: data.documentNumber,
      fileUrl,
      mimeType: uploadResult.mimeType || 'application/pdf',
      fileSize: uploadResult.bytes,
      status: VerificationStatus.PENDING,
      version: 1,
      isCurrent: true,
      hash: uploadResult.checksum,
      cloudinaryPublicId: uploadResult.publicId,
    });
  }

  async reuploadDocument(
    userId: string,
    documentId: string,
    uploadResult: {
      url?: string;
      secureUrl?: string;
      publicId?: string;
      checksum?: string;
      mimeType?: string;
      bytes?: number;
      originalName?: string;
    }
  ): Promise<Document> {
    const existing = await this.documentRepo.findById(documentId);
    if (!existing) {
      throw new NotFoundError('Original document to replace not found.');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You cannot replace a document that does not belong to you.');
    }

    const fileUrl = uploadResult.secureUrl || uploadResult.url;
    if (!fileUrl) {
      throw new BadRequestError('File upload failed: No secure URL provided.');
    }

    // Archive previous version
    await this.documentRepo.archivePreviousVersions(userId, existing.documentType);

    const rootParentId = existing.parentDocumentId || existing.id;

    return this.documentRepo.create({
      userId,
      documentType: existing.documentType,
      title: existing.title || uploadResult.originalName || String(existing.documentType),
      documentNumber: existing.documentNumber || undefined,
      fileUrl,
      mimeType: uploadResult.mimeType || existing.mimeType || 'application/pdf',
      fileSize: uploadResult.bytes,
      status: VerificationStatus.PENDING,
      version: existing.version + 1,
      isCurrent: true,
      parentDocumentId: rootParentId,
      hash: uploadResult.checksum,
      cloudinaryPublicId: uploadResult.publicId,
    });
  }

  async getDocumentById(
    documentId: string,
    requesterId: string,
    requesterRole: Role
  ): Promise<Document> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document not found.');
    }

    const isOwner = doc.userId === requesterId;
    const isPrivileged = requesterRole === Role.PG_OWNER || requesterRole === Role.ADMIN;

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenError('You are not authorized to view this KYC document.');
    }

    return doc;
  }

  async getVersionHistory(
    documentId: string,
    requesterId: string,
    requesterRole: Role
  ): Promise<Document[]> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document not found.');
    }

    const isOwner = doc.userId === requesterId;
    const isPrivileged = requesterRole === Role.PG_OWNER || requesterRole === Role.ADMIN;

    if (!isOwner && !isPrivileged) {
      throw new ForbiddenError('You are not authorized to view version history for this document.');
    }

    const rootParentId = doc.parentDocumentId || doc.id;
    return this.documentRepo.findVersionHistory(rootParentId);
  }

  async verifyDocument(
    verifierId: string,
    documentId: string,
    data: VerifyDocumentDTO
  ): Promise<Document> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) {
      throw new NotFoundError('Document not found.');
    }

    return this.documentRepo.updateVerification(
      documentId,
      verifierId,
      data.status,
      data.rejectionReason
    );
  }
}
