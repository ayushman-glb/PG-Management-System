import PDFDocument from 'pdfkit';

export interface IPdfGeneratorService {
  generateInvoicePdf(paymentData: any): Promise<PDFKit.PDFDocument>;
  generateInvoicePdfBuffer(paymentData: any): Promise<Buffer>;
}
