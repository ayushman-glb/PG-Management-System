import { IPdfGeneratorService } from '../../interfaces/infrastructure/IPdfGeneratorService';
import PDFDocument from 'pdfkit';

export class PdfKitInvoiceService implements IPdfGeneratorService {
  async generateInvoicePdf(payment: any): Promise<PDFKit.PDFDocument> {
    const doc = new PDFDocument({ margin: 50 });

    // Document Header
    doc.fontSize(22).fillColor('#1E293B').text('RoomBae Co-Living Systems', { align: 'center' });
    doc.fontSize(10).fillColor('#64748B').text('OFFICIAL GST TAX INVOICE', { align: 'center' });
    doc.moveDown(1.5);

    // Invoice Metadata Box
    doc.fontSize(10).fillColor('#0F172A');
    doc.text(`Invoice No: ${payment.invoiceNumber}`);
    const paymentDateStr = payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    doc.text(`Date: ${paymentDateStr}`);
    doc.text(`Status: ${payment.status}`);
    doc.moveDown();

    // PG Property & Resident Details
    const pgObj = payment.pg || payment.property || {};
    if (pgObj.name) doc.text(`Property: ${pgObj.name}`);
    if (pgObj.address) doc.text(`Address: ${pgObj.address}, ${pgObj.city}`);
    doc.moveDown();

    if (payment.resident) {
      const resName = payment.resident.user?.name || payment.resident.name || 'Resident';
      const resCode = payment.resident.user?.residentCode || '';
      doc.text(`Resident: ${resName} (${resCode})`);
      if (payment.resident.bed?.room) {
        doc.text(`Room/Bed: Room ${payment.resident.bed.room.roomNumber} - Bed ${payment.resident.bed.bedNumber}`);
      }
    }
    doc.moveDown(1.5);

    // Financial Table Line Items
    doc.fontSize(11).fillColor('#1E293B').text('Line Items Breakdown:', { underline: true });
    doc.fontSize(10);
    doc.text(`Base Rent: ₹${payment.baseAmount.toFixed(2)}`);
    doc.text(`CGST (9%): ₹${payment.cgstAmount.toFixed(2)}`);
    doc.text(`SGST (9%): ₹${payment.sgstAmount.toFixed(2)}`);
    if (payment.igstAmount > 0) doc.text(`IGST (18%): ₹${payment.igstAmount.toFixed(2)}`);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#059669').text(`Total Paid: ₹${payment.totalAmount.toFixed(2)}`, { bold: true } as any);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#94A3B8').text('This is a computer-generated tax invoice and requires no physical signature.', { align: 'center' });

    doc.end();
    return doc;
  }
}
