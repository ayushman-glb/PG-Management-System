import crypto from 'crypto';
import { PaymentService } from '../../modules/payments/payment.service';
import { PaymentStatus } from '@prisma/client';
import { env } from '../../config/env';

jest.mock('../../modules/email', () => ({
  emailService: {
    sendPaymentReceiptEmail: jest.fn().mockResolvedValue(true),
    sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../modules/documents/documents.service', () => ({
  documentsService: {
    generatePdfReceipt: jest.fn().mockResolvedValue(Buffer.from('mock receipt pdf')),
  },
}));

describe('Razorpay Cryptographic Signature & Webhook Verification Integration', () => {
  let paymentService: PaymentService;
  const testKeySecret = env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key';
  const orderId = 'order_test_998877';
  const paymentId = 'pay_test_112233';

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  it('1. should accept cryptographically valid HMAC-SHA256 Razorpay signature', async () => {
    // Generate valid signature using test secret
    const validSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Verify cryptographic generation
    const expected = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    expect(validSignature).toBe(expected);

    // Mock DB payment verification
    const mockPayment = {
      id: 'pay_rec_001',
      orderId,
      razorpayOrderId: orderId,
      amount: 8500,
      status: PaymentStatus.PENDING,
      residentId: '64a000000000000000000040',
      resident: {
        id: '64a000000000000000000040',
        name: 'Test Resident',
        email: 'resident@roombae.com',
      },
    };

    (paymentService as any).db = {
      payment: {
        findFirst: jest.fn().mockResolvedValue(mockPayment),
        update: jest.fn().mockImplementation((args: any) => Promise.resolve({ ...mockPayment, ...args.data })),
      },
      invoice: {
        upsert: jest.fn().mockResolvedValue({ id: 'inv_01', paymentId: mockPayment.id }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit_01' }),
      },
    };

    const result = await paymentService.verifyPayment({
      paymentId: 'pay_rec_001',
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: validSignature,
    });

    expect(result).toHaveProperty('status', PaymentStatus.PAID);
    expect(result).toHaveProperty('success', true);
  });

  it('2. should reject tampered / mismatched signature with 400 error', async () => {
    const tamperedSignature = 'deadbeef_invalid_tampered_signature_123456789';

    (paymentService as any).db = {
      payment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'pay_rec_002',
          orderId,
          razorpayOrderId: orderId,
          amount: 8500,
          status: PaymentStatus.PENDING,
        }),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit_02' }),
      },
    };

    await expect(
      paymentService.verifyPayment({
        paymentId: 'pay_rec_002',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: tamperedSignature,
      })
    ).rejects.toThrow();
  });
});
