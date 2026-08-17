import crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';
import { PaymentService } from '../../modules/payments/payment.service';
import { env } from '../../config/env';

describe('Payment Subsystem Core & Razorpay Verification Suite', () => {
  let paymentService: PaymentService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      resident: {
        findUnique: jest.fn(),
      },
      pG: {
        findMany: jest.fn(),
      },
      bed: {
        update: jest.fn().mockResolvedValue({ id: 'bed_123', isOccupied: true }),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      invoice: {
        upsert: jest.fn().mockResolvedValue({ id: 'inv_123' }),
      },
      paymentWebhookLog: {
        create: jest.fn().mockResolvedValue({ id: 'log_123' }),
      },
    };

    paymentService = new PaymentService();
    (paymentService as any).db = mockDb;
  });

  describe('1. Create Payment Order', () => {
    it('should calculate CGST (9%) and SGST (9%) correctly and create pending payment', async () => {
      const mockResident = {
        id: 'res_123',
        name: 'Ayushman Mishra',
        email: 'ayushman@globussoft.in',
        pgId: 'pg_123',
        pg: { id: 'pg_123', name: 'RoomBae Luxury PG', ownerId: 'owner_123' },
        bed: { id: 'bed_123', roomId: 'room_123' },
      };
      mockDb.resident.findUnique.mockResolvedValue(mockResident);
      mockDb.payment.create.mockImplementation(({ data }: any) => ({
        id: 'pay_db_123',
        ...data,
      }));

      const result = await paymentService.createOrder({
        residentId: 'res_123',
        baseAmount: 10000,
        isInterstate: false,
        itemCategory: 'Monthly Rent',
      });

      expect(result.baseAmount).toBe(10000);
      expect(result.cgstAmount).toBe(900);
      expect(result.sgstAmount).toBe(900);
      expect(result.totalAmount).toBe(11800);
      expect(result.currency).toBe('INR');
      expect(result.invoiceNumber).toMatch(/^INV-2026-/);
      expect(result.receiptNumber).toMatch(/^REC-2026-/);
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should reject payment creation when base amount is invalid', async () => {
      await expect(
        paymentService.createOrder({
          residentId: 'res_123',
          baseAmount: 0,
        })
      ).rejects.toThrow('Valid payment base amount is required');
    });
  });

  describe('2. Verify Razorpay Payment & Signature', () => {
    it('should successfully verify valid HMAC SHA256 signature and mark payment PAID', async () => {
      const orderId = 'order_rb_123';
      const paymentId = 'pay_rzp_999';
      const secret = env.RAZORPAY_KEY_SECRET || 'mock_secret';
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const mockPayment = {
        id: 'pay_db_123',
        residentId: 'res_123',
        pgId: 'pg_123',
        orderId,
        razorpayOrderId: orderId,
        invoiceNumber: 'INV-2026-112233',
        receiptNumber: 'REC-2026-112233',
        baseAmount: 10000,
        cgstAmount: 900,
        sgstAmount: 900,
        igstAmount: 0,
        totalAmount: 11800,
        status: PaymentStatus.PENDING,
        resident: {
          id: 'res_123',
          name: 'Ayushman Mishra',
          email: 'ayushman@globussoft.in',
          bedId: 'bed_123',
          pg: { name: 'RoomBae Koramangala' },
          bed: { room: { roomNumber: '302-A' } },
        },
      };

      mockDb.payment.findFirst.mockResolvedValue(mockPayment);
      mockDb.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PAID,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      const result = await paymentService.verifyPayment({
        paymentId: 'pay_db_123',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.invoiceNumber).toBe('INV-2026-112233');
      expect(result.amount).toBe(11800);
      expect(mockDb.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay_db_123' },
          data: expect.objectContaining({ status: PaymentStatus.PAID }),
        })
      );
    });

    it('should reject tampered signature and mark payment FAILED', async () => {
      const orderId = 'order_rb_123';
      const paymentId = 'pay_rzp_999';
      const invalidSignature = 'tampered_signature_hex_123';

      const mockPayment = {
        id: 'pay_db_123',
        orderId,
        razorpayOrderId: orderId,
        invoiceNumber: 'INV-2026-112233',
        totalAmount: 11800,
        status: PaymentStatus.PENDING,
        resident: {
          name: 'Ayushman Mishra',
          email: 'ayushman@globussoft.in',
        },
      };

      mockDb.payment.findFirst.mockResolvedValue(mockPayment);
      mockDb.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.FAILED,
      });

      await expect(
        paymentService.verifyPayment({
          paymentId: 'pay_db_123',
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: invalidSignature,
        })
      ).rejects.toThrow('Invalid Razorpay signature verification failed.');

      expect(mockDb.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay_db_123' },
          data: expect.objectContaining({ status: PaymentStatus.FAILED }),
        })
      );
    });

    it('should be idempotent and return existing success when already PAID', async () => {
      const mockPaidPayment = {
        id: 'pay_db_123',
        invoiceNumber: 'INV-2026-112233',
        receiptNumber: 'REC-2026-112233',
        razorpayPaymentId: 'pay_rzp_999',
        totalAmount: 11800,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        resident: {
          name: 'Ayushman Mishra',
          pg: { name: 'RoomBae Koramangala' },
          bed: { room: { roomNumber: '302-A' } },
        },
      };

      mockDb.payment.findFirst.mockResolvedValue(mockPaidPayment);

      const result = await paymentService.verifyPayment({
        paymentId: 'pay_db_123',
        razorpayOrderId: 'order_rb_123',
        razorpayPaymentId: 'pay_rzp_999',
        razorpaySignature: 'sig_valid',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('already been verified');
      expect(mockDb.payment.update).not.toHaveBeenCalled();
    });
  });

  describe('3. Webhook Handling & Idempotency', () => {
    it('should process payment.captured event and update payment record', async () => {
      const mockPayment = {
        id: 'pay_db_123',
        invoiceNumber: 'INV-2026-001',
        totalAmount: 11800,
        status: PaymentStatus.PENDING,
        resident: { name: 'Ayushman', email: 'ayushman@globussoft.in' },
      };

      mockDb.payment.findFirst.mockResolvedValue(mockPayment);
      mockDb.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.PAID });

      const payload = {
        event: 'payment.captured',
        event_id: 'evt_12345',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_webhook_1',
              order_id: 'order_rb_123',
            },
          },
        },
      };

      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';
      const validWebhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = await paymentService.handleWebhook(payload, validWebhookSig);

      expect(result.status).toBe('ok');
      expect(result.event).toBe('payment.captured');
      expect(mockDb.paymentWebhookLog.create).toHaveBeenCalled();
    });

    it('should process refund.processed event and update status to REFUNDED', async () => {
      mockDb.payment.updateMany.mockResolvedValue({ count: 1 });

      const payload = {
        event: 'refund.processed',
        event_id: 'evt_refund_123',
        payload: {
          payment: {
            entity: {
              id: 'pay_rzp_refund_1',
            },
          },
        },
      };

      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'mock_secret';
      const validWebhookSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const result = await paymentService.handleWebhook(payload, validWebhookSig);

      expect(result.status).toBe('ok');
      expect(mockDb.payment.updateMany).toHaveBeenCalledWith({
        where: { OR: [{ razorpayPaymentId: 'pay_rzp_refund_1' }, { paymentId: 'pay_rzp_refund_1' }] },
        data: { status: PaymentStatus.REFUNDED },
      });
    });
  });

  describe('4. Payment Analytics & Aggregation', () => {
    it('should accurately aggregate revenue, collection rate, and trends', async () => {
      const now = new Date();
      mockDb.pG.findMany.mockResolvedValue([{ id: 'pg_123' }]);
      mockDb.payment.findMany.mockResolvedValue([
        { totalAmount: 11800, baseAmount: 10000, status: PaymentStatus.PAID, createdAt: now, paidAt: now },
        { totalAmount: 15000, baseAmount: 12711, status: PaymentStatus.PAID, createdAt: now, paidAt: now },
        { totalAmount: 8500, baseAmount: 7203, status: PaymentStatus.PENDING, createdAt: now, paidAt: null },
        { totalAmount: 5000, baseAmount: 4237, status: PaymentStatus.REFUNDED, createdAt: now, paidAt: now },
      ]);

      const analytics = await paymentService.getPaymentAnalytics('owner_123');

      expect(analytics.totalRevenue).toBe(26800);
      expect(analytics.pendingAmount).toBe(8500);
      expect(analytics.refundedAmount).toBe(5000);
      expect(analytics.successfulPaymentsCount).toBe(2);
      expect(analytics.collectionRatePercent).toBeGreaterThan(70);
      expect(analytics.recentTrends.length).toBe(7);
    });
  });

  describe('5. CSV Export Generator', () => {
    it('should generate properly formatted CSV string', async () => {
      mockDb.payment.findMany.mockResolvedValue([
        {
          id: 'pay_1',
          invoiceNumber: 'INV-2026-001',
          receiptNumber: 'REC-2026-001',
          totalAmount: 11800,
          status: PaymentStatus.PAID,
          paymentMethod: 'RAZORPAY',
          razorpayPaymentId: 'pay_rzp_1',
          createdAt: new Date('2026-08-17T12:00:00Z'),
          resident: { name: 'Ayushman', bed: { room: { roomNumber: '101' } } },
          pg: { name: 'RoomBae PG' },
        },
      ]);
      mockDb.payment.count.mockResolvedValue(1);

      const csv = await paymentService.exportPaymentsCsv({});

      expect(csv).toContain('Invoice Number,Receipt Number,Resident Name');
      expect(csv).toContain('"INV-2026-001"');
      expect(csv).toContain('"Ayushman"');
      expect(csv).toContain('11800');
    });
  });

  describe('6. Refund Processing', () => {
    it('should mark payment as REFUNDED and return refund confirmation', async () => {
      const mockPayment = {
        id: 'pay_db_123',
        totalAmount: 11800,
        razorpayPaymentId: 'pay_rzp_live',
        resident: { name: 'Ayushman', user: { email: 'ayushman@globussoft.in' } },
      };

      mockDb.payment.findUnique.mockResolvedValue(mockPayment);
      mockDb.payment.update.mockResolvedValue({ ...mockPayment, status: PaymentStatus.REFUNDED });

      const refund = await paymentService.processRefund({
        paymentId: 'pay_db_123',
        amount: 11800,
        reason: 'Tenant Moved Out Early',
      });

      expect(refund.paymentId).toBe('pay_db_123');
      expect(refund.amount).toBe(11800);
      expect(refund.reason).toBe('Tenant Moved Out Early');
      expect(mockDb.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay_db_123' },
          data: expect.objectContaining({ status: PaymentStatus.REFUNDED }),
        })
      );
    });
  });
});
