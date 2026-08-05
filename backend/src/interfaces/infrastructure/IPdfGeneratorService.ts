import PDFDocument from 'pdfkit';

export interface IPdfGeneratorService {
  generateInvoicePdf(paymentData: any): Promise<InstanceType<typeof PDFDocument>>;
  generateInvoicePdfBuffer(paymentData: any): Promise<Buffer>;
}
