import crypto from 'crypto';
import { PaymentService } from '../../modules/payments/payment.service';
import { PaymentStatus } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    invoice: {
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
    pdfDocument: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../../modules/email', () => ({
  emailService: {
    sendPaymentReceiptEmail: jest.fn().mockResolvedValue(true),
    sendPaymentFailedEmail: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../modules/documents/document.service', () => ({
  documentService: {
    generatePdfReceipt: jest.fn().mockResolvedValue(Buffer.from('mock receipt pdf')),
  },
}));

describe('Razorpay Cryptographic Signature & Webhook Verification Integration', () => {
  let paymentService: PaymentService;
  const testKeySecret = env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_key';
  const orderId = 'order_test_998877';
  const paymentId = 'pay_test_112233';

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService();
  });

  it('1. should accept cryptographically valid HMAC-SHA256 Razorpay signature', async () => {
    const validSignature = crypto
      .createHmac('sha256', testKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const mockPayment = {
      id: 'pay_rec_001',
      orderId,
      razorpayOrderId: orderId,
      amount: 8500,
      status: PaymentStatus.INITIATED,
      residentId: '64a000000000000000000040',
      resident: {
        id: '64a000000000000000000040',
        name: 'Test Resident',
        email: 'resident@roombae.com',
      },
    };

    (prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment);
    (prisma.payment.update as jest.Mock).mockImplementation((args: any) =>
      Promise.resolve({ ...mockPayment, ...args.data })
    );
    (prisma.invoice.update as jest.Mock).mockResolvedValue({ id: 'inv_01' });
    (prisma.booking.update as jest.Mock).mockResolvedValue({ id: 'bk_01' });
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });

    const result = await paymentService.verifyRazorpayPayment(
      'pay_rec_001',
      paymentId,
      validSignature
    );

    expect(result).toHaveProperty('status', PaymentStatus.VERIFIED);
  });

  it('2. should reject tampered / mismatched signature with 400 error', async () => {
    const tamperedSignature = 'deadbeef_invalid_tampered_signature_123456789';

    (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
      id: 'pay_rec_002',
      orderId,
      razorpayOrderId: orderId,
      amount: 8500,
      status: PaymentStatus.INITIATED,
    });
    (prisma.payment.update as jest.Mock).mockResolvedValue({});

    await expect(
      paymentService.verifyRazorpayPayment(
        'pay_rec_002',
        paymentId,
        tamperedSignature
      )
    ).rejects.toThrow();
  });
});
