import { PrismaClient, Payment, PaymentStatus, PaymentMethod, PaymentPurpose, InvoiceStatus, BookingStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { env } from '../../config/env';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

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

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(22).fillColor('#C89A4B').text('ROOMBAE', { align: 'center' });
      doc.fontSize(10).fillColor('#555555').text('Official Payment & Tax Invoice Receipt', { align: 'center' });
      doc.moveDown(1.5);

      // Receipt Metadata
      doc.fontSize(12).fillColor('#1D1B1A');
      doc.text(`Receipt Number: ${payment.receiptNumber || payment.id}`);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString('en-IN')}`);
      doc.text(`Payment Method: ${payment.paymentMethod}`);
      doc.text(`Status: ${payment.status}`);
      doc.moveDown();

      // Payer & Property Info
      doc.text(`Received From: ${payment.payer.username} (${payment.payer.email})`);
      if (payment.pg) {
        doc.text(`Property: ${payment.pg.name}`);
        if (payment.pg.location) {
          doc.text(`Location: ${payment.pg.location.address}, ${payment.pg.location.city}`);
        }
      }
      doc.moveDown();

      // Financials
      doc.rect(50, doc.y, 500, 25).fill('#F5F0EB');
      doc.fillColor('#1D1B1A').text('Description', 60, doc.y - 18);
      doc.text('Amount (INR)', 450, doc.y - 14, { align: 'right' });
      doc.moveDown();

      doc.text(`Payment for ${payment.purpose.replace(/_/g, ' ')}`, 60);
      doc.text(`₹${payment.amount.toLocaleString('en-IN')}`, 450, doc.y - 14, { align: 'right' });
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text(`Total Paid: ₹${payment.amount.toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown(2);

      doc.fontSize(9).font('Helvetica').fillColor('#888888').text('This is a computer-generated receipt issued by the RoomBae PG Management System.', { align: 'center' });

      doc.end();
    });
  }
}
