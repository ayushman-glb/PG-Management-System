import * as fs from 'fs';
import * as path from 'path';
import {
  renderInvoiceHtml,
  renderReceiptHtml,
  renderAgreementHtml,
  PdfBrowserManager,
  QrCodeService,
} from '../src/utils/pdf';

async function generateSamplePdfs() {
  const outputDir = path.resolve(__dirname, '../../sample_pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎨 Generating Sample 1: RoomBae Tax Invoice PDF...');
  const invoiceHtml = renderInvoiceHtml({
    invoiceNumber: 'INV-2026-AUG-8891',
    status: 'PAID',
    billingMonth: 8,
    billingYear: 2026,
    issueDate: new Date('2026-08-01'),
    dueDate: new Date('2026-08-10'),
    residentName: 'Ayushman Mukhopadhyay',
    residentEmail: 'ayushman@roombae.com',
    residentPhone: '+91 9876543210',
    pgName: 'RoomBae Indiranagar Co-Living PG',
    pgAddress: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka - 560038',
    items: [
      { description: 'Monthly Accommodation Fee (Room 302 - Bed A)', quantity: 1, unitPrice: 14500, total: 14500 },
      { description: 'High-Speed Mesh Wi-Fi & Electricity Utility', quantity: 1, unitPrice: 1200, total: 1200 },
      { description: 'Housekeeping & Linen Laundry Service', quantity: 1, unitPrice: 800, total: 800 },
    ],
    subtotal: 16500,
    gstPercentage: 18,
    gstAmount: 2970,
    fineAmount: 0,
    totalAmount: 19470,
    amountPaid: 19470,
    balanceDue: 0,
  });

  const invoiceBuffer = await PdfBrowserManager.generatePdfFromHtml(invoiceHtml);
  fs.writeFileSync(path.join(outputDir, 'sample_invoice.pdf'), invoiceBuffer);
  console.log(`✅ Invoice PDF written (${invoiceBuffer.length} bytes)`);

  console.log('🎨 Generating Sample 2: RoomBae Payment Receipt PDF...');
  const receiptHtml = renderReceiptHtml({
    receiptNumber: 'REC-2026-08-9901',
    paymentId: 'pay_rzp_live_9988112233',
    paymentDate: new Date('2026-08-03T14:22:00Z'),
    paymentMethod: 'RAZORPAY_UPI',
    status: 'VERIFIED',
    purpose: 'MONTHLY_RENT',
    amount: 19470,
    payerName: 'Ayushman Mukhopadhyay',
    payerEmail: 'ayushman@roombae.com',
    payerPhone: '+91 9876543210',
    pgName: 'RoomBae Indiranagar Co-Living PG',
    pgAddress: '100 Feet Road, Indiranagar, Bengaluru, Karnataka - 560038',
    transactionId: 'txn_upi_889900112233',
  });

  const receiptBuffer = await PdfBrowserManager.generatePdfFromHtml(receiptHtml);
  fs.writeFileSync(path.join(outputDir, 'sample_receipt.pdf'), receiptBuffer);
  console.log(`✅ Receipt PDF written (${receiptBuffer.length} bytes)`);

  console.log('🎨 Generating Sample 3: RoomBae Residential Lease Agreement PDF...');
  const qrDataUrl = await QrCodeService.generateQrCodeDataUrl('https://ayushman-glb.github.io/PG-Management-System/verify-agreement?num=AGR-2026-INDIRA-001');
  const agreementHtml = renderAgreementHtml({
    agreementNumber: 'AGR-2026-INDIRA-001',
    status: 'COMPLETED',
    startDate: new Date('2026-08-01'),
    endDate: new Date('2027-07-31'),
    version: 1,
    ownerName: 'Vikramaditya PG Owner',
    ownerEmail: 'owner.vikram@roombae.com',
    ownerPhone: '+91 9123456789',
    residentName: 'Ayushman Mukhopadhyay',
    residentEmail: 'ayushman@roombae.com',
    residentPhone: '+91 9876543210',
    pgName: 'RoomBae Indiranagar Co-Living PG',
    pgAddress: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka - 560038',
    floorNumber: 3,
    roomNumber: '302',
    bedNumber: 'A',
    roomType: 'DOUBLE_AC',
    rentAmount: 14500,
    depositAmount: 29000,
    lockInPeriodMonths: 6,
    noticePeriodDays: 30,
    signatures: [
      {
        signerRole: 'RESIDENT',
        signatureType: 'AADHAAR_OTP',
        signedAt: new Date('2026-08-01T10:15:00Z'),
        ipAddress: '49.207.180.12',
      },
      {
        signerRole: 'PG_OWNER',
        signatureType: 'AADHAAR_OTP',
        signedAt: new Date('2026-08-01T11:00:00Z'),
        ipAddress: '106.51.24.89',
      },
    ],
    documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verificationUrl: 'https://ayushman-glb.github.io/PG-Management-System/verify-agreement?num=AGR-2026-INDIRA-001',
    qrCodeDataUrl: qrDataUrl,
  });

  const agreementBuffer = await PdfBrowserManager.generatePdfFromHtml(agreementHtml);
  fs.writeFileSync(path.join(outputDir, 'sample_agreement.pdf'), agreementBuffer);
  console.log(`✅ Agreement PDF written (${agreementBuffer.length} bytes)`);

  await PdfBrowserManager.closeBrowser();
  console.log('🎉 All sample PDFs generated successfully!');
}

generateSamplePdfs().catch((err) => {
  console.error('Error generating sample PDFs:', err);
  process.exit(1);
});
