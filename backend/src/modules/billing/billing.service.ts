import { PrismaClient, Invoice, InvoiceStatus, Fine, FineStatus, FineType, Role } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../core/errors/CustomErrors';
import { PdfBrowserManager, renderInvoiceHtml } from '../../utils/pdf';

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

    const pgAddress = invoice.pg.location
      ? `${invoice.pg.location.address}, ${invoice.pg.location.city}${invoice.pg.location.state ? ', ' + invoice.pg.location.state : ''}${invoice.pg.location.pincode ? ' - ' + invoice.pg.location.pincode : ''}`
      : undefined;

    const html = renderInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      billingMonth: invoice.billingMonth,
      billingYear: invoice.billingYear,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      residentName,
      residentEmail: invoice.resident.email,
      residentPhone: invoice.resident.phone || undefined,
      pgName: invoice.pg.name,
      pgAddress,
      items: invoice.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
      subtotal: invoice.subtotal,
      gstPercentage: invoice.gstPercentage,
      gstAmount: invoice.gstAmount,
      fineAmount: invoice.fineAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balanceDue: invoice.balanceDue,
    });

    const pdfBuffer = await PdfBrowserManager.generatePdfFromHtml(html);

    // Record in PDFDocument collection
    try {
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      await this.db.pDFDocument.create({
        data: {
          documentType: 'INVOICE',
          title: `Invoice-${invoice.invoiceNumber}`,
          fileUrl: `/api/v1/billing/invoices/${invoice.id}/pdf`,
          storageProvider: 'LOCAL_STREAM',
          hash,
          residentId: invoice.residentId,
          ownerId: invoice.pg.ownerId,
          pgId: invoice.pgId,
        },
      });
    } catch {
      // Non-blocking metadata log
    }

    return pdfBuffer;
  }

  async getInvoiceById(invoiceId: string, userId: string, role: Role): Promise<Invoice> {
    const invoice = await this.db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        resident: { include: { profile: true } },
        pg: { select: { id: true, name: true, ownerId: true, location: true } },
        payments: true,
      },
    });

    if (!invoice) throw new NotFoundError('Invoice not found.');

    if (role === Role.RESIDENT && invoice.residentId !== userId) {
      throw new ForbiddenError('You are not authorized to view this invoice.');
    }
    if (role === Role.PG_OWNER && invoice.pg.ownerId !== userId) {
      throw new ForbiddenError('You do not own the property for this invoice.');
    }

    return invoice;
  }

  async levyFine(ownerId: string, data: { residentId: string; pgId: string; amount: number; fineType: FineType; reason: string; invoiceId?: string }): Promise<Fine> {
    if (!data.residentId || !data.pgId || !data.amount || !data.reason) {
      throw new BadRequestError('residentId, pgId, amount, and reason are required.');
    }
    const pg = await this.db.pG.findUnique({ where: { id: data.pgId } });
    if (!pg || pg.ownerId !== ownerId) {
      throw new ForbiddenError('Unauthorized to levy fine on this property.');
    }

    return this.db.fine.create({
      data: {
        residentId: data.residentId,
        pgId: data.pgId,
        amount: Number(data.amount),
        fineType: data.fineType || FineType.OTHER,
        reason: data.reason,
        status: FineStatus.PENDING,
        invoiceId: data.invoiceId,
      },
    });
  }

  async waiveFine(ownerId: string, fineId: string): Promise<Fine> {
    const fine = await this.db.fine.findUnique({
      where: { id: fineId },
      include: { pg: true },
    });
    if (!fine) throw new NotFoundError('Fine record not found.');
    if (fine.pg.ownerId !== ownerId) {
      throw new ForbiddenError('Unauthorized to waive fine for this property.');
    }

    return this.db.fine.update({
      where: { id: fineId },
      data: {
        status: FineStatus.WAIVED,
        waivedById: ownerId,
      },
    });
  }

  async getFines(userId: string, role: Role, pgId?: string): Promise<Fine[]> {
    if (role === Role.PG_OWNER) {
      const where: any = { pg: { ownerId: userId } };
      if (pgId) where.pgId = pgId;
      return this.db.fine.findMany({
        where,
        include: {
          resident: { select: { id: true, username: true, email: true, phone: true, profile: true } },
          pg: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.db.fine.findMany({
      where: { residentId: userId },
      include: {
        pg: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
