import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authMiddleware';
import { ApiResponse } from '../../utils/apiResponse';
import { catchAsync } from '../../utils/appError';
import { paymentService } from './payment.service';
import { Container } from '../../container';

export class PaymentController {
  constructor(private readonly service = paymentService) {}

  /**
   * POST /api/v1/payments/create-order
   */
  createOrder = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId, baseAmount, isInterstate, itemCategory, description, dueDate, roomId, bookingId } = req.body;
    
    // If residentId not provided, fallback to logged-in user's resident profile
    let targetResidentId = residentId;
    if (!targetResidentId && req.user?.role === 'RESIDENT') {
      const resident = await Container.db.resident.findFirst({ where: { userId: req.user.id } });
      targetResidentId = resident?.id;
    }

    const order = await this.service.createOrder({
      residentId: targetResidentId,
      baseAmount: Number(baseAmount),
      isInterstate: Boolean(isInterstate),
      itemCategory,
      description,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      roomId,
      bookingId,
    });

    return ApiResponse.success(res, 'Razorpay payment order created successfully', order, undefined, 201);
  });

  /**
   * POST /api/v1/payments/verify
   */
  verifyPayment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';

    const result = await this.service.verifyPayment({
      paymentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      clientIp,
    });

    return ApiResponse.success(res, result.message, result);
  });

  /**
   * POST /api/v1/payments/webhook
   * (Public endpoint - verified via Razorpay HMAC signature)
   */
  handleWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const result = await this.service.handleWebhook(req.body, signature);
    return ApiResponse.success(res, 'Webhook event processed', result);
  });

  /**
   * GET /api/v1/payments/history
   */
  getPaymentHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const { residentId, pgId, status, search, startDate, endDate, page, limit } = req.query;
    const user = req.user!;

    let targetResidentId = residentId as string | undefined;
    let targetOwnerId: string | undefined = undefined;

    if (user.role === 'RESIDENT') {
      const resident = await Container.db.resident.findFirst({ where: { userId: user.id } });
      targetResidentId = resident?.id;
    } else if (user.role === 'OWNER' || user.role === 'MANAGER') {
      const owner = await Container.db.owner.findFirst({ where: { userId: user.id } });
      targetOwnerId = owner?.id;
    }

    const history = await this.service.getPaymentHistory({
      residentId: targetResidentId,
      ownerId: targetOwnerId,
      pgId: pgId as string | undefined,
      status: status as any,
      search: search as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return ApiResponse.success(res, 'Payment history retrieved successfully', history);
  });

  /**
   * GET /api/v1/payments/analytics
   */
  getPaymentAnalytics = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    let ownerId: string | undefined = req.query.ownerId as string | undefined;
    const pgId = req.query.pgId as string | undefined;

    if (user.role === 'OWNER' || user.role === 'MANAGER') {
      const owner = await Container.db.owner.findFirst({ where: { userId: user.id } });
      ownerId = owner?.id;
    }

    const analytics = await this.service.getPaymentAnalytics(ownerId, pgId);
    return ApiResponse.success(res, 'Payment analytics calculated successfully', analytics);
  });

  /**
   * GET /api/v1/payments/:id
   */
  getPaymentById = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const payment = await this.service.getPaymentById(id);
    return ApiResponse.success(res, 'Payment details retrieved', payment);
  });

  /**
   * GET /api/v1/payments/:id/invoice
   */
  getPaymentInvoice = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const disposition = req.query.disposition === 'inline' ? 'inline' : 'attachment';

    const result = await Container.documentService.getOrGenerateDocument({
      entityId: id,
      documentType: 'INVOICE',
      requestingUserId: user.id,
      requestingUserRole: user.role,
      ipAddress: req.ip ?? 'unknown',
      userAgent: req.headers['user-agent'],
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('X-Document-Id', result.documentId);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(result.buffer);
  });

  /**
   * POST /api/v1/payments/:id/refund
   */
  processRefund = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const result = await this.service.processRefund({
      paymentId: id,
      amount: amount ? Number(amount) : undefined,
      reason,
    });

    return ApiResponse.success(res, 'Refund processed successfully', result);
  });

  /**
   * GET /api/v1/payments/export/csv
   */
  exportPaymentsCsv = catchAsync(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    let targetOwnerId: string | undefined = undefined;

    if (user.role === 'OWNER' || user.role === 'MANAGER') {
      const owner = await Container.db.owner.findFirst({ where: { userId: user.id } });
      targetOwnerId = owner?.id;
    }

    const csvContent = await this.service.exportPaymentsCsv({
      ...req.query,
      ownerId: targetOwnerId,
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roombae-payments-${Date.now()}.csv"`);
    return res.send(csvContent);
  });

  /**
   * DELETE /api/v1/payments/:id
   */
  deletePayment = catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await this.service.deletePayment(id);
    return ApiResponse.success(res, 'Payment record deleted successfully');
  });
}

export const paymentController = new PaymentController();
export default paymentController;
