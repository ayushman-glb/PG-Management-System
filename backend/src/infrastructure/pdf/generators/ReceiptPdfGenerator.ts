import { BasePdfGenerator, BRAND, PdfDocInstance } from './BasePdfGenerator';

export interface ReceiptSnapshot {
  receiptNumber: string;
  receiptDate: string | Date;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  // Parties
  residentName: string;
  residentCode?: string;
  residentPhone?: string;
  residentEmail?: string;
  ownerName?: string;
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
  totalAmount: number;
  amountPaid: number;
  balance?: number;
}

export class ReceiptPdfGenerator extends BasePdfGenerator {
  async generate(snapshot: ReceiptSnapshot): Promise<Buffer> {
    return this.generateBuffer(async (doc) => {
      await this.buildReceipt(doc, snapshot);
    });
  }

  private async buildReceipt(doc: PdfDocInstance, s: ReceiptSnapshot): Promise<void> {
    this.renderWatermark(doc, 'PAYMENT RECEIPT');
    this.renderHeader(doc, 'OFFICIAL PAYMENT RECEIPT', 'Computer-Generated — Valid Proof of Payment');

    let curY = 108;

    // Left: Receipt metadata
    this.renderInfoBlock(doc, BRAND.marginH, curY, 230, 'RECEIPT DETAILS', [
      { label: 'Receipt No', value: s.receiptNumber },
      { label: 'Date', value: this.formatDate(s.receiptDate) },
      { label: 'Payment Method', value: s.paymentMethod },
      { label: 'Status', value: s.paymentStatus },
      { label: 'Transaction Ref', value: s.transactionRef ?? 'N/A' },
    ]);

    // Right: Resident info
    this.renderInfoBlock(doc, 300, curY, 245, 'RECEIVED FROM', [
      { label: 'Resident', value: s.residentName },
      { label: 'Code', value: s.residentCode ?? 'N/A' },
      { label: 'Phone', value: s.residentPhone ?? 'N/A' },
      { label: 'PG Property', value: s.pgName ?? 'N/A' },
      { label: 'Room / Bed', value: `${s.roomNumber ?? 'N/A'} / ${s.bedNumber ?? 'N/A'}` },
    ]);

    curY += 80;

    // Razorpay info
    this.renderInfoBlock(doc, BRAND.marginH, curY, 495, 'GATEWAY PAYMENT DETAILS', [
      { label: 'Razorpay Order ID', value: s.razorpayOrderId ?? 'N/A' },
      { label: 'Razorpay Payment ID', value: s.razorpayPaymentId ?? 'N/A' },
    ]);

    curY += 42;

    doc.strokeColor(BRAND.lineColor).lineWidth(1).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // Amount table
    const TABLE_COLS = [
      { label: 'DESCRIPTION', x: 60, width: 310, align: 'left' as const },
      { label: 'TAX', x: 380, width: 60, align: 'center' as const },
      { label: 'AMOUNT (INR)', x: 448, width: 87, align: 'right' as const },
    ];
    this.renderTableHeader(doc, curY, TABLE_COLS);
    curY += 26;

    const rows = [
      { desc: 'PG Monthly Rent / Accommodation', tax: 'Exempt', amount: s.baseAmount },
    ];
    if ((s.cgstAmount ?? 0) > 0) rows.push({ desc: 'CGST @ 9%', tax: '9%', amount: s.cgstAmount! });
    if ((s.sgstAmount ?? 0) > 0) rows.push({ desc: 'SGST @ 9%', tax: '9%', amount: s.sgstAmount! });
    if ((s.igstAmount ?? 0) > 0) rows.push({ desc: 'IGST @ 18%', tax: '18%', amount: s.igstAmount! });

    for (let i = 0; i < rows.length; i++) {
      this.renderTableRow(doc, curY, i, [
        { value: rows[i].desc, x: 60, width: 310 },
        { value: rows[i].tax, x: 380, width: 60, align: 'center' },
        { value: this.formatCurrency(rows[i].amount), x: 448, width: 87, align: 'right' },
      ]);
      curY += 20;
    }

    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY + 4).lineTo(545, curY + 4).stroke();
    curY += 14;

    // Totals section
    const totalsX = 300;
    const totalsW = 245;
    doc.fontSize(8.5).font('Helvetica').fillColor(BRAND.textSecondary);
    doc.text('Total Charged:', totalsX, curY, { width: totalsW / 2 });
    doc.text(this.formatCurrency(s.totalAmount), totalsX + totalsW / 2, curY, { width: totalsW / 2, align: 'right' });
    curY += 14;
    doc.text('Amount Received:', totalsX, curY, { width: totalsW / 2 });
    doc.text(this.formatCurrency(s.amountPaid), totalsX + totalsW / 2, curY, { width: totalsW / 2, align: 'right' });
    curY += 14;
    const balance = s.balance ?? (s.totalAmount - s.amountPaid);
    doc.fillColor(balance > 0 ? BRAND.dangerRed : BRAND.successGreen);
    doc.text('Balance Due:', totalsX, curY, { width: totalsW / 2 });
    doc.text(this.formatCurrency(balance), totalsX + totalsW / 2, curY, { width: totalsW / 2, align: 'right' });
    curY += 28;

    this.renderTotalBox(doc, curY, 'AMOUNT RECEIVED:', this.formatCurrency(s.amountPaid));
    curY += 44;

    // QR code
    const qrPayload = `https://roombae.com/verify-receipt?num=${encodeURIComponent(s.receiptNumber)}&amount=${s.amountPaid}&status=${s.paymentStatus}`;
    await this.renderQrSection(
      doc,
      curY,
      qrPayload,
      'SCAN TO VERIFY PAYMENT',
      `Receipt: ${s.receiptNumber} | Ref: ${s.razorpayPaymentId ?? 'N/A'} | ${this.formatDate(s.receiptDate)}`
    );

    this.renderFooter(doc, 1, 1);
  }
}
