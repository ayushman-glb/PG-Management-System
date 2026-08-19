import { PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/appError';
import { DocumentRepository, DocumentStatus } from './documents.repository';
import { DocumentStorageService } from '../../services/documents/DocumentStorageService';
import { BasePdfGenerator } from '../../infrastructure/pdf/generators/BasePdfGenerator';
import { InvoicePdfGenerator } from '../../infrastructure/pdf/generators/InvoicePdfGenerator';
import { ReceiptPdfGenerator } from '../../infrastructure/pdf/generators/ReceiptPdfGenerator';
import { AgreementPdfGenerator } from '../../infrastructure/pdf/generators/AgreementPdfGenerator';
import { KycPdfGenerator } from '../../infrastructure/pdf/generators/KycPdfGenerator';
import { RefundReceiptGenerator } from '../../infrastructure/pdf/generators/RefundReceiptGenerator';
import { PdfKitInvoiceService } from '../../infrastructure/pdf/PdfKitInvoiceService';
import { PdfKitAgreementService } from '../../infrastructure/pdf/PdfKitAgreementService';

// ─── Audit event constants ────────────────────────────────────────────────────
export const DOC_EVENTS = {
  GENERATION_STARTED: 'DOCUMENT_GENERATION_STARTED',
  GENERATED: 'DOCUMENT_GENERATED',
  STORAGE_COMPLETED: 'DOCUMENT_STORAGE_COMPLETED',
  DOWNLOAD_REQUESTED: 'DOCUMENT_DOWNLOAD_REQUESTED',
  DOWNLOADED: 'DOCUMENT_DOWNLOADED',
  GENERATION_FAILED: 'DOCUMENT_GENERATION_FAILED',
  STORAGE_MISSING: 'DOCUMENT_STORAGE_MISSING',
  REGENERATED: 'DOCUMENT_REGENERATED',
  CACHE_HIT: 'DOCUMENT_CACHE_HIT',
} as const;

// ─── Supported document types ─────────────────────────────────────────────────
export type DocumentType =
  | 'INVOICE'
  | 'PAYMENT_RECEIPT'
  | 'REFUND_RECEIPT'
  | 'RENT_RECEIPT'
  | 'SECURITY_DEPOSIT_RECEIPT'
  | 'TRANSACTION_RECEIPT'
  | 'LEASE_AGREEMENT'
  | 'SIGNED_AGREEMENT'
  | 'DIGITAL_AGREEMENT'
  | 'KYC_DOCUMENT'
  | 'KYC_VERIFICATION';

export interface DownloadResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  sha256Hash: string;
  documentId: string;
  documentKey: string;
  fromCache: boolean;
}

export interface GetDocumentOptions {
  entityId: string;
  documentType: DocumentType;
  requestingUserId: string;
  requestingUserRole: string;
  requestingUserResidentId?: string;
  requestingUserOwnerId?: string;
  ipAddress?: string;
  userAgent?: string;
  version?: number;
}

