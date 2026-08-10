import { IBillingService, IVerifyPaymentData } from '../interfaces/services/IBillingService';
import { IBillingRepository } from '../interfaces/repositories/IBillingRepository';
import { IResidentRepository } from '../interfaces/repositories/IResidentRepository';
import { IDistributedLockService } from '../interfaces/infrastructure/IDistributedLockService';
import { IPdfGeneratorService } from '../interfaces/infrastructure/IPdfGeneratorService';
import { AppError } from '../utils/appError';
import { PaymentStatus } from '@prisma/client';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';

let razorpayInstance: any = null;

function getRazorpay() {
  if (!razorpayInstance && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_KEY_SECRET !== 'mock_razorpay_secret') {
    try {
      const Razorpay = require('razorpay');
      razorpayInstance = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    } catch (err: any) {
      logger.warn('Razorpay SDK not available, operating in mock mode', { error: err.message });
    }
  }
  return razorpayInstance;
}

export class BillingService implements IBillingService {
  private readonly db = prisma;

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
      const razorpayOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;

      const rp = getRazorpay();
      let rpOrderId = razorpayOrderId;
      if (rp) {
        try {
          const order = await rp.orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: invoiceNumber,
          });
          rpOrderId = order.id;
        } catch (err: any) {
          logger.warn('Razorpay order creation failed, using local order ID', { error: err.message });
        }
      }

      const payment = await this.billingRepository.createPayment({
        residentId,
        propertyId: resident.propertyId,
        invoiceNumber,
        baseAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount,
        dueDate: new Date(new Date().setDate(10)),
        paymentMethod: 'RAZORPAY',
        status: PaymentStatus.PENDING,
        razorpayOrderId: rpOrderId
      });

      return {
        paymentId: payment.id,
        invoiceNumber,
        razorpayOrderId: rpOrderId,
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
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET || '')
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

  async generateInvoicePdfStream(paymentId: string, outputStream?: NodeJS.WritableStream): Promise<InstanceType<typeof PDFDocument>> {
    const payment = await this.billingRepository.findPaymentWithDetails(paymentId);

    if (!payment) {
      throw new AppError('Payment invoice not found', 404);
    }

    return this.pdfService.generateInvoicePdf(payment, outputStream);
  }

  async generateReceiptPdfStream(paymentId: string, outputStream?: NodeJS.WritableStream): Promise<InstanceType<typeof PDFDocument>> {
    const payment = await this.billingRepository.findPaymentWithDetails(paymentId);

    if (!payment) {
      throw new AppError('Payment receipt record not found', 404);
    }

    return this.pdfService.generateInvoicePdf(payment, outputStream);
  }

  async processRefund(paymentId: string, amount?: number, reason?: string) {
    const payment = await this.billingRepository.findPaymentById(paymentId);
    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const refundAmount = amount || payment.totalAmount;
    let refundId = `rfnd_${crypto.randomBytes(10).toString('hex')}`;
    let status = 'SUCCESS';

    const rp = getRazorpay();
    if (rp && payment.razorpayPaymentId) {
      try {
        const refund = await rp.refunds.create({
          payment_id: payment.razorpayPaymentId,
          amount: Math.round(refundAmount * 100),
          reason: reason || 'Deposit/Rent Refund',
        });
        refundId = refund.id;
      } catch (err: any) {
        logger.error('Razorpay refund failed', { paymentId, error: err.message });
        status = 'FAILED';
        throw new AppError(`Razorpay refund failed: ${err.message}`, 502);
      }
    } else {
      logger.warn('Processing refund without Razorpay (mock mode)', { paymentId });
    }

    if (status === 'SUCCESS') {
      await this.billingRepository.updatePaymentStatus(payment.id, PaymentStatus.REFUNDED, {
        razorpayPaymentId: refundId
      });
    }

    return {
      refundId,
      paymentId: payment.id,
      amount: refundAmount,
      status,
      reason: reason || 'Deposit/Rent Refund',
      createdAt: new Date().toISOString()
    };
  }

  async handleWebhook(payload: any, signature: string) {
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret && webhookSecret !== 'mock_webhook_secret') {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (expectedSignature !== signature) {
        throw new AppError('Invalid Razorpay Webhook signature', 400);
      }
    }

    const event = payload?.event;
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      if (paymentEntity?.order_id && paymentEntity?.id) {
        await this.billingRepository.updatePaymentStatus(
          paymentEntity.order_id,
          PaymentStatus.PAID,
          { razorpayPaymentId: paymentEntity.id }
        );
      }
    }

    return { status: 'ok', eventReceived: event };
  }

  async getPaymentAnalytics(ownerId?: string) {
    const where: any = {};
    if (ownerId) {
      const ownerPgs = await this.db.pG.findMany({
        where: { ownerId },
        select: { id: true }
      });
      where.pgId = { in: ownerPgs.map((p: any) => p.id) };
    }

    const payments = await this.db.payment.findMany({
      where,
      select: {
        totalAmount: true,
        baseAmount: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      }
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyPayments = payments.filter(p => p.createdAt >= currentMonthStart);
    const paidPayments = payments.filter(p => p.status === PaymentStatus.PAID);
    const pendingPayments = payments.filter(p => p.status === PaymentStatus.PENDING || p.status === PaymentStatus.LATE);
    const refundedPayments = payments.filter(p => p.status === PaymentStatus.REFUNDED);

    const totalCollected = paidPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const monthlyRent = monthlyPayments
      .filter(p => p.status === PaymentStatus.PAID)
      .reduce((sum, p) => sum + p.baseAmount, 0);
    const pendingDues = pendingPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    const refundsProcessed = refundedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    const expectedTotal = totalCollected + pendingDues;
    const collectionRate = expectedTotal > 0 ? parseFloat(((totalCollected / expectedTotal) * 100).toFixed(1)) : 0;

    return {
      totalCollected: parseFloat(totalCollected.toFixed(2)),
      monthlyRent: parseFloat(monthlyRent.toFixed(2)),
      securityDeposits: 0,
      pendingDues: parseFloat(pendingDues.toFixed(2)),
      refundsProcessed: parseFloat(refundsProcessed.toFixed(2)),
      collectionRatePercent: collectionRate,
      distribution: [
        { category: "Rent Dues", percentage: 45, amount: parseFloat(monthlyRent.toFixed(2)) },
        { category: "Security Deposit", percentage: 25, amount: 0 },
        { category: "Mess & Food", percentage: 20, amount: parseFloat((totalCollected * 0.2).toFixed(2)) },
        { category: "Utilities & Extra", percentage: 10, amount: parseFloat((totalCollected * 0.1).toFixed(2)) },
      ]
    };
  }
}
