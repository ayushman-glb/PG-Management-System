import { PrismaClient, Payment, PaymentStatus, PaymentMethod, PaymentPurpose, InvoiceStatus, BookingStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../../config/env';
import { PdfBrowserManager, renderReceiptHtml } from '../../utils/pdf';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

export class PaymentService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  private get razorpay(): any | null {
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_ID.startsWith('rzp_live_your_key')) {
      return new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return null;
  }

  async createRazorpayOrder(payerId: string, invoiceId?: string, bookingId?: string, customAmount?: number): Promise<any> {
    let amount = customAmount || 0;
    let pgId: string | undefined;
    let payeeId: string | undefined;
    let purpose: PaymentPurpose = PaymentPurpose.OTHER;

    if (invoiceId) {
      const invoice = await this.db.invoice.findUnique({
        where: { id: invoiceId },
        include: { pg: true },
      });
      if (!invoice) throw new NotFoundError('Invoice not found.');
      if (invoice.residentId !== payerId) throw new ForbiddenError('You are not authorized to pay this invoice.');
      if (invoice.status === InvoiceStatus.PAID) throw new BadRequestError('Invoice has already been paid.');

      amount = invoice.balanceDue;
      pgId = invoice.pgId;
      payeeId = invoice.pg.ownerId;
      purpose = PaymentPurpose.MONTHLY_RENT;
    } else if (bookingId) {
      const booking = await this.db.booking.findUnique({
        where: { id: bookingId },
        include: { pg: true },
      });
      if (!booking) throw new NotFoundError('Booking not found.');
      if (booking.residentId !== payerId) throw new ForbiddenError('You are not authorized to pay for this booking.');

      amount = booking.advanceAmountPaid > 0 ? booking.rentAmount - booking.advanceAmountPaid : booking.depositAmount;
      pgId = booking.pgId;
      payeeId = booking.pg.ownerId;
      purpose = PaymentPurpose.BOOKING_ADVANCE;
    }

    if (amount <= 0) throw new BadRequestError('Payment amount must be greater than zero.');

    let razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (this.razorpay) {
      try {
        const order = await this.razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            payerId,
            invoiceId: invoiceId || '',
            bookingId: bookingId || '',
          },
        });
        razorpayOrderId = order.id;
      } catch (err: any) {
        console.warn('Razorpay order creation fallback:', err?.message || err);
      }
    }

    const payment = await this.db.payment.create({
      data: {
        invoiceId,
        bookingId,
        payerId,
        payeeId,
        pgId,
        amount,
        currency: 'INR',
        paymentMethod: PaymentMethod.RAZORPAY,
        purpose,
        status: PaymentStatus.INITIATED,
        razorpayOrderId,
      },
    });

    return {
      paymentId: payment.id,
      orderId: razorpayOrderId,
      amount,
      currency: 'INR',
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    };
  }

  async verifyRazorpayPayment(paymentId: string, razorpayPaymentId: string, razorpaySignature?: string): Promise<Payment> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true, booking: true },
    });

    if (!payment) throw new NotFoundError('Payment record not found.');

    if (env.RAZORPAY_KEY_SECRET && razorpaySignature && payment.razorpayOrderId && !env.RAZORPAY_KEY_SECRET.includes('your_')) {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        await this.db.payment.update({
          where: { id: paymentId },
          data: { status: PaymentStatus.FAILED, rejectionReason: 'Signature mismatch' },
        });
        throw new BadRequestError('Razorpay signature verification failed.');
      }
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    // Transaction-safe payment confirmation
    return await this.db.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.VERIFIED,
          razorpayPaymentId,
          razorpaySignature,
          receiptNumber,
          verifiedAt: new Date(),
        },
      });

      // Update Invoice if linked
      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: { increment: payment.amount },
            balanceDue: 0,
            status: InvoiceStatus.PAID,
          },
        });
      }

      // Update Booking if linked
      if (payment.bookingId) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            advanceAmountPaid: { increment: payment.amount },
            status: BookingStatus.PAYMENT_VERIFIED,
          },
        });
      }

      return updatedPayment;
    });
  }

  async submitManualPayment(payerId: string, data: { invoiceId?: string; bookingId?: string; amount: number; paymentMethod: PaymentMethod; manualUtr: string; manualProofUrl?: string }): Promise<Payment> {
    if (!data.manualUtr) throw new BadRequestError('Transaction reference / UTR is required.');
    if (data.amount <= 0) throw new BadRequestError('Amount must be greater than zero.');

    let pgId: string | undefined;
    let payeeId: string | undefined;
    let purpose: PaymentPurpose = PaymentPurpose.OTHER;

    if (data.invoiceId) {
      const invoice = await this.db.invoice.findUnique({
        where: { id: data.invoiceId },
        include: { pg: true },
      });
      if (invoice) {
        pgId = invoice.pgId;
        payeeId = invoice.pg.ownerId;
        purpose = PaymentPurpose.MONTHLY_RENT;
      }
    } else if (data.bookingId) {
      const booking = await this.db.booking.findUnique({
        where: { id: data.bookingId },
        include: { pg: true },
      });
      if (booking) {
        pgId = booking.pgId;
        payeeId = booking.pg.ownerId;
        purpose = PaymentPurpose.BOOKING_ADVANCE;
      }
    }

    return await this.db.payment.create({
      data: {
        invoiceId: data.invoiceId,
        bookingId: data.bookingId,
        payerId,
        payeeId,
        pgId,
        amount: data.amount,
        currency: 'INR',
        paymentMethod: data.paymentMethod,
        purpose,
        status: PaymentStatus.PENDING_VERIFICATION,
        manualUtr: data.manualUtr,
        manualProofUrl: data.manualProofUrl,
        manualSubmittedAt: new Date(),
      },
    });
  }

  async verifyManualPayment(paymentId: string, ownerId: string, approve: boolean, rejectionReason?: string): Promise<Payment> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
      include: { pg: true, invoice: true, booking: true },
    });

    if (!payment) throw new NotFoundError('Payment record not found.');
    if (payment.pg && payment.pg.ownerId !== ownerId) {
      throw new ForbiddenError('You do not have permission to verify payments for this property.');
    }

    if (!approve) {
      return await this.db.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          rejectionReason: rejectionReason || 'Rejected by property owner.',
          verifiedById: ownerId,
          verifiedAt: new Date(),
        },
      });
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

    return await this.db.$transaction(async (tx) => {
      const verified = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.VERIFIED,
          receiptNumber,
          verifiedById: ownerId,
          verifiedAt: new Date(),
        },
      });

      if (payment.invoiceId) {
        await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            amountPaid: { increment: payment.amount },
            balanceDue: 0,
            status: InvoiceStatus.PAID,
          },
        });
      }

      if (payment.bookingId) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            advanceAmountPaid: { increment: payment.amount },
            status: BookingStatus.PAYMENT_VERIFIED,
          },
        });
      }

      return verified;
    });
  }

  async handleRazorpayWebhook(rawPayload: string, signature: string): Promise<any> {
    if (env.RAZORPAY_WEBHOOK_SECRET && !env.RAZORPAY_WEBHOOK_SECRET.includes('your_')) {
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new BadRequestError('Invalid webhook signature.');
      }
    }

    const body = JSON.parse(rawPayload);
    const eventId = body.event_id || body.id || `evt_${Date.now()}`;

    // Idempotency check
    const existingWebhook = await this.db.paymentWebhook.findUnique({ where: { eventId } });
    if (existingWebhook && existingWebhook.isProcessed) {
      return { status: 'already_processed' };
    }

    await this.db.paymentWebhook.upsert({
      where: { eventId },
      create: {
        eventId,
        eventType: body.event,
        payload: rawPayload,
        isProcessed: true,
        processedAt: new Date(),
      },
      update: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    if (body.event === 'payment.captured' || body.event === 'order.paid') {
      const paymentEntity = body.payload?.payment?.entity;
      if (paymentEntity?.order_id) {
        const localPayment = await this.db.payment.findFirst({
          where: { razorpayOrderId: paymentEntity.order_id },
        });
        if (localPayment && localPayment.status !== PaymentStatus.VERIFIED) {
          await this.verifyRazorpayPayment(localPayment.id, paymentEntity.id);
        }
      }
    }

    return { status: 'success' };
  }

  async generateReceiptPDF(paymentId: string): Promise<Buffer> {
    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
      include: {
        payer: { include: { profile: true } },
        payee: true,
        pg: { include: { location: true } },
        invoice: { include: { items: true } },
      },
    });

    if (!payment) throw new NotFoundError('Payment record not found.');

    const payerName = payment.payer.profile
      ? `${payment.payer.profile.firstName} ${payment.payer.profile.lastName}`.trim()
      : payment.payer.username;

    const pgAddress = payment.pg?.location
      ? `${payment.pg.location.address}, ${payment.pg.location.city}${payment.pg.location.state ? ', ' + payment.pg.location.state : ''}${payment.pg.location.pincode ? ' - ' + payment.pg.location.pincode : ''}`
      : undefined;

    const html = renderReceiptHtml({
      receiptNumber: payment.receiptNumber || payment.id,
      paymentId: payment.id,
      paymentDate: payment.createdAt,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      purpose: payment.purpose,
      amount: payment.amount,
      payerName,
      payerEmail: payment.payer.email,
      payerPhone: payment.payer.phone || undefined,
      pgName: payment.pg?.name,
      pgAddress,
      transactionId: payment.razorpayPaymentId || payment.manualUtr || payment.id,
    });

    const pdfBuffer = await PdfBrowserManager.generatePdfFromHtml(html);

    // Record in PDFDocument collection
    try {
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      await this.db.pDFDocument.create({
        data: {
          documentType: 'RECEIPT',
          title: `Receipt-${payment.receiptNumber || payment.id}`,
          fileUrl: `/api/v1/payments/${payment.id}/receipt`,
          storageProvider: 'LOCAL_STREAM',
          hash,
          residentId: payment.payerId,
          ownerId: payment.payeeId,
          pgId: payment.pgId,
        },
      });
    } catch {
      // Non-blocking metadata log
    }

    return pdfBuffer;
  }

  async getPaymentHistory(userId: string, role: Role, limit: number = 50): Promise<any[]> {
    const where: any = {};
    if (role === Role.RESIDENT) {
      where.payerId = userId;
    } else if (role === Role.PG_OWNER) {
      where.OR = [
        { payeeId: userId },
        { pg: { ownerId: userId } },
      ];
    }
    // ADMIN has no role filter

    return await this.db.payment.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            items: true,
            resident: {
              include: {
                profile: true,
              },
            },
          },
        },
        pg: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
        payer: {
          select: {
            id: true,
            username: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
        booking: {
          include: {
            room: true,
            bed: true,
          },
        },
      },
    });
  }

  async exportPaymentsCsv(filters?: any): Promise<string> {
    const payments = await this.db.payment.findMany({
      where: filters?.pgId ? { pgId: filters.pgId } : {},
      include: {
        payer: true,
        pg: true,
      },
    });

    const headers = 'Invoice Number,Receipt Number,Resident Name,Amount,Status,Date';
    const rows = payments.map((p: any) => {
      const inv = p.invoiceNumber || p.invoiceId || '';
      const rec = p.receiptNumber || p.id || '';
      const name = p.resident?.name || p.resident?.profile?.name || p.payer?.username || '';
      const amt = p.totalAmount || p.amount || 0;
      const st = p.status || '';
      const dt = p.createdAt ? new Date(p.createdAt).toISOString() : '';
      return `"${inv}","${rec}","${name}",${amt},"${st}","${dt}"`;
    });

    return [headers, ...rows].join('\n');
  }

  async processRefund(
    paymentIdOrOptions: string | { paymentId: string; amount?: number; refundAmount?: number; reason?: string; userId?: string; role?: Role },
    userId?: string,
    role?: Role,
    refundAmount?: number,
    reason?: string
  ): Promise<any> {
    let paymentId: string;
    let uId: string | undefined = userId;
    let userRole: Role | undefined = role;
    let amt: number | undefined = refundAmount;
    let rsn: string | undefined = reason;

    if (typeof paymentIdOrOptions === 'object') {
      paymentId = paymentIdOrOptions.paymentId;
      amt = paymentIdOrOptions.amount || paymentIdOrOptions.refundAmount;
      rsn = paymentIdOrOptions.reason;
      uId = paymentIdOrOptions.userId;
      userRole = paymentIdOrOptions.role;
    } else {
      paymentId = paymentIdOrOptions;
    }

    const payment = await this.db.payment.findUnique({
      where: { id: paymentId },
      include: { pg: true, invoice: true },
    });

    if (!payment) throw new NotFoundError('Payment not found.');

    if (userRole === Role.PG_OWNER && uId && (payment as any).payeeId !== uId && (payment as any).pg?.ownerId !== uId) {
      throw new ForbiddenError('You are not authorized to refund this payment.');
    }

    const originalAmount = (payment as any).totalAmount || payment.amount || 0;
    const targetAmount = amt || originalAmount;
    if (targetAmount > originalAmount) {
      throw new BadRequestError('Refund amount cannot exceed original payment amount.');
    }

    const updatedPayment = await this.db.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    if (payment.invoiceId) {
      await this.db.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: InvoiceStatus.UNPAID,
          balanceDue: { increment: targetAmount },
        },
      });
    }

    return {
      success: true,
      paymentId: updatedPayment.id,
      amount: targetAmount,
      refundedAmount: targetAmount,
      status: 'REFUNDED',
      reason: rsn || 'Owner initiated refund',
      refundedAt: new Date().toISOString(),
    };
  }
}

