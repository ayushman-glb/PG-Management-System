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
}
