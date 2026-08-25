import { PrismaClient, Invoice, InvoiceStatus, Fine, FineStatus, FineType, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';

export class BillingService {
  private get db(): PrismaClient {
    return (global as any).prismaSingleton || prisma;
  }

  /**
   * Generates monthly rent invoice for an active resident stay.
   * Calculates subtotal, server-side GST @ 18%, checks for applicable late fines.
   */
  async generateMonthlyInvoice(residentId: string, pgId: string, month?: number, year?: number): Promise<Invoice> {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    // Check if invoice already exists
    const existing = await this.db.invoice.findFirst({
      where: {
        residentId,
        pgId,
        billingMonth: currentMonth,
        billingYear: currentYear,
      },
      include: { items: true },
    });

    if (existing) return existing;

    const allocation = await this.db.roomAllocation.findFirst({
      where: { residentId, pgId, isActive: true },
      include: { room: true, bed: true, pg: true },
    });

    if (!allocation) {
      throw new NotFoundError('No active room allocation found for this resident in the specified PG.');
    }

    const rentSchedule = await this.db.rentSchedule.findFirst({
      where: { residentId, pgId, isActive: true },
    });

    const subtotal = allocation.rent || rentSchedule?.monthlyRent || 10000;
    const gstPercentage = 18.0;
    const gstAmount = Number(((subtotal * gstPercentage) / 100).toFixed(2));
    const totalAmount = subtotal + gstAmount;

    const dueDate = new Date(currentYear, currentMonth - 1, rentSchedule?.dueDayOfMonth || 5);
    const invoiceNumber = `INV-${currentYear}-${currentMonth.toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

    return await this.db.invoice.create({
      data: {
        residentId,
        pgId,
        bookingId: allocation.bookingId,
        invoiceNumber,
        billingMonth: currentMonth,
        billingYear: currentYear,
        issueDate: new Date(),
        dueDate,
        gracePeriodDays: rentSchedule?.graceDays || 5,
        subtotal,
        gstPercentage,
        gstAmount,
        fineAmount: 0,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        status: InvoiceStatus.UNPAID,
        items: {
          create: [
            {
              description: `Monthly Rent (${allocation.room.roomNumber} - Bed ${allocation.bed.bedNumber})`,
              itemType: 'RENT',
              unitPrice: subtotal,
              quantity: 1,
              total: subtotal,
            },
            {
              description: `GST @ 18% (SAC 9963 Accommodation Services)`,
              itemType: 'OTHER',
              unitPrice: gstAmount,
              quantity: 1,
              total: gstAmount,
            },
          ],
        },
      },
      include: { items: true },
    });
  }

  /**
   * Recalculates fine on unpaid overdue invoices.
   */
  async calculateAndApplyFine(invoiceId: string): Promise<Invoice> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, pg: true },
    });

    if (!invoice || invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.VOID) {
      return invoice!;
    }

    const schedule = await this.db.rentSchedule.findFirst({
      where: { residentId: invoice.residentId, pgId: invoice.pgId, isActive: true },
    });

    const graceDays = invoice.gracePeriodDays || schedule?.graceDays || 5;
    const graceExpiry = new Date(invoice.dueDate);
    graceExpiry.setDate(graceExpiry.getDate() + graceDays);

    const now = new Date();
    if (now > graceExpiry) {
      const diffTime = Math.abs(now.getTime() - graceExpiry.getTime());
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyFine = schedule?.lateFinePerDay || 50;
      const maxFine = schedule?.maxFineAmount || 1000;
      const calculatedFine = Math.min(daysOverdue * dailyFine, maxFine);

      if (calculatedFine > invoice.fineAmount) {
        const fineDiff = calculatedFine - invoice.fineAmount;
        const newTotal = invoice.totalAmount + fineDiff;
        const newBalance = invoice.balanceDue + fineDiff;

        return await this.db.invoice.update({
          where: { id: invoiceId },
          data: {
            fineAmount: calculatedFine,
            totalAmount: newTotal,
            balanceDue: newBalance,
            status: InvoiceStatus.OVERDUE,
          },
          include: { items: true },
        });
      }
    }

    return invoice;
  }

  async getResidentInvoices(residentId: string): Promise<any> {
    const invoices = await this.db.invoice.findMany({
      where: { residentId },
      include: {
        pg: { select: { id: true, name: true, location: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Auto calculate fines on pending invoices
    for (const inv of invoices) {
      if (inv.status === InvoiceStatus.UNPAID || inv.status === InvoiceStatus.OVERDUE) {
        await this.calculateAndApplyFine(inv.id);
      }
    }

    const totalOutstanding = invoices
      .filter((i) => i.status !== InvoiceStatus.PAID && i.status !== InvoiceStatus.VOID)
      .reduce((sum, i) => sum + i.balanceDue, 0);

    return {
      invoices,
      totalOutstanding,
    };
  }

  async getOwnerInvoices(ownerId: string, pgId?: string): Promise<any> {
    const where: any = {
      pg: { ownerId },
    };
    if (pgId) where.pgId = pgId;

    const invoices = await this.db.invoice.findMany({
      where,
      include: {
        resident: {
          select: { id: true, username: true, email: true, phone: true, profile: true },
        },
        pg: { select: { id: true, name: true } },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCollected = 0;
    let totalDue = 0;
    for (const inv of invoices) {
      totalCollected += inv.amountPaid;
      if (inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID) {
        totalDue += inv.balanceDue;
      }
    }

    return {
      invoices,
      totalCollected,
      totalDue,
    };
  }

  async calculateOutstandingDues(residentId: string): Promise<any> {
    const res = await this.getResidentInvoices(residentId);
    return {
      residentId,
      totalOutstanding: res.totalOutstanding,
      invoices: res.invoices,
    };
  }

  async generateInvoicePDF(invoiceId: string, userId: string, userRole: Role): Promise<Buffer> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        resident: { include: { profile: true } },
        pg: { include: { location: true } },
        items: true,
        payments: true,
      },
    });

    if (!invoice) throw new NotFoundError('Invoice not found.');

    const isResident = invoice.residentId === userId;
    const isPrivileged = userRole === Role.PG_OWNER || userRole === Role.ADMIN;
    if (!isResident && !isPrivileged) {
      throw new ForbiddenError('Not authorized to access this invoice.');
    }

    const residentName = invoice.resident.profile
      ? `${invoice.resident.profile.firstName} ${invoice.resident.profile.lastName}`.trim()
      : invoice.resident.username;

    return new Promise((resolve, reject) => {
      const PDFKit = require('pdfkit');
      const doc = new PDFKit({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.rect(40, 40, 515, 50).fill('#0F172A');
      doc.fillColor('#F59E0B').fontSize(16).font('Helvetica-Bold').text('ROOMBAE TAX INVOICE', 40, 52, { align: 'center' });
      doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('Original for Recipient · GSTIN: 29AABCR8901M1ZX', 40, 72, { align: 'center' });

      let y = 105;
      doc.rect(40, y, 515, 45).fill('#F8FAFC');
      doc.strokeColor('#E2E8F0').stroke();
      doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, 50, y + 8);
      doc.text(`Status: ${invoice.status}`, 350, y + 8);
      doc.font('Helvetica').fontSize(8).fillColor('#64748B');
      doc.text(`Billing Period: Month ${invoice.billingMonth}/${invoice.billingYear}`, 50, y + 25);
      doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 200, y + 25);
      doc.text(`Generated: ${new Date(invoice.issueDate).toLocaleDateString('en-IN')}`, 350, y + 25);

      y += 60;
      doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text('Billed To:', 40, y);
      doc.text('Property / Provider:', 300, y);
      y += 15;
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
      doc.text(`Resident: ${residentName}`, 40, y);
      doc.text(`PG: ${invoice.pg.name}`, 300, y);
      y += 12;
      doc.text(`Email: ${invoice.resident.email}`, 40, y);
      if (invoice.pg.location) {
        doc.text(`Address: ${invoice.pg.location.address}, ${invoice.pg.location.city}`, 300, y);
      }
      y += 25;

      // Table Header
      doc.rect(40, y, 515, 20).fill('#E2E8F0');
      doc.fillColor('#0F172A').fontSize(8.5).font('Helvetica-Bold');
      doc.text('Item Description', 50, y + 5);
      doc.text('Qty', 320, y + 5);
      doc.text('Unit Price (₹)', 370, y + 5);
      doc.text('Total (₹)', 470, y + 5);
      y += 25;

      // Items
      doc.font('Helvetica').fontSize(8.5).fillColor('#334155');
      for (const item of invoice.items) {
        doc.text(item.description, 50, y);
        doc.text(String(item.quantity), 320, y);
        doc.text(item.unitPrice.toLocaleString('en-IN'), 370, y);
        doc.text(item.total.toLocaleString('en-IN'), 470, y);
        y += 18;
      }

      y += 10;
      doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').stroke();
      y += 15;

      // Summary
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A');
      doc.text(`Subtotal: ₹${invoice.subtotal.toLocaleString('en-IN')}`, 370, y);
      y += 14;
      doc.text(`GST (${invoice.gstPercentage}%): ₹${invoice.gstAmount.toLocaleString('en-IN')}`, 370, y);
      y += 14;
      if (invoice.fineAmount > 0) {
        doc.text(`Late Fine: ₹${invoice.fineAmount.toLocaleString('en-IN')}`, 370, y);
        y += 14;
      }
      doc.fontSize(11).fillColor('#D97706');
      doc.text(`Total Due: ₹${invoice.totalAmount.toLocaleString('en-IN')}`, 370, y);
      y += 16;
      doc.fontSize(9).fillColor('#10B981');
      doc.text(`Amount Paid: ₹${invoice.amountPaid.toLocaleString('en-IN')}`, 370, y);
      y += 14;
      doc.fontSize(10).fillColor('#DC2626');
      doc.text(`Balance Due: ₹${invoice.balanceDue.toLocaleString('en-IN')}`, 370, y);

      doc.end();
    });
  }
}
