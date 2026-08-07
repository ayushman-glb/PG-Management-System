import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { DocumentService, DocumentType } from './documents.service';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { prisma } from '../../config/prisma';

export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * Unified download handler — resolves entityId from URL param and document type.
   * Route: GET /api/v1/documents/:entityId/invoice
   *        GET /api/v1/documents/:entityId/receipt
   *        GET /api/v1/documents/:entityId/agreement
   *        GET /api/v1/documents/:entityId/kyc
   *        GET /api/v1/documents/:entityId/refund
   */
  download = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { entityId } = req.params;
    const documentTypeParam = req.params.type ?? req.query.type as string ?? 'INVOICE';
    const documentType = documentTypeParam.toUpperCase() as DocumentType;
    const dispositionType = req.query.inline === '1' ? 'inline' : 'attachment';

    const user = req.user!;
    const { residentId, ownerId } = await this.resolveUserIdentifiers(user.id, user.role);

    const result = await this.documentService.getOrGenerateDocument({
      entityId,
      documentType,
      requestingUserId: user.id,
      requestingUserRole: user.role,
      requestingUserResidentId: residentId,
      requestingUserOwnerId: ownerId,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'],
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('X-Document-Id', result.documentId);
    res.setHeader('X-Document-Key', result.documentKey);
    res.setHeader('X-SHA256-Hash', result.sha256Hash);
    res.setHeader('X-From-Cache', result.fromCache ? '1' : '0');
    res.setHeader('Cache-Control', 'private, no-store');

    return res.send(result.buffer);
  });

  /**
   * Dedicated invoice download — backward compatible with /billing/invoices/:paymentId/download
   */
  downloadInvoice = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    req.params.type = 'INVOICE';
    return this.download(req, res, _next);
  });

  /**
   * Dedicated receipt download — backward compatible with /billing/receipts/:paymentId/download
   */
  downloadReceipt = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    req.params.type = 'PAYMENT_RECEIPT';
    return this.download(req, res, _next);
  });

  /**
   * Dedicated agreement PDF download — backward compatible with /agreements/:id/download
   */
  downloadAgreement = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    req.params.type = 'SIGNED_AGREEMENT';
    return this.download(req, res, _next);
  });

  /**
   * Dedicated KYC document download
   */
  downloadKyc = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    req.params.type = 'KYC_DOCUMENT';
    return this.download(req, res, _next);
  });

  /**
   * Dedicated refund receipt download
   */
  downloadRefund = catchAsync(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    req.params.type = 'REFUND_RECEIPT';
    return this.download(req, res, _next);
  });

  /**
   * Check document status (for polling after 202 response)
   */
  getStatus = catchAsync(async (req: AuthRequest, res: Response) => {
    const { documentKey } = req.params;
    const record = await prisma.generatedDocument.findUnique({ where: { documentKey } });

    if (!record) {
      return ApiResponse.success(res, 'Document not found', { status: 'NOT_FOUND' });
    }

    return ApiResponse.success(res, 'Document status', {
      documentId: record.id,
      documentKey: record.documentKey,
      status: record.status,
      generatedAt: record.generatedAt,
      fileName: record.fileName,
      fileSize: record.fileSize,
    });
  });

  // ─── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Resolve the resident/owner DB ID from the authenticated user ID.
   * These are the IDs used for authorization (not the User.id from JWT).
   */
  private async resolveUserIdentifiers(userId: string, role: string): Promise<{ residentId?: string; ownerId?: string }> {
    if (role === 'RESIDENT') {
      const resident = await prisma.resident.findFirst({ where: { userId } });
      return { residentId: resident?.id };
    }
    if (role === 'OWNER' || role === 'MANAGER') {
      const owner = await prisma.owner.findFirst({ where: { userId } });
      return { ownerId: owner?.id };
    }
    return {};
  }
}
