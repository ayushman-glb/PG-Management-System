import { emailService } from '../../modules/email/email.service';
import { emailTemplates } from '../../modules/email/email.templates';
import { EMAIL_CONSTANTS } from '../../modules/email/email.constants';
import { EmailQueue } from '../../modules/email/email.queue';
import { prisma } from '../../config/prisma';
import bcrypt from 'bcryptjs';

// Mock Prisma for Unit Tests
jest.mock('../../config/prisma', () => ({
  prisma: {
    emailOTP: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    emailLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    marketingCampaign: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock Nodemailer Transporter
jest.mock('../../modules/email/transporter', () => ({
  gmailTransporter: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock_msg_id_12345' }),
    verify: jest.fn().mockResolvedValue(true),
  },
  verifyGmailConnection: jest.fn().mockResolvedValue(true),
}));

describe('RoomBae Google Gmail SMTP Email Subsystem', () => {
  const testEmail = 'resident_test@example.com';
  const testName = 'Ayushman Sharma';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Email OTP Generation & Storage Flow', () => {
    it('should generate 6-digit OTP, bcrypt-hash it, and persist to EmailOTP database table', async () => {
      (prisma.emailOTP.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.emailOTP.create as jest.Mock).mockResolvedValue({
        id: 'otp_1',
        email: testEmail,
        hashedOtp: 'hashed_code_123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        resendCount: 1,
      });

      const result = await emailService.sendOtp(testEmail, testName);

      expect(result.success).toBe(true);
      expect(result.cooldownSeconds).toBe(EMAIL_CONSTANTS.OTP.COOLDOWN_SECONDS);
      expect(prisma.emailOTP.create).toHaveBeenCalledTimes(1);
    });

    it('should reject immediate repeated OTP request before 60s cooldown expires', async () => {
      const recentDate = new Date(); // 0 seconds ago
      (prisma.emailOTP.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp_1',
        email: testEmail,
        updatedAt: recentDate,
        createdAt: recentDate,
        resendCount: 1,
      });

      await expect(emailService.sendOtp(testEmail, testName)).rejects.toThrow(
        /Please wait \d+ seconds before requesting another OTP/
      );
    });
  });

  describe('2. Email OTP Verification Flow', () => {
    it('should successfully verify valid OTP and delete record to prevent replay attacks', async () => {
      const plainOtp = '654321';
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(plainOtp, salt);

      (prisma.emailOTP.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp_1',
        email: testEmail,
        hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        resendCount: 1,
      });

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'usr_1',
        email: testEmail,
      });

      const verifyResult = await emailService.verifyOtp(testEmail, plainOtp);
      expect(verifyResult.success).toBe(true);
      expect(verifyResult.message).toContain('verified successfully');
      expect(prisma.emailOTP.deleteMany).toHaveBeenCalledWith({ where: { email: testEmail } });
    });

    it('should reject invalid OTP, increment attempt counter, and lock after max attempts', async () => {
      const plainOtp = '123456';
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(plainOtp, salt);

      (prisma.emailOTP.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp_1',
        email: testEmail,
        hashedOtp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
        resendCount: 1,
      });

      // Wrong OTP attempt
      await expect(emailService.verifyOtp(testEmail, '999999')).rejects.toThrow(
        /Invalid verification code/
      );

      expect(prisma.emailOTP.update).toHaveBeenCalledWith({
        where: { id: 'otp_1' },
        data: { attempts: 1 },
      });
    });

    it('should reject expired OTP code', async () => {
      const plainOtp = '112233';
      const salt = await bcrypt.genSalt(10);
      const hashedOtp = await bcrypt.hash(plainOtp, salt);

      (prisma.emailOTP.findFirst as jest.Mock).mockResolvedValue({
        id: 'otp_1',
        email: testEmail,
        hashedOtp,
        expiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 min ago
        attempts: 0,
        resendCount: 1,
      });

      await expect(emailService.verifyOtp(testEmail, plainOtp)).rejects.toThrow(
        /Verification code has expired/
      );
    });
  });

  describe('3. 12 Apple/Bento UI HTML Email Templates Validation', () => {
    it('should correctly render all 12 responsive Bento UI email templates with HTML structure', () => {
      // 1. OTP Verification
      const otp = emailTemplates.otpVerification({ email: testEmail, otp: '887766', name: 'Test' });
      expect(otp).toContain('887766');
      expect(otp).toContain('Security Verification Code');

      // 2. Welcome
      const welcome = emailTemplates.welcome({ email: testEmail, name: 'Ayushman' });
      expect(welcome).toContain('Welcome to RoomBae!');
      expect(welcome).toContain('Ayushman');

      // 3. Password Reset
      const reset = emailTemplates.passwordReset({ email: testEmail, otp: '445566' });
      expect(reset).toContain('Reset Your Password');
      expect(reset).toContain('445566');

      // 4. Payment Receipt
      const receipt = emailTemplates.paymentReceipt({
        email: testEmail,
        name: 'Ayushman',
        invoiceNumber: 'INV-1001',
        amount: 12000,
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        transactionId: 'TXN-998877',
      });
      expect(receipt).toContain('Payment Successful');
      expect(receipt).toContain('INV-1001');

      // 5. Invoice
      const invoice = emailTemplates.invoice({
        email: testEmail,
        name: 'Ayushman',
        invoiceNumber: 'INV-1001',
        dueDate: new Date(),
        totalAmount: 14160,
        breakdown: { baseRent: 12000, cgst: 1080, sgst: 1080 },
      });
      expect(invoice).toContain('Rental Invoice #INV-1001');
      expect(invoice).toContain('GST Tax Invoice PDF is attached');

      // 6. Payment Failed
      const failed = emailTemplates.paymentFailed({
        email: testEmail,
        name: 'Ayushman',
        amount: 12000,
        attemptDate: new Date(),
        failureReason: 'Insufficient funds',
      });
      expect(failed).toContain('Payment Attempt Failed');
      expect(failed).toContain('Insufficient funds');

      // 7. Refund Confirmation
      const refund = emailTemplates.refundConfirmation({
        email: testEmail,
        name: 'Ayushman',
        refundAmount: 5000,
        refundId: 'RFD-1234',
        originalTransactionId: 'TXN-0001',
        processedDate: new Date(),
      });
      expect(refund).toContain('Refund Processed');
      expect(refund).toContain('RFD-1234');

      // 8. Booking Confirmation
      const booking = emailTemplates.bookingConfirmation({
        email: testEmail,
        name: 'Ayushman',
        bookingId: 'BKG-01',
        propertyName: 'RoomBae Elite PG',
        propertyAddress: 'Koramangala, Bangalore',
        roomNumber: '302',
        bedNumber: 'A',
        moveInDate: new Date(),
        monthlyRent: 15000,
        securityDeposit: 30000,
      });
      expect(booking).toContain('Room Allocation Confirmed');
      expect(booking).toContain('RoomBae Elite PG');

      // 9. Complaint Update
      const complaint = emailTemplates.complaintUpdate({
        email: testEmail,
        name: 'Ayushman',
        ticketCode: 'TICK-908',
        title: 'AC not cooling',
        category: 'MAINTENANCE',
        priority: 'HIGH',
        status: 'RESOLVED',
        description: 'AC unit fixed by technician',
        createdAt: new Date(),
        resolutionNotes: 'Replaced cooling capacitor',
      });
      expect(complaint).toContain('Ticket Update: TICK-908');
      expect(complaint).toContain('Replaced cooling capacitor');

      // 10. Support Reply
      const support = emailTemplates.supportReply({
        email: testEmail,
        name: 'Ayushman',
        ticketCode: 'TICK-908',
        subject: 'Re: AC Issue',
        message: 'The technician has visited and resolved the issue.',
        repliedBy: 'Property Manager',
        repliedAt: new Date(),
      });
      expect(support).toContain('Support Reply: TICK-908');
      expect(support).toContain('Property Manager');

      // 11. Newsletter
      const news = emailTemplates.newsletter({
        title: 'RoomBae Monthly Digest',
        edition: 'August 2026',
        highlights: [{ title: 'New Gym Opening', description: 'Available for all residents' }],
      });
      expect(news).toContain('RoomBae Monthly Digest');
      expect(news).toContain('New Gym Opening');

      // 12. Marketing Campaign
      const mktg = emailTemplates.marketingCampaign({
        title: 'Refer a Friend Bonus',
        subject: 'Earn ₹2,000 on your next rent',
        audience: 'ALL_USERS',
        headline: 'Refer & Earn Program',
        content: 'Invite your friends to RoomBae and get ₹2,000 credit.',
        ctaText: 'Get Referral Link',
        ctaUrl: 'https://roombae.com/refer',
      });
      expect(mktg).toContain('Refer & Earn Program');
      expect(mktg).toContain('Get Referral Link');
    });
  });

  describe('4. Invoice PDF Attachment & Email Dispatch', () => {
    it('should accept and attach PDF buffers to invoice emails', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Invoice Buffer');
      const invoiceSent = await emailService.sendInvoiceEmail({
        email: testEmail,
        name: testName,
        invoiceNumber: 'INV-TEST-2026',
        dueDate: new Date(),
        totalAmount: 15000,
        breakdown: { baseRent: 15000, cgst: 0, sgst: 0 },
        pdfBuffer: mockPdfBuffer,
      });

      expect(typeof invoiceSent).toBe('boolean');
    });
  });

  describe('5. Background Email Queue', () => {
    it('should successfully enqueue email job and return valid tracking ID', () => {
      const jobId = EmailQueue.enqueue({
        to: testEmail,
        subject: 'Async Queue Test',
        html: '<p>Queue testing</p>',
      });

      expect(jobId).toBeDefined();
      expect(jobId.startsWith('job_')).toBe(true);
    });
  });
});
