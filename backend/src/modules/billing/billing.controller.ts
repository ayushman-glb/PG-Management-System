import { Response, NextFunction } from 'express';
import { IBillingService } from '../../interfaces/services/IBillingService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';
import { prisma } from '../../config/prisma';

export class BillingController {
  constructor(private readonly billingService: IBillingService) {}

  createOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId, baseAmount, isInterstate } = req.body;
    const order = await this.billingService.createPaymentOrder(
      residentId,
      baseAmount,
      isInterstate,
    );
    return ApiResponse.success(res, 'Razorpay order created', order, undefined, 201);
  });

  verifyPayment = catchAsync(async (req: AuthRequest, res: Response) => {
    const clientIp = req.ip || 'unknown';
    const updatedPayment = await this.billingService.verifyPayment({ ...req.body, clientIp });
    return ApiResponse.success(res, 'Payment verified and rent recorded', updatedPayment);
  });

  /**
   * GET /billing/invoices/:paymentId/download
   * Backward-compatible — now delegates to DocumentService for caching/storage.
   */
  getInvoicePdf = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;
    const user = req.user!;
    const dispositionType = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    const { residentId, ownerId } = await resolveUserIdentifiers(user.id, user.role);

    const result = await Container.documentService.getOrGenerateDocument({
      entityId: paymentId,
      documentType: 'INVOICE',
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
    res.setHeader('X-SHA256-Hash', result.sha256Hash);
    res.setHeader('X-From-Cache', result.fromCache ? '1' : '0');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(result.buffer);
  });

  /**
   * GET /billing/receipts/:paymentId/download
   * Distinct from invoice — uses PAYMENT_RECEIPT type.
   */
  getReceiptPdf = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { paymentId } = req.params;
    const user = req.user!;
    const dispositionType = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    const { residentId, ownerId } = await resolveUserIdentifiers(user.id, user.role);

    const result = await Container.documentService.getOrGenerateDocument({
      entityId: paymentId,
      documentType: 'PAYMENT_RECEIPT',
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
    res.setHeader('X-SHA256-Hash', result.sha256Hash);
    res.setHeader('X-From-Cache', result.fromCache ? '1' : '0');
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(result.buffer);
  });

  processRefund = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentId, amount, reason } = req.body;
    const result = await this.billingService.processRefund(paymentId, amount, reason);
    return ApiResponse.success(res, 'Refund processed successfully', result);
  });

  handleWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const result = await this.billingService.handleWebhook(req.body, signature);
    return ApiResponse.success(res, 'Webhook processed', result);
  });

  getAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const ownerId = req.query.ownerId as string | undefined;
    const analytics = await this.billingService.getPaymentAnalytics(ownerId);
    return ApiResponse.success(res, 'Payment analytics retrieved', analytics);
  });
}

async function resolveUserIdentifiers(userId: string, role: string) {
  if (role === 'RESIDENT') {
    const resident = await prisma.resident.findFirst({ where: { userId } });
    return { residentId: resident?.id, ownerId: undefined };
  }
  if (role === 'OWNER' || role === 'MANAGER') {
    const owner = await prisma.owner.findFirst({ where: { userId } });
    return { residentId: undefined, ownerId: owner?.id };
  }
  return { residentId: undefined, ownerId: undefined };
}
