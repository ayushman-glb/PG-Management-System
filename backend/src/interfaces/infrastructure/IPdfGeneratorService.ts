import PDFDocument from 'pdfkit';

export interface IPdfGeneratorService {
  generateInvoicePdf(paymentData: any, outputStream?: NodeJS.WritableStream): Promise<InstanceType<typeof PDFDocument>>;
  generateInvoicePdfBuffer(paymentData: any): Promise<Buffer>;
}
