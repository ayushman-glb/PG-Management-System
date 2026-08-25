const path = require('path');
const {
  renderInvoiceHtml,
  renderReceiptHtml,
  renderAgreementHtml,
  PdfBrowserManager,
} = require(path.resolve(__dirname, '../dist/src/utils/pdf'));

async function testProductionDistPdf() {
  process.env.NODE_ENV = 'production';
  console.log('Testing Production Mode PDF Generation from dist/... (NODE_ENV=production)');

  const t0 = Date.now();
  const invoiceHtml = renderInvoiceHtml({
    invoiceNumber: 'INV-PROD-001',
    status: 'PAID',
    billingMonth: 8,
    billingYear: 2026,
    issueDate: new Date(),
    dueDate: new Date(),
    residentName: 'Prod Test Resident',
    residentEmail: 'prod@example.com',
    pgName: 'RoomBae Prod PG',
    items: [{ description: 'Monthly Rent', quantity: 1, unitPrice: 15000, total: 15000 }],
    subtotal: 15000,
    gstPercentage: 18,
    gstAmount: 2700,
    totalAmount: 17700,
    amountPaid: 17700,
    balanceDue: 0,
  });

  const pdfBuffer = await PdfBrowserManager.generatePdfFromHtml(invoiceHtml);
  const t1 = Date.now();

  const magic = pdfBuffer.subarray(0, 5).toString('utf-8');
  console.log(`✅ Production Invoice PDF generated in ${t1 - t0}ms (${pdfBuffer.length} bytes, Magic: ${magic})`);

  if (magic !== '%PDF-') {
    throw new Error(`Invalid PDF header: ${magic}`);
  }

  // Test sequential generation (singleton browser reuse)
  const t2 = Date.now();
  const receiptHtml = renderReceiptHtml({
    receiptNumber: 'REC-PROD-001',
    paymentId: 'pay_prod_1',
    paymentDate: new Date(),
    paymentMethod: 'RAZORPAY_UPI',
    status: 'VERIFIED',
    purpose: 'MONTHLY_RENT',
    amount: 17700,
    payerName: 'Prod Test Resident',
    payerEmail: 'prod@example.com',
  });
  const receiptBuffer = await PdfBrowserManager.generatePdfFromHtml(receiptHtml);
  const t3 = Date.now();
  console.log(`✅ Production Receipt PDF (reused browser) in ${t3 - t2}ms (${receiptBuffer.length} bytes)`);

  await PdfBrowserManager.closeBrowser();
  console.log('🎉 Production dist verification passed successfully!');
}

testProductionDistPdf().catch((err) => {
  console.error('❌ Production dist verification failed:', err);
  process.exit(1);
});
