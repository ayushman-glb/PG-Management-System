/**
 * PdfKitInvoiceService — updated to delegate to the centralized InvoicePdfGenerator.
 * Kept for interface compatibility with IPdfGeneratorService / BillingService.
 * NOTE: The old stream-based generation (pipe to HTTP response) was replaced because
 * it caused a race condition — `doc.end()` resolved before all PDF bytes were written.
 * The new buffer-based approach awaits the 'end' event before resolving.
 */
import { IPdfGeneratorService } from '../../interfaces/infrastructure/IPdfGeneratorService';
import PDFDocument from 'pdfkit';
import { InvoicePdfGenerator } from './generators/InvoicePdfGenerator';
import { ReceiptPdfGenerator } from './generators/ReceiptPdfGenerator';

const invoiceGen = new InvoicePdfGenerator();
const receiptGen = new ReceiptPdfGenerator();

export class PdfKitInvoiceService implements IPdfGeneratorService {
  /**
   * Generates complete PDF Document buffer using InvoicePdfGenerator.
   * Resolves only after all bytes are available — no HTTP response race condition.
   */
  async generateInvoicePdfBuffer(payment: any): Promise<Buffer> {
    const snapshot = mapPaymentToInvoiceSnapshot(payment);
    return invoiceGen.generate(snapshot);
  }

  /**
   * Generate a payment receipt buffer (distinct from invoice).
   */
  async generateReceiptPdfBuffer(payment: any): Promise<Buffer> {
    const snapshot = mapPaymentToReceiptSnapshot(payment);
    return receiptGen.generate(snapshot);
  }

  /**
   * @deprecated — Use generateInvoicePdfBuffer() instead.
   * Streams PDF into outputStream if provided; otherwise returns doc instance.
   * Kept for legacy callers only.
   */
  async generateInvoicePdf(payment: any, outputStream?: NodeJS.WritableStream): Promise<InstanceType<typeof PDFDocument>> {
    const buf = await this.generateInvoicePdfBuffer(payment);
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: false });
    if (outputStream) {
      doc.pipe(outputStream);
    }
    // End immediately — buffer is already complete
    doc.end();
    if (outputStream) {
      outputStream.end(buf);
    }
    return doc;
  }
}

// ─────────────────────────────────────────────────────
// Snapshot mappers — extract real database data fields
// ─────────────────────────────────────────────────────

function mapPaymentToInvoiceSnapshot(payment: any) {
  const resident = payment.resident ?? {};
  const resUser = resident.user ?? {};
  const pg = payment.pg ?? payment.property ?? {};
  const bed = resident.bed ?? {};
  const room = bed.room ?? {};

  return {
    invoiceNumber: payment.invoiceNumber ?? `INV-${Date.now()}`,
    invoiceDate: payment.createdAt ?? new Date(),
    dueDate: payment.dueDate,
    paymentStatus: payment.status ?? 'PENDING',
    paymentMethod: payment.paymentMethod ?? 'RAZORPAY',
    paymentDate: payment.paymentDate,
    currency: 'INR',
    transactionRef: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    // Owner
    ownerName: pg.owner?.name ?? pg.ownerName,
    ownerEmail: pg.owner?.email,
    ownerPhone: pg.owner?.phone,
    ownerAddress: pg.address,
    // Resident
    residentName: resUser.name ?? resident.name ?? 'Resident',
    residentEmail: resUser.email ?? resident.email,
    residentPhone: resUser.phone ?? resident.phone,
    residentCode: resUser.residentCode ?? resident.residentCode,
    residentAddress: resident.permanentAddress,
    // Property
    pgName: pg.name,
    pgAddress: pg.address,
    pgCity: pg.city,
    roomNumber: room.roomNumber,
    bedNumber: bed.bedNumber,
    // Amounts
    baseAmount: Number(payment.baseAmount ?? 0),
    cgstAmount: Number(payment.cgstAmount ?? 0),
    sgstAmount: Number(payment.sgstAmount ?? 0),
    igstAmount: Number(payment.igstAmount ?? 0),
    lateFee: Number(payment.lateFee ?? 0),
    totalAmount: Number(payment.totalAmount ?? 0),
  };
}

function mapPaymentToReceiptSnapshot(payment: any) {
  const resident = payment.resident ?? {};
  const resUser = resident.user ?? {};
  const pg = payment.pg ?? payment.property ?? {};
  const bed = resident.bed ?? {};
  const room = bed.room ?? {};

  const totalAmount = Number(payment.totalAmount ?? 0);
  const amountPaid = payment.status === 'PAID' ? totalAmount : 0;

  return {
    receiptNumber: payment.invoiceNumber
      ? `REC-${payment.invoiceNumber.replace('INV-', '')}`
      : `REC-${Date.now()}`,
    receiptDate: payment.paymentDate ?? payment.updatedAt ?? new Date(),
    paymentMethod: payment.paymentMethod ?? 'RAZORPAY',
    paymentStatus: payment.status ?? 'PENDING',
    transactionRef: payment.razorpayPaymentId,
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    residentName: resUser.name ?? resident.name ?? 'Resident',
    residentCode: resUser.residentCode ?? resident.residentCode,
    residentPhone: resUser.phone ?? resident.phone,
    residentEmail: resUser.email ?? resident.email,
    ownerName: pg.owner?.name,
    pgName: pg.name,
    pgAddress: pg.address,
    pgCity: pg.city,
    roomNumber: room.roomNumber,
    bedNumber: bed.bedNumber,
    baseAmount: Number(payment.baseAmount ?? 0),
    cgstAmount: Number(payment.cgstAmount ?? 0),
    sgstAmount: Number(payment.sgstAmount ?? 0),
    igstAmount: Number(payment.igstAmount ?? 0),
    totalAmount,
    amountPaid,
    balance: totalAmount - amountPaid,
  };
}
