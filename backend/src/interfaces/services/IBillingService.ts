import PDFDocument from 'pdfkit';

export interface IVerifyPaymentData {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  clientIp?: string;
}

export interface IBillingService {
  createPaymentOrder(residentId: string, baseAmount: number, isInterstate?: boolean): Promise<any>;
  verifyPayment(data: IVerifyPaymentData): Promise<any>;
  generateInvoicePdfStream(paymentId: string): Promise<InstanceType<typeof PDFDocument>>;
  generateReceiptPdfStream(paymentId: string): Promise<InstanceType<typeof PDFDocument>>;
  processRefund(paymentId: string, amount?: number, reason?: string): Promise<any>;
  handleWebhook(payload: any, signature: string): Promise<any>;
  getPaymentAnalytics(ownerId?: string): Promise<any>;
}
