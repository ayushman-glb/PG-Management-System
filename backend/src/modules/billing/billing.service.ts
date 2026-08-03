import { IBillingService, IVerifyPaymentData } from '../../interfaces/services/IBillingService';
import { IBillingRepository } from '../../interfaces/repositories/IBillingRepository';
import { IResidentRepository } from '../../interfaces/repositories/IResidentRepository';
import { IDistributedLockService } from '../../interfaces/infrastructure/IDistributedLockService';
import { IPdfGeneratorService } from '../../interfaces/infrastructure/IPdfGeneratorService';
import { AppError } from '../../utils/appError';
import { PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../../config/env';

export class BillingService implements IBillingService {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly residentRepository: IResidentRepository,
    private readonly lockService: IDistributedLockService,
    private readonly pdfService: IPdfGeneratorService
  ) {}

  async createPaymentOrder(residentId: string, baseAmount: number, isInterstate: boolean = false) {
    const resident = await this.residentRepository.findById(residentId);

    if (!resident) {
      throw new AppError('Resident not found', 404);
    }

    const lock = await this.lockService.acquireLock(`bed:lock:${resident.bedId}`, 30000);
    if (!lock.lockAcquired) {
      throw new AppError('A booking or payment transaction is currently processing for this bed. Please try again shortly.', 429);
    }

    try {
      const cgstAmount = isInterstate ? 0 : parseFloat((baseAmount * 0.09).toFixed(2));
      const sgstAmount = isInterstate ? 0 : parseFloat((baseAmount * 0.09).toFixed(2));
      const igstAmount = isInterstate ? parseFloat((baseAmount * 0.18).toFixed(2)) : 0;
      const totalAmount = parseFloat((baseAmount + cgstAmount + sgstAmount + igstAmount).toFixed(2));

      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockRazorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;

      const payment = await this.billingRepository.createPayment({
        residentId,
        propertyId: resident.propertyId || resident.pgId,
        invoiceNumber,
        baseAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        dueDate: new Date(new Date().setDate(10)),
        paymentMethod: 'RAZORPAY',
        status: PaymentStatus.PENDING,
        razorpayOrderId: mockRazorpayOrderId
      });

      return {
        paymentId: payment.id,
        invoiceNumber,
        razorpayOrderId: mockRazorpayOrderId,
        baseAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        currency: 'INR',
        keyId: env.RAZORPAY_KEY_ID
      };
    } finally {
      await lock.release();
    }
  }

  async verifyPayment(data: IVerifyPaymentData) {
    const payment = await this.billingRepository.findPaymentById(data.paymentId);

    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    let isValid = true;
    if (env.RAZORPAY_KEY_SECRET !== 'your_razorpay_key_secret' && env.RAZORPAY_KEY_SECRET !== 'mock_razorpay_secret') {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
        .digest('hex');
      isValid = generatedSignature === data.razorpaySignature;
    }

    if (!isValid) {
      await this.billingRepository.updatePaymentStatus(payment.id, PaymentStatus.FAILED);
      throw new AppError('Invalid Razorpay signature verification failed.', 400);
    }

    const updated = await this.billingRepository.updatePaymentStatus(payment.id, PaymentStatus.PAID, {
      razorpayPaymentId: data.razorpayPaymentId,
      razorpaySignature: data.razorpaySignature,
      clientIp: data.clientIp
    });

    const resident = await this.residentRepository.findById(payment.residentId);
    if (resident?.bedId) {
      await this.residentRepository.updateBedOccupancy(resident.bedId, true);
    }

    return updated;
  }

  async generateInvoicePdfStream(paymentId: string): Promise<PDFKit.PDFDocument> {
    const payment = await this.billingRepository.findPaymentWithDetails(paymentId);

    if (!payment) {
      throw new AppError('Payment invoice not found', 404);
    }

    return this.pdfService.generateInvoicePdf(payment);
  }
}
