import { Response, NextFunction } from 'express';
import { IBillingService } from '../../interfaces/services/IBillingService';
import { catchAsync } from '../../utils/appError';
import { ApiResponse } from '../../utils/apiResponse';
import { AuthRequest } from '../../middleware/authMiddleware';
import { Container } from '../../container';
import { prisma } from '../../config/prisma';
import { Role } from '@prisma/client';

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

  sendReceipt = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentId, email } = req.body;
    const payment = await Container.db.payment.findUnique({
      where: { id: paymentId },
      include: {
        resident: {
          include: {
            user: true,
            pg: true,
            bed: { include: { room: true } },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const targetEmail = email || payment.resident?.email || payment.resident?.user?.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const { emailService } = await import('../email');
    const invoiceNum = (payment as any).invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    await emailService.sendPaymentReceiptEmail({
      email: targetEmail,
      name: payment.resident?.name || payment.resident?.user?.name || 'Resident',
      invoiceNumber: invoiceNum,
      amount: payment.totalAmount,
      paymentDate: payment.createdAt,
      paymentMethod: (payment as any).paymentMethod || 'Razorpay Online',
      transactionId: (payment as any).razorpayPaymentId || payment.id,
      propertyName: payment.resident?.pg?.name,
      roomNumber: payment.resident?.bed?.room?.roomNumber,
    });

    return ApiResponse.success(res, 'Payment receipt email dispatched', { email: targetEmail, paymentId });
  });

  sendInvoice = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentId, email } = req.body;
    const payment = await Container.db.payment.findUnique({
      where: { id: paymentId },
      include: {
        resident: {
          include: {
            user: true,
            pg: true,
            bed: { include: { room: true } },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment invoice not found' });
    }

    const targetEmail = email || payment.resident?.email || payment.resident?.user?.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const { emailService } = await import('../email');
    const invoiceNum = (payment as any).invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    
    // Generate PDF buffer
    let pdfBuffer: Buffer | undefined;
    try {
      const docResult = await Container.documentService.getOrGenerateDocument({
        entityId: paymentId,
        documentType: 'INVOICE',
        requestingUserId: req.user?.id || 'SYSTEM',
        requestingUserRole: req.user?.role || 'ADMIN',
        ipAddress: req.ip ?? 'unknown',
      });
      pdfBuffer = docResult.buffer;
    } catch {}

    await emailService.sendInvoiceEmail({
      email: targetEmail,
      name: payment.resident?.name || payment.resident?.user?.name || 'Resident',
      invoiceNumber: invoiceNum,
      dueDate: (payment as any).dueDate || payment.createdAt,
      totalAmount: payment.totalAmount,
      breakdown: {
        baseRent: payment.baseAmount,
        cgst: (payment as any).cgst || 0,
        sgst: (payment as any).sgst || 0,
      },
      pdfBuffer,
      propertyName: payment.resident?.pg?.name,
      roomNumber: payment.resident?.bed?.room?.roomNumber,
    });

    return ApiResponse.success(res, 'Rental invoice email dispatched with PDF attachment', { email: targetEmail, paymentId });
  });

  handleWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const result = await this.billingService.handleWebhook(req.body, signature);
    return ApiResponse.success(res, 'Webhook processed', result);
  });

  getAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;
    let ownerId: string | undefined;

    if (role === Role.GOD || role === Role.ADMIN) {
      // Admins can optionally scope to a specific owner via query param
      ownerId = req.query.ownerId as string | undefined;
    } else if (role === Role.OWNER || role === Role.MANAGER) {
      // OWNER: derive their own ownerId — never trust the client-supplied value
      const owner = await Container.db.owner.findFirst({ where: { userId: req.user!.id }, select: { id: true } });
      ownerId = owner?.id;
    }

    const analytics = await this.billingService.getPaymentAnalytics(ownerId);
    return ApiResponse.success(res, 'Payment analytics retrieved', analytics);
  });

  getPayments = catchAsync(async (req: AuthRequest, res: Response) => {
    const { pgId, status } = req.query;
    const role = req.user?.role;
    const where: any = {};

    if (role === Role.GOD || role === Role.ADMIN) {
      // Admins can filter by any pgId or see all
      if (pgId) where.pgId = pgId as string;
    } else if (role === Role.OWNER || role === Role.MANAGER) {
      // OWNER: resolve their authorized PG IDs from JWT user
      const owner = await Container.db.owner.findFirst({ where: { userId: req.user!.id }, select: { id: true } });
      if (!owner) return ApiResponse.error(res, 'Owner profile not found', [], 404);
      const ownerPgs = await Container.db.pG.findMany({ where: { ownerId: owner.id }, select: { id: true } });
      const ownerPgIds = ownerPgs.map((p: any) => p.id);

      if (pgId && !ownerPgIds.includes(pgId as string)) {
        return ApiResponse.error(res, 'Forbidden: you do not own the requested property', [], 403, 'FORBIDDEN');
      }
      // Scope to only their PG IDs
      where.pgId = pgId ? (pgId as string) : { in: ownerPgIds };
    } else {
      // RESIDENT: only see their own payments
      const resident = await Container.db.resident.findFirst({ where: { userId: req.user!.id }, select: { id: true } });
      if (!resident) return ApiResponse.error(res, 'Resident profile not found', [], 404);
      where.residentId = resident.id;
    }

    if (status) where.status = status as string;
    const payments = await Container.db.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
    return ApiResponse.success(res, 'Payments retrieved', payments);
  });

  getFineRules = catchAsync(async (req: AuthRequest, res: Response) => {
    const pgId = req.query.pgId as string;
    const rules = await Container.db.fineRule.findMany({ where: { pgId, isActive: true } });
    return ApiResponse.success(res, 'Fine rules retrieved', rules);
  });

  getResidentFines = catchAsync(async (req: AuthRequest, res: Response) => {
    const role = req.user?.role;
    let residentId = req.params.residentId || (req.query.residentId as string);

    if (role === Role.RESIDENT) {
      // RESIDENT: can only view their own fines — derive residentId from JWT
      const resident = await Container.db.resident.findFirst({ where: { userId: req.user!.id }, select: { id: true } });
      if (!resident) return ApiResponse.error(res, 'Resident profile not found', [], 404);
      residentId = resident.id; // Override any client-supplied ID
    } else if (role === Role.OWNER || role === Role.MANAGER) {
      // OWNER: verify the target resident belongs to one of their PGs
      if (residentId) {
        const resident = await Container.db.resident.findUnique({ where: { id: residentId }, select: { pgId: true } });
        if (resident?.pgId) {
          const owner = await Container.db.owner.findFirst({ where: { userId: req.user!.id }, select: { id: true } });
          const ownerPgs = owner ? await Container.db.pG.findMany({ where: { ownerId: owner.id }, select: { id: true } }) : [];
          const ownerPgIds = ownerPgs.map((p: any) => p.id);
          if (!ownerPgIds.includes(resident.pgId)) {
            return ApiResponse.error(res, 'Forbidden: resident does not belong to your property', [], 403, 'FORBIDDEN');
          }
        }
      }
    }
    // SUPER_ADMIN/ADMIN: no additional scoping

    const fines = await Container.db.fine.findMany({ where: { residentId }, orderBy: { createdAt: 'desc' } });
    return ApiResponse.success(res, 'Resident fines retrieved', fines);
  });

  createFineRule = catchAsync(async (req: AuthRequest, res: Response) => {
    const rule = await Container.db.fineRule.create({ data: req.body });
    return ApiResponse.success(res, 'Fine rule created', rule, undefined, 201);
  });

  issueFine = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId, fineType, amount, reason, dueDate } = req.body;
    const fine = await Container.db.fine.create({
      data: {
        residentId,
        fineType,
        amount,
        reason,
        dueDate: new Date(dueDate),
        status: 'UNPAID'
      }
    });
    return ApiResponse.success(res, 'Fine issued', fine, undefined, 201);
  });

  waiveFine = catchAsync(async (req: AuthRequest, res: Response) => {
    const { fineId } = req.params;
    const ownerId = req.user?.id || req.body.ownerId;
    const fine = await Container.db.fine.update({
      where: { id: fineId },
      data: { status: 'WAIVED', waivedBy: ownerId, waivedAt: new Date() }
    });
    return ApiResponse.success(res, 'Fine waived', fine);
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
