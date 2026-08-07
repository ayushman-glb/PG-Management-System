import { BasePdfGenerator, BRAND, PdfDocInstance } from './BasePdfGenerator';

export interface InvoiceSnapshot {
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate?: string | Date | null;
  paymentStatus: string;
  paymentMethod: string;
  paymentDate?: string | Date | null;
  currency: string;
  transactionRef?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  // Seller / Owner
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  ownerAddress?: string;
  ownerGstin?: string;
  // Customer / Resident
  residentName: string;
  residentEmail?: string;
  residentPhone?: string;
  residentCode?: string;
  residentAddress?: string;
  // Property
  pgName?: string;
  pgAddress?: string;
  pgCity?: string;
  roomNumber?: string;
  bedNumber?: string;
  // Amounts
  baseAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  lateFee?: number;
  totalAmount: number;
}

export class InvoicePdfGenerator extends BasePdfGenerator {
  async generate(snapshot: InvoiceSnapshot): Promise<Buffer> {
    return this.generateBuffer(async (doc) => {
      await this.buildInvoice(doc, snapshot);
    });
  }

  private async buildInvoice(doc: PdfDocInstance, s: InvoiceSnapshot): Promise<void> {
    // --- Page 1 ---
    this.renderWatermark(doc, 'TAX INVOICE');
    this.renderHeader(doc, 'OFFICIAL GST TAX INVOICE & RECEIPT', 'Computer-Generated — Valid for HRA / Tax Deduction');

    let curY = 105;

    // --- Invoice Metadata (left) & Billed To (right) ---
    const leftInfoY = curY;
    this.renderInfoBlock(doc, BRAND.marginH, leftInfoY, 230, 'INVOICE DETAILS', [
      { label: 'Invoice No', value: s.invoiceNumber },
      { label: 'Date of Issue', value: this.formatDate(s.invoiceDate) },
      { label: 'Due Date', value: s.dueDate ? this.formatDate(s.dueDate) : 'Immediate' },
      { label: 'Payment Status', value: s.paymentStatus },
      { label: 'Payment Method', value: s.paymentMethod },
      { label: 'Payment Date', value: this.formatDate(s.paymentDate) },
    ]);

    this.renderInfoBlock(doc, 300, leftInfoY, 245, 'BILLED TO', [
      { label: 'Resident', value: s.residentName },
      { label: 'Code', value: s.residentCode ?? 'N/A' },
      { label: 'Phone', value: s.residentPhone ?? 'N/A' },
      { label: 'Email', value: s.residentEmail ?? 'N/A' },
      { label: 'Address', value: s.residentAddress ?? 'N/A' },
    ]);

    curY = leftInfoY + 92;

    // --- Seller Info ---
    if (s.ownerName || s.pgName) {
      this.renderInfoBlock(doc, BRAND.marginH, curY, 230, 'SERVICE PROVIDER', [
        { label: 'Owner', value: s.ownerName ?? 'RoomBae Owner' },
        { label: 'PG Property', value: s.pgName ?? 'N/A' },
        { label: 'Address', value: `${s.pgAddress ?? ''}${s.pgCity ? ', ' + s.pgCity : ''}` },
        { label: 'GSTIN', value: s.ownerGstin ?? 'Pending Registration' },
      ]);

      this.renderInfoBlock(doc, 300, curY, 245, 'ACCOMMODATION UNIT', [
        { label: 'Room', value: s.roomNumber ?? 'N/A' },
        { label: 'Bed', value: s.bedNumber ?? 'N/A' },
        { label: 'Razorpay Order', value: s.razorpayOrderId ?? 'N/A' },
        { label: 'Payment Ref', value: s.razorpayPaymentId ?? 'N/A' },
      ]);

      curY += 65;
    }

    // Divider
    doc.strokeColor(BRAND.lineColor).lineWidth(1).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // --- Line Items Table ---
    const TABLE_COLS = [
      { label: 'ITEM DESCRIPTION', x: 60, width: 270, align: 'left' as const },
      { label: 'TAX %', x: 340, width: 70, align: 'center' as const },
      { label: 'AMOUNT (INR)', x: 420, width: 115, align: 'right' as const },
    ];

    this.renderTableHeader(doc, curY, TABLE_COLS);
    curY += 26;

    const items: Array<{ desc: string; tax: string; amount: number }> = [
      { desc: 'Monthly PG Accommodation / Rent Charges', tax: 'Exempt', amount: s.baseAmount },
    ];
    if ((s.cgstAmount ?? 0) > 0) items.push({ desc: 'Central Goods & Services Tax (CGST)', tax: '9%', amount: s.cgstAmount! });
    if ((s.sgstAmount ?? 0) > 0) items.push({ desc: 'State Goods & Services Tax (SGST)', tax: '9%', amount: s.sgstAmount! });
    if ((s.igstAmount ?? 0) > 0) items.push({ desc: 'Integrated Goods & Services Tax (IGST)', tax: '18%', amount: s.igstAmount! });
    if ((s.lateFee ?? 0) > 0) items.push({ desc: 'Late Payment Penalty / Settlement Fee', tax: 'N/A', amount: s.lateFee! });

    for (let i = 0; i < items.length; i++) {
      // Check for page overflow
      if (curY > 760) {
        doc.addPage();
        this.renderWatermark(doc, 'TAX INVOICE');
        curY = BRAND.marginV + 20;
        this.renderTableHeader(doc, curY, TABLE_COLS);
        curY += 26;
      }

      this.renderTableRow(doc, curY, i, [
        { value: items[i].desc, x: 60, width: 270 },
        { value: items[i].tax, x: 340, width: 70, align: 'center' },
        { value: this.formatCurrency(items[i].amount), x: 420, width: 115, align: 'right' },
      ]);
      curY += 20;
    }

    // Sub-divider
    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY + 5).lineTo(545, curY + 5).stroke();
    curY += 14;

    // Total box
    this.renderTotalBox(doc, curY, 'TOTAL AMOUNT:', this.formatCurrency(s.totalAmount));
    curY += 42;

    // Status badge
    const statusColor = s.paymentStatus === 'PAID' ? BRAND.successGreen
      : s.paymentStatus === 'PENDING' ? BRAND.warningAmber
      : BRAND.dangerRed;
    doc.rect(BRAND.marginH, curY, 90, 22).fill(statusColor);
    doc.fillColor(BRAND.white).fontSize(9).font('Helvetica-Bold');
    doc.text(s.paymentStatus, BRAND.marginH, curY + 7, { width: 90, align: 'center' });
    curY += 36;

    // --- QR Verification ---
    const qrPayload = `https://roombae.com/verify-invoice?num=${encodeURIComponent(s.invoiceNumber)}&amount=${s.totalAmount}&status=${s.paymentStatus}`;
    await this.renderQrSection(
      doc,
      curY,
      qrPayload,
      'SCAN TO VERIFY INVOICE',
      `Invoice: ${s.invoiceNumber} | Ref: ${s.razorpayPaymentId ?? 'N/A'} | Valid for Tax Deduction (HRA) | ` +
      `Issued by RoomBae Co-Living Systems | ${this.formatDate(s.invoiceDate)}`
    );

    // Footer
    this.renderFooter(doc, 1, 1);
  }
}
