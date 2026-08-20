export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
  template?: string;
  metadata?: Record<string, any>;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string | string[];
}

export interface OtpEmailData {
  email: string;
  otp: string;
  name?: string;
  expiresInMinutes?: number;
}

export interface WelcomeEmailData {
  email: string;
  name: string;
  role?: string;
  loginUrl?: string;
}

export interface PasswordResetEmailData {
  email: string;
  name?: string;
  resetLink?: string;
  otp?: string;
  expiresInMinutes?: number;
}

export interface PaymentReceiptEmailData {
  email: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: string;
  transactionId: string;
  propertyName?: string;
  roomNumber?: string;
  period?: string;
}

export interface InvoiceEmailData {
  email: string;
  name: string;
  invoiceNumber: string;
  dueDate: Date | string;
  totalAmount: number;
  breakdown: {
    baseRent: number;
    cgst: number;
    sgst: number;
    igst?: number;
    otherCharges?: number;
  };
  pdfBuffer?: Buffer;
  propertyName?: string;
  roomNumber?: string;
}

export interface PaymentFailedEmailData {
  email: string;
  name: string;
  amount: number;
  attemptDate: Date | string;
  failureReason?: string;
  retryUrl?: string;
  invoiceNumber?: string;
}

export interface RefundEmailData {
  email: string;
  name: string;
  refundAmount: number;
  refundId: string;
  originalTransactionId: string;
  reason?: string;
  processedDate: Date | string;
}

export interface BookingConfirmationEmailData {
  email: string;
  name: string;
  bookingId: string;
  propertyName: string;
  propertyAddress: string;
  roomNumber: string;
  bedNumber?: string;
  moveInDate: Date | string;
  monthlyRent: number;
  securityDeposit: number;
}

export interface ComplaintEmailData {
  email: string;
  name: string;
  ticketCode: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  createdAt: Date | string;
  resolutionNotes?: string;
}

export interface SupportReplyEmailData {
  email: string;
  name: string;
  ticketCode: string;
  subject: string;
  message: string;
  repliedBy: string;
  repliedAt: Date | string;
}

export interface MarketingCampaignData {
  campaignId?: string;
  title: string;
  subject: string;
  audience: string;
  bannerUrl?: string;
  headline: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  recipients?: Array<{ email: string; name?: string }>;
}

export interface NewDeviceLoginEmailData {
  email: string;
  name?: string;
  deviceLabel: string;
  screenResolution?: string;
  ipAddress: string;
  location?: string;
  loginTime?: string;
  reviewUrl?: string;
}