export class DocumentService {
  private readonly invoiceGen = new InvoicePdfGenerator();
  private readonly receiptGen = new ReceiptPdfGenerator();
  private readonly agreementGen = new AgreementPdfGenerator();
  private readonly kycGen = new KycPdfGenerator();
  private readonly refundGen = new RefundReceiptGenerator();
  private readonly invoiceSvc = new PdfKitInvoiceService();
  private readonly agreementSvc = new PdfKitAgreementService();

  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly storageService: DocumentStorageService,
    private readonly db: PrismaClient
  ) {}

  /**
   * PRIMARY ENTRY POINT — get or generate a document.
   *
   * Lifecycle:
   * 1. Build deterministic documentKey
   * 2. Find existing record
   * 3. If READY → verify storage → return cached PDF (no regeneration)
   * 4. If GENERATING → return 202 (concurrent request guard)
   * 5. If FAILED/STORAGE_MISSING/missing → reset & regenerate
   * 6. Claim GENERATING state atomically
   * 7. Load source data from DB → create immutable snapshot
   * 8. Generate PDF buffer
   * 9. Validate buffer (must start with %PDF-)
   * 10. Calculate SHA-256 hash
   * 11. Upload to Cloudinary
   * 12. Save metadata → mark READY
   * 13. Return buffer + metadata
   */
  async getOrGenerateDocument(opts: GetDocumentOptions): Promise<DownloadResult> {
    const version = opts.version ?? 1;
    const documentKey = this.buildDocumentKey(opts.documentType, opts.entityId, version);
    const fileName = this.buildFileName(opts.documentType, opts.entityId, version);

    // ── Audit: download requested ─────────────────────────────────────────────
    await this.audit({
      documentKey,
      documentType: opts.documentType,
      userId: opts.requestingUserId,
      action: DOC_EVENTS.DOWNLOAD_REQUESTED,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
    });

    // ── 1. Check for existing document ───────────────────────────────────────
    let record = await this.documentRepo.findByKey(documentKey);

    if (record?.status === 'GENERATING') {
      throw new AppError(
        'Document generation is in progress. Please retry in a few seconds.',
        202,
        'DOCUMENT_GENERATION_IN_PROGRESS'
      );
    }

    if (record?.status === 'READY' && record.storagePublicId) {
      // ── 2. CACHE HIT — verify storage still exists ───────────────────────
      const exists = await this.storageService.verifyAssetExists(record.storagePublicId);

      if (exists) {
        // ── 3. Return cached PDF ───────────────────────────────────────────
        await this.audit({
          documentId: record.id,
          documentKey,
          documentType: opts.documentType,
          userId: opts.requestingUserId,
          action: DOC_EVENTS.CACHE_HIT,
          ipAddress: opts.ipAddress,
        });

        const buffer = await this.storageService.downloadBuffer(record.storagePublicId);

        await this.audit({
          documentId: record.id,
          documentKey,
          documentType: opts.documentType,
          userId: opts.requestingUserId,
          action: DOC_EVENTS.DOWNLOADED,
          ipAddress: opts.ipAddress,
        });

        return {
          buffer,
          fileName: record.fileName,
          mimeType: record.mimeType,
          sha256Hash: record.sha256Hash ?? '',
          documentId: record.id,
          documentKey: record.documentKey,
          fromCache: true,
        };
      }

      // Storage asset missing — mark and recover
      await this.documentRepo.markStorageMissing(documentKey);
      await this.audit({
        documentId: record.id,
        documentKey,
        documentType: opts.documentType,
        userId: opts.requestingUserId,
        action: DOC_EVENTS.STORAGE_MISSING,
        ipAddress: opts.ipAddress,
      });
    }

    // ── 4. Reset FAILED/STORAGE_MISSING to PENDING for retry ─────────────────
    if (record?.status === 'FAILED' || record?.status === 'STORAGE_MISSING') {
      await this.documentRepo.resetToPending(documentKey);
      record = await this.documentRepo.findByKey(documentKey);
    }

    // ── 5. Create record if not yet exists ────────────────────────────────────
    if (!record) {
      const sourceData = await this.loadSourceData(opts.documentType, opts.entityId);
      await this.authorizeAccess(opts, sourceData);

      const { record: newRecord } = await this.documentRepo.findOrCreate({
        documentKey,
        documentType: opts.documentType,
        entityType: this.getEntityType(opts.documentType),
        entityId: opts.entityId,
        ownerId: sourceData.ownerId,
        residentId: sourceData.residentId,
        fileName,
        version,
        status: 'PENDING',
        sourceSnapshot: JSON.stringify(sourceData.snapshot),
      });
      record = newRecord;
    } else {
      const sourceData = await this.loadSourceData(opts.documentType, opts.entityId);
      await this.authorizeAccess(opts, sourceData);
    }

    // ── 6. Atomic claim: PENDING → GENERATING ────────────────────────────────
    const claimed = await this.documentRepo.tryClaimGenerating(documentKey);
    if (!claimed) {
      // Another concurrent request already claimed generation
      throw new AppError(
        'Document generation is in progress. Please retry in a few seconds.',
        202,
        'DOCUMENT_GENERATION_IN_PROGRESS'
      );
    }

    // ── 7. Generate PDF ───────────────────────────────────────────────────────
    await this.audit({
      documentId: record!.id,
      documentKey,
      documentType: opts.documentType,
      userId: opts.requestingUserId,
      action: DOC_EVENTS.GENERATION_STARTED,
      ipAddress: opts.ipAddress,
    });

    let pdfBuffer: Buffer;
    try {
      const sourceData = await this.loadSourceData(opts.documentType, opts.entityId);
      pdfBuffer = await this.generatePdf(opts.documentType, sourceData.snapshot);
    } catch (genErr: any) {
      await this.documentRepo.markFailed(documentKey);
      await this.audit({
        documentId: record!.id,
        documentKey,
        documentType: opts.documentType,
        userId: opts.requestingUserId,
        action: DOC_EVENTS.GENERATION_FAILED,
        success: false,
        errorMessage: genErr.message,
      });
      throw new AppError(`PDF_GENERATION_FAILED: ${genErr.message}`, 500, 'PDF_GENERATION_FAILED');
    }

    // ── 8. Validate PDF buffer ────────────────────────────────────────────────
    if (!BasePdfGenerator.validatePdfBuffer(pdfBuffer)) {
      await this.documentRepo.markFailed(documentKey);
      throw new AppError('PDF_GENERATION_FAILED: Generated buffer is not a valid PDF', 500, 'PDF_GENERATION_FAILED');
    }

    await this.audit({
      documentId: record!.id,
      documentKey,
      documentType: opts.documentType,
      userId: opts.requestingUserId,
      action: DOC_EVENTS.GENERATED,
    });

    // ── 9. Calculate SHA-256 hash ─────────────────────────────────────────────
    const sha256Hash = BasePdfGenerator.sha256(pdfBuffer);

    // ── 10. Upload to Cloudinary ──────────────────────────────────────────────
    let uploadResult;
    try {
      const folder = DocumentStorageService.buildFolder(opts.documentType);
      const publicIdSuffix = DocumentStorageService.buildPublicId(
        this.getEntityType(opts.documentType),
        opts.entityId,
        version
      );
      uploadResult = await this.storageService.uploadPdf(pdfBuffer, publicIdSuffix, folder);
    } catch (storeErr: any) {
      // Upload failed — mark failed, do not set READY
      await this.documentRepo.markFailed(documentKey);
      await this.audit({
        documentId: record!.id,
        documentKey,
        documentType: opts.documentType,
        userId: opts.requestingUserId,
        action: DOC_EVENTS.GENERATION_FAILED,
        success: false,
        errorMessage: `Storage upload failed: ${storeErr.message}`,
      });
      throw new AppError(`PDF_STORAGE_FAILED: ${storeErr.message}`, 500, 'PDF_STORAGE_FAILED');
    }

    // ── 11. Mark READY — only after successful upload ─────────────────────────
    const finalRecord = await this.documentRepo.markReady(documentKey, {
      storagePublicId: uploadResult.publicId,
      storageUrl: uploadResult.storageUrl,
      fileSize: uploadResult.fileSize,
      sha256Hash,
      generatedAt: new Date(),
    });

    await this.audit({
      documentId: finalRecord.id,
      documentKey,
      documentType: opts.documentType,
      userId: opts.requestingUserId,
      action: DOC_EVENTS.STORAGE_COMPLETED,
    });
    await this.audit({
      documentId: finalRecord.id,
      documentKey,
      documentType: opts.documentType,
      userId: opts.requestingUserId,
      action: DOC_EVENTS.DOWNLOADED,
      ipAddress: opts.ipAddress,
    });

    return {
      buffer: pdfBuffer,
      fileName,
      mimeType: 'application/pdf',
      sha256Hash,
      documentId: finalRecord.id,
      documentKey,
      fromCache: false,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private buildDocumentKey(documentType: string, entityId: string, version: number): string {
    return `${documentType}:${this.getEntityType(documentType)}:${entityId}:v${version}`;
  }

  private buildFileName(documentType: string, entityId: string, version: number): string {
    const safeId = entityId.slice(-8).toUpperCase();
    const fileMap: Record<string, string> = {
      INVOICE: `RoomBae-Invoice-${safeId}-v${version}.pdf`,
      PAYMENT_RECEIPT: `RoomBae-Payment-Receipt-${safeId}-v${version}.pdf`,
      RENT_RECEIPT: `RoomBae-Rent-Receipt-${safeId}-v${version}.pdf`,
      REFUND_RECEIPT: `RoomBae-Refund-Receipt-${safeId}-v${version}.pdf`,
      SECURITY_DEPOSIT_RECEIPT: `RoomBae-Security-Deposit-${safeId}-v${version}.pdf`,
      TRANSACTION_RECEIPT: `RoomBae-Transaction-${safeId}-v${version}.pdf`,
      LEASE_AGREEMENT: `RoomBae-Lease-Agreement-${safeId}-v${version}.pdf`,
      SIGNED_AGREEMENT: `RoomBae-Signed-Agreement-${safeId}-v${version}.pdf`,
      DIGITAL_AGREEMENT: `RoomBae-Digital-Agreement-${safeId}-v${version}.pdf`,
      KYC_DOCUMENT: `RoomBae-KYC-${safeId}-v${version}.pdf`,
      KYC_VERIFICATION: `RoomBae-KYC-Verification-${safeId}-v${version}.pdf`,
    };
    return fileMap[documentType] ?? `RoomBae-Document-${safeId}-v${version}.pdf`;
  }

  private getEntityType(documentType: string): string {
    const map: Record<string, string> = {
      INVOICE: 'payment',
      PAYMENT_RECEIPT: 'payment',
      RENT_RECEIPT: 'payment',
      REFUND_RECEIPT: 'refund',
      SECURITY_DEPOSIT_RECEIPT: 'payment',
      TRANSACTION_RECEIPT: 'payment',
      LEASE_AGREEMENT: 'agreement',
      SIGNED_AGREEMENT: 'agreement',
      DIGITAL_AGREEMENT: 'agreement',
      KYC_DOCUMENT: 'resident',
      KYC_VERIFICATION: 'resident',
    };
    return map[documentType] ?? 'entity';
  }

  /**
   * Load source data from the database and create an immutable snapshot.
   * PDF generators read from the snapshot — NOT from live DB on every click.
   */
  private async loadSourceData(documentType: string, entityId: string): Promise<{
    snapshot: any;
    ownerId?: string;
    residentId?: string;
  }> {
    switch (documentType) {
      case 'INVOICE':
      case 'PAYMENT_RECEIPT':
      case 'RENT_RECEIPT':
      case 'TRANSACTION_RECEIPT':
      case 'SECURITY_DEPOSIT_RECEIPT': {
        const payment = await this.db.payment.findUnique({
          where: { id: entityId },
          include: {
            resident: { include: { user: true, bed: { include: { room: true } } } },
            pg: { include: { owner: true } },
          },
        });
        if (!payment) throw new AppError('SOURCE_DATA_NOT_FOUND: Payment not found', 404, 'SOURCE_DATA_NOT_FOUND');
        return {
          snapshot: payment,
          ownerId: payment.pg?.owner?.id,
          residentId: payment.residentId,
        };
      }

      case 'REFUND_RECEIPT': {
        // For refunds, entityId is the paymentId (we treat refund as payment with REFUNDED status)
        const payment = await this.db.payment.findUnique({
          where: { id: entityId },
          include: {
            resident: { include: { user: true } },
            pg: { include: { owner: true } },
          },
        });
        if (!payment) throw new AppError('SOURCE_DATA_NOT_FOUND: Refund payment not found', 404, 'SOURCE_DATA_NOT_FOUND');
        return {
          snapshot: payment,
          ownerId: payment.pg?.owner?.id,
          residentId: payment.residentId,
        };
      }

      case 'LEASE_AGREEMENT':
      case 'SIGNED_AGREEMENT':
      case 'DIGITAL_AGREEMENT': {
        const agreement = await this.db.agreement.findUnique({
          where: { id: entityId },
          include: {
            resident: { include: { user: true } },
            owner: { include: { user: true } },
            pg: true,
            signatures: true,
            versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
          },
        });
        if (!agreement) throw new AppError('SOURCE_DATA_NOT_FOUND: Agreement not found', 404, 'SOURCE_DATA_NOT_FOUND');
        return {
          snapshot: agreement,
          ownerId: agreement.ownerId,
          residentId: agreement.residentId,
        };
      }

      case 'KYC_DOCUMENT':
      case 'KYC_VERIFICATION': {
        const resident = await this.db.resident.findUnique({
          where: { id: entityId },
          include: {
            user: true,
            documents: true,
            pg: true,
            bed: { include: { room: true } },
            emergencyContact: true,
          },
        });
        if (!resident) throw new AppError('SOURCE_DATA_NOT_FOUND: Resident not found', 404, 'SOURCE_DATA_NOT_FOUND');
        return {
          snapshot: resident,
          ownerId: undefined,
          residentId: resident.id,
        };
      }

      default:
        throw new AppError(`INVALID_DOCUMENT_TYPE: ${documentType}`, 400, 'INVALID_DOCUMENT_TYPE');
    }
  }

  /**
   * Route to the correct PDF generator for a given document type.
   * Each generator takes the snapshot (not live DB data) and returns a Buffer.
   */
  private async generatePdf(documentType: string, snapshot: any): Promise<Buffer> {
    switch (documentType) {
      case 'INVOICE':
      case 'RENT_RECEIPT':
      case 'SECURITY_DEPOSIT_RECEIPT':
      case 'TRANSACTION_RECEIPT':
        return this.invoiceSvc.generateInvoicePdfBuffer(snapshot);

      case 'PAYMENT_RECEIPT':
        return this.invoiceSvc.generateReceiptPdfBuffer(snapshot);

      case 'REFUND_RECEIPT': {
        const pg = snapshot.pg ?? {};
        const resident = snapshot.resident ?? {};
        const resUser = resident.user ?? {};
        return this.refundGen.generate({
          refundRef: `RFD-${(snapshot.razorpayPaymentId ?? snapshot.id ?? 'N/A').slice(-8).toUpperCase()}`,
          refundDate: snapshot.updatedAt ?? snapshot.paymentDate ?? new Date(),
          refundStatus: snapshot.status === 'REFUNDED' ? 'PROCESSED' : snapshot.status ?? 'PENDING',
          refundReason: 'Deposit / Rent Refund',
          originalReceiptNumber: snapshot.invoiceNumber,
          originalTransactionRef: snapshot.razorpayPaymentId,
          originalRazorpayPaymentId: snapshot.razorpayPaymentId,
          originalPaymentDate: snapshot.paymentDate,
          residentName: resUser.name ?? resident.name ?? 'Resident',
          residentCode: resUser.residentCode ?? resident.residentCode,
          residentPhone: resUser.phone ?? resident.phone,
          residentEmail: resUser.email ?? resident.email,
          pgName: pg.name,
          pgCity: pg.city,
          originalAmount: Number(snapshot.totalAmount ?? 0),
          refundedAmount: Number(snapshot.totalAmount ?? 0),
          refundMethod: snapshot.paymentMethod ?? 'ORIGINAL_METHOD',
        });
      }

      case 'LEASE_AGREEMENT':
      case 'SIGNED_AGREEMENT':
      case 'DIGITAL_AGREEMENT':
        return this.agreementSvc.generateAgreementPdfBuffer(snapshot);

      case 'KYC_DOCUMENT':
      case 'KYC_VERIFICATION': {
        const resident = snapshot;
        const user = resident.user ?? {};
        const pg = resident.pg ?? {};
        const bed = resident.bed ?? {};
        const room = bed.room ?? {};
        return this.kycGen.generate({
          verificationRef: `KYC-${resident.id.slice(-8).toUpperCase()}`,
          verificationDate: resident.updatedAt ?? resident.createdAt ?? new Date(),
          verificationStatus: resident.documents?.every((d: any) => d.isVerified) ? 'VERIFIED' : 'PENDING',
          residentName: user.name ?? resident.name ?? 'Resident',
          residentCode: user.residentCode ?? resident.residentCode ?? 'N/A',
          residentEmail: user.email ?? resident.email,
          residentPhone: user.phone ?? resident.phone,
          residentAddress: resident.permanentAddress,
          residentOccupation: resident.occupation,
          residentGender: resident.gender,
          residentAge: resident.age,
          bloodGroup: resident.bloodGroup,
          documents: (resident.documents ?? []).map((d: any) => ({
            documentType: d.documentType,
            documentNumber: d.documentNumber ?? '****',
            isVerified: d.isVerified ?? false,
            uploadedAt: d.createdAt,
          })),
          pgName: pg.name,
          pgAddress: pg.address,
          pgCity: pg.city,
          roomNumber: room.roomNumber,
          bedNumber: bed.bedNumber,
          emergencyContactName: resident.emergencyContact?.name,
          emergencyContactRelation: resident.emergencyContact?.relation,
          emergencyContactPhone: resident.emergencyContact?.phone,
        });
      }

      default:
        throw new AppError(`INVALID_DOCUMENT_TYPE: ${documentType}`, 400, 'INVALID_DOCUMENT_TYPE');
    }
  }

  /**
   * Authorization enforcement: verify the requesting user is allowed to access this document.
   *
   * RESIDENT: may only access their own documents (residentId must match)
   * OWNER: may access documents of residents in their PGs (ownerId must match)
   * ADMIN/SUPER_ADMIN: unrestricted
   */
  private async authorizeAccess(opts: GetDocumentOptions, sourceData: { ownerId?: string; residentId?: string }) {
    const { requestingUserRole, requestingUserResidentId, requestingUserOwnerId } = opts;

    if (requestingUserRole === 'SUPER_ADMIN' || requestingUserRole === 'ADMIN') {
      return; // Full access
    }

    if (requestingUserRole === 'RESIDENT') {
      if (!requestingUserResidentId || sourceData.residentId !== requestingUserResidentId) {
        throw new AppError('DOCUMENT_ACCESS_DENIED: You are not authorized to access this document.', 403, 'DOCUMENT_ACCESS_DENIED');
      }
      return;
    }

    if (requestingUserRole === 'OWNER' || requestingUserRole === 'MANAGER') {
      if (!requestingUserOwnerId || sourceData.ownerId !== requestingUserOwnerId) {
        throw new AppError('DOCUMENT_ACCESS_DENIED: You are not authorized to access this document.', 403, 'DOCUMENT_ACCESS_DENIED');
      }
      return;
    }

    throw new AppError('DOCUMENT_ACCESS_DENIED: Insufficient role for document access.', 403, 'DOCUMENT_ACCESS_DENIED');
  }

  private async audit(data: {
    documentId?: string;
    documentKey?: string;
    documentType: string;
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.documentRepo.logAuditEvent(data);
    } catch {
      // Audit logging must never throw — it is observability only
    }
  }

  async getDocumentRecordByKey(documentKey: string) {
    return this.documentRepo.findByKey(documentKey);
  }

  async resolveUserIdentifiers(userId: string, role: string): Promise<{ residentId?: string; ownerId?: string }> {
    if (role === 'RESIDENT') {
      const resident = await this.documentRepo.findResidentByUserId(userId);
      return { residentId: resident?.id };
    }
    if (role === 'OWNER' || role === 'MANAGER') {
      const owner = await this.documentRepo.findOwnerByUserId(userId);
      return { ownerId: owner?.id };
    }
    return {};
  }
}
