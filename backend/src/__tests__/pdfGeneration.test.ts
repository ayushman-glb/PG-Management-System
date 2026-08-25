import {
  renderInvoiceHtml,
  renderReceiptHtml,
  renderAgreementHtml,
  PdfBrowserManager,
} from '../utils/pdf';
import { BillingService } from '../modules/billing/billing.service';
import { PaymentService } from '../modules/payments/payment.service';
import { AgreementService } from '../modules/agreements/agreement.service';
import { Role, InvoiceStatus, PaymentStatus, PaymentMethod, PaymentPurpose, AgreementStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError } from '../core/errors/CustomErrors';

describe('PDF Generation Suite (Puppeteer & Brand Templates)', () => {
  let mockDb: any;
  let billingService: BillingService;
  let paymentService: PaymentService;
  let agreementService: AgreementService;

  beforeEach(() => {
    mockDb = {
      invoice: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
      },
      agreement: {
        findUnique: jest.fn(),
      },
      pDFDocument: {
        create: jest.fn().mockResolvedValue({ id: 'pdf_doc_1' }),
      },
    };
    (global as any).prismaSingleton = mockDb;

    billingService = new BillingService();
    paymentService = new PaymentService();
    agreementService = new AgreementService();
  });

  afterAll(async () => {
    await PdfBrowserManager.closeBrowser();
  });

  describe('1. HTML Template Rendering', () => {
    it('renderInvoiceHtml should render all required A2 fields with RoomBae branding', () => {
      const html = renderInvoiceHtml({
        invoiceNumber: 'INV-2026-001',
        status: 'PAID',
        billingMonth: 8,
        billingYear: 2026,
        issueDate: new Date('2026-08-01'),
        dueDate: new Date('2026-08-10'),
        residentName: 'Ayushman Resident',
        residentEmail: 'resident@roombae.com',
        residentPhone: '+91 9876543210',
        pgName: 'RoomBae Luxury Living',
        pgAddress: '123 Residency Road, Bengaluru, Karnataka - 560025',
        items: [
          { description: 'Monthly Rent - Room 101 Bed A', quantity: 1, unitPrice: 12000, total: 12000 },
          { description: 'High-Speed Wi-Fi & Maintenance', quantity: 1, unitPrice: 1500, total: 1500 },
        ],
        subtotal: 13500,
        gstPercentage: 18,
        gstAmount: 2430,
        fineAmount: 0,
        totalAmount: 15930,
        amountPaid: 15930,
        balanceDue: 0,
      });

      expect(html).toContain('ROOMBAE');
      expect(html).toContain('TAX INVOICE');
      expect(html).toContain('INV-2026-001');
      expect(html).toContain('Ayushman Resident');
      expect(html).toContain('resident@roombae.com');
      expect(html).toContain('RoomBae Luxury Living');
      expect(html).toContain('Monthly Rent - Room 101 Bed A');
      expect(html).toContain('₹15,930.00');
      expect(html).toContain('#FFF8F2'); // Brand background
      expect(html).toContain('#3B2A24'); // Brand primary text
      expect(html).toContain('@page');
    });

    it('renderReceiptHtml should render payment acknowledgement with correct metadata', () => {
      const html = renderReceiptHtml({
        receiptNumber: 'REC-2026-8899',
        paymentId: 'pay_123456789',
        paymentDate: new Date('2026-08-05T10:30:00Z'),
        paymentMethod: 'RAZORPAY_UPI',
        status: 'SUCCESS',
        purpose: 'MONTHLY_RENT',
        amount: 15930,
        payerName: 'Ayushman Resident',
        payerEmail: 'resident@roombae.com',
        payerPhone: '+91 9876543210',
        pgName: 'RoomBae Luxury Living',
        pgAddress: 'Bengaluru, Karnataka',
        transactionId: 'txn_rzp_99887766',
      });

      expect(html).toContain('ROOMBAE');
      expect(html).toContain('Official Payment Receipt');
      expect(html).toContain('REC-2026-8899');
      expect(html).toContain('RAZORPAY_UPI');
      expect(html).toContain('txn_rzp_99887766');
      expect(html).toContain('₹15,930.00');
      expect(html).toContain('MONTHLY RENT');
    });

    it('renderAgreementHtml should render complete tenancy contract with signatures and QR code data URL', () => {
      const mockQrDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const html = renderAgreementHtml({
        agreementNumber: 'AGR-2026-5544',
        status: 'ACTIVE',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-07-31'),
        version: 1,
        ownerName: 'Vikram Owner',
        ownerEmail: 'owner@roombae.com',
        ownerPhone: '+91 9123456780',
        residentName: 'Ayushman Resident',
        residentEmail: 'resident@roombae.com',
        residentPhone: '+91 9876543210',
        pgName: 'RoomBae Indiranagar',
        pgAddress: '100 Feet Road, Indiranagar, Bengaluru - 560038',
        floorNumber: 2,
        roomNumber: '204',
        bedNumber: 'B',
        roomType: 'DOUBLE_SHARING',
        rentAmount: 14000,
        depositAmount: 28000,
        lockInPeriodMonths: 6,
        noticePeriodDays: 30,
        signatures: [
          {
            signerRole: 'RESIDENT',
            signatureType: 'AADHAAR_OTP',
            signedAt: new Date('2026-08-01T12:00:00Z'),
            ipAddress: '49.207.180.12',
          },
          {
            signerRole: 'PG_OWNER',
            signatureType: 'DIGITAL_CLICK',
            signedAt: new Date('2026-08-01T12:30:00Z'),
            ipAddress: '49.207.180.1',
          },
        ],
        documentHash: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
        verificationUrl: 'http://localhost:5173/verify-agreement?num=AGR-2026-5544',
        qrCodeDataUrl: mockQrDataUrl,
      });

      expect(html).toContain('RESIDENTIAL LEASE CONTRACT');
      expect(html).toContain('AGR-2026-5544');
      expect(html).toContain('Vikram Owner');
      expect(html).toContain('Ayushman Resident');
      expect(html).toContain('Floor 2 · Room 204 · Bed B');
      expect(html).toContain('₹14,000');
      expect(html).toContain('₹28,000');
      expect(html).toContain('AADHAAR_OTP');
      expect(html).toContain(mockQrDataUrl);
      expect(html).toContain('a1b2c3d4e5f6');
    });
  });

  describe('2. Puppeteer Engine Execution', () => {
    it('generatePdfFromHtml should generate a valid PDF buffer starting with %PDF-', async () => {
      const sampleHtml = renderInvoiceHtml({
        invoiceNumber: 'INV-TEST-001',
        status: 'PAID',
        billingMonth: 8,
        billingYear: 2026,
        issueDate: new Date(),
        dueDate: new Date(),
        residentName: 'Test User',
        residentEmail: 'test@example.com',
        pgName: 'Test PG',
        items: [{ description: 'Test Item', quantity: 1, unitPrice: 5000, total: 5000 }],
        subtotal: 5000,
        gstPercentage: 18,
        gstAmount: 900,
        totalAmount: 5900,
        amountPaid: 5900,
        balanceDue: 0,
      });

      const pdfBuffer = await PdfBrowserManager.generatePdfFromHtml(sampleHtml);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(5000);
      const magicBytes = pdfBuffer.subarray(0, 5).toString('utf-8');
      expect(magicBytes).toBe('%PDF-');
    }, 20000);

    it('generatePdfFromHtml should reuse the singleton browser without crashing on sequential calls', async () => {
      const sampleHtml = renderReceiptHtml({
        receiptNumber: 'REC-SEQ-001',
        paymentId: 'pay_seq_1',
        paymentDate: new Date(),
        paymentMethod: 'UPI',
        status: 'SUCCESS',
        purpose: 'RENT',
        amount: 5000,
        payerName: 'Test Payer',
        payerEmail: 'payer@example.com',
      });

      const pdfBuffer1 = await PdfBrowserManager.generatePdfFromHtml(sampleHtml);
      const pdfBuffer2 = await PdfBrowserManager.generatePdfFromHtml(sampleHtml);

      expect(pdfBuffer1.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
      expect(pdfBuffer2.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    }, 20000);
  });

  describe('3. Service PDF Generators & Database Record Tracking', () => {
    it('BillingService.generateInvoicePDF should generate PDF and write record to PDFDocument model', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'inv_123',
        invoiceNumber: 'INV-2026-099',
        status: InvoiceStatus.PAID,
        billingMonth: 8,
        billingYear: 2026,
        issueDate: new Date(),
        dueDate: new Date(),
        subtotal: 10000,
        gstPercentage: 18,
        gstAmount: 1800,
        fineAmount: 0,
        totalAmount: 11800,
        amountPaid: 11800,
        balanceDue: 0,
        residentId: 'user_resident_1',
        pgId: 'pg_1',
        resident: {
          username: 'resident_joe',
          email: 'joe@example.com',
          phone: '9988776655',
          profile: { firstName: 'Joe', lastName: 'Resident' },
        },
        pg: {
          id: 'pg_1',
          name: 'Green PG',
          ownerId: 'owner_1',
          location: { address: '12th Cross', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        },
        items: [{ id: 'item_1', description: 'Rent Aug 2026', quantity: 1, unitPrice: 10000, total: 10000 }],
        payments: [],
      });

      const pdf = await billingService.generateInvoicePDF('inv_123', 'user_resident_1', Role.RESIDENT);

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
      expect(mockDb.pDFDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentType: 'INVOICE',
            title: 'Invoice-INV-2026-099',
            residentId: 'user_resident_1',
            ownerId: 'owner_1',
            pgId: 'pg_1',
          }),
        })
      );
    }, 20000);

    it('BillingService.generateInvoicePDF should throw ForbiddenError if unprivileged user requests another user invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue({
        id: 'inv_123',
        residentId: 'user_other',
        pg: { ownerId: 'owner_1' },
        resident: {},
        items: [],
      });

      await expect(
        billingService.generateInvoicePDF('inv_123', 'user_stranger', Role.RESIDENT)
      ).rejects.toThrow(ForbiddenError);
    });

    it('BillingService.generateInvoicePDF should throw NotFoundError for nonexistent invoice', async () => {
      mockDb.invoice.findUnique.mockResolvedValue(null);

      await expect(
        billingService.generateInvoicePDF('nonexistent_id', 'user_1', Role.ADMIN)
      ).rejects.toThrow(NotFoundError);
    });

    it('PaymentService.generateReceiptPDF should generate PDF and write record to PDFDocument model', async () => {
      mockDb.payment.findUnique.mockResolvedValue({
        id: 'pay_999',
        receiptNumber: 'REC-2026-777',
        status: PaymentStatus.VERIFIED,
        paymentMethod: PaymentMethod.RAZORPAY,
        purpose: PaymentPurpose.MONTHLY_RENT,
        amount: 11800,
        payerId: 'user_resident_1',
        payeeId: 'owner_1',
        pgId: 'pg_1',
        createdAt: new Date(),
        razorpayPaymentId: 'pay_rzp_12345',
        payer: {
          username: 'resident_joe',
          email: 'joe@example.com',
          profile: { firstName: 'Joe', lastName: 'Resident' },
        },
        payee: { id: 'owner_1' },
        pg: {
          name: 'Green PG',
          location: { address: '12th Cross', city: 'Bengaluru' },
        },
        invoice: { items: [] },
      });

      const pdf = await paymentService.generateReceiptPDF('pay_999');

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
      expect(mockDb.pDFDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentType: 'RECEIPT',
            title: 'Receipt-REC-2026-777',
            residentId: 'user_resident_1',
            ownerId: 'owner_1',
            pgId: 'pg_1',
          }),
        })
      );
    }, 20000);

    it('AgreementService.generateAgreementPDF should generate PDF and write record to PDFDocument model', async () => {
      mockDb.agreement.findUnique.mockResolvedValue({
        id: 'agr_555',
        agreementNumber: 'AGR-2026-001',
        status: AgreementStatus.COMPLETED,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2027-07-31'),
        version: 1,
        rentAmount: 15000,
        depositAmount: 30000,
        lockInPeriodMonths: 6,
        noticePeriodDays: 30,
        residentId: 'user_resident_1',
        ownerId: 'owner_1',
        pgId: 'pg_1',
        documentHash: 'hash_abc_123',
        resident: {
          username: 'resident_joe',
          email: 'joe@example.com',
          phone: '9988776655',
          profile: { firstName: 'Joe', lastName: 'Resident' },
        },
        owner: {
          username: 'owner_bob',
          email: 'bob@example.com',
          phone: '9123456780',
          profile: { firstName: 'Bob', lastName: 'Owner' },
        },
        pg: {
          name: 'Green PG',
          location: { address: '12th Cross', city: 'Bengaluru' },
        },
        allocation: {
          floor: { floorNumber: 1 },
          room: { roomNumber: '101', roomType: 'SINGLE' },
          bed: { bedNumber: 'A' },
        },
        signatures: [
          {
            signerRole: Role.RESIDENT,
            signatureType: 'AADHAAR_OTP',
            signedAt: new Date(),
            ipAddress: '127.0.0.1',
          },
        ],
      });

      const pdf = await agreementService.generateAgreementPDF('agr_555');

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
      expect(mockDb.pDFDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentType: 'AGREEMENT',
            title: 'Agreement-AGR-2026-001',
            residentId: 'user_resident_1',
            ownerId: 'owner_1',
            pgId: 'pg_1',
          }),
        })
      );
    }, 20000);
  });
});
