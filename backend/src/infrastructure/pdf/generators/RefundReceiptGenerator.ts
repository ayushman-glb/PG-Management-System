import { BasePdfGenerator, BRAND, PdfDocInstance } from './BasePdfGenerator';

export interface RefundSnapshot {
  refundRef: string;
  refundDate: string | Date;
  refundStatus: string;
  refundReason: string;
  // Original transaction
  originalReceiptNumber?: string;
  originalTransactionRef?: string;
  originalRazorpayPaymentId?: string;
  originalPaymentDate?: string | Date;
  razorpayRefundId?: string;
  // Parties
  residentName: string;
  residentCode?: string;
  residentPhone?: string;
  residentEmail?: string;
  ownerName?: string;
  pgName?: string;
  pgCity?: string;
  // Amounts
  originalAmount: number;
  refundedAmount: number;
  deductions?: Array<{ label: string; amount: number }>;
  refundMethod: string;
}

export class RefundReceiptGenerator extends BasePdfGenerator {
  async generate(snapshot: RefundSnapshot): Promise<Buffer> {
    return this.generateBuffer(async (doc) => {
      await this.buildRefundReceipt(doc, snapshot);
    });
  }

  private async buildRefundReceipt(doc: PdfDocInstance, s: RefundSnapshot): Promise<void> {
    this.renderWatermark(doc, 'REFUND RECEIPT');
    this.renderHeader(doc, 'OFFICIAL REFUND RECEIPT', 'Computer-Generated Refund Confirmation');

    let curY = 108;

    // Status badge
    const statusColor = s.refundStatus === 'PROCESSED' ? BRAND.successGreen
      : s.refundStatus === 'PENDING' ? BRAND.warningAmber
      : BRAND.dangerRed;
    doc.rect(BRAND.marginH, curY, 160, 28).fill(statusColor);
    doc.fillColor(BRAND.white).fontSize(10).font('Helvetica-Bold');
    doc.text(`REFUND: ${s.refundStatus}`, BRAND.marginH, curY + 9, { width: 160, align: 'center' });

    doc.fillColor(BRAND.textSecondary).fontSize(8.5).font('Helvetica');
    doc.text(`Refund Ref: ${s.refundRef}`, 225, curY + 3, { width: 320 });
    doc.text(`Date: ${this.formatDate(s.refundDate)}`, 225, curY + 17, { width: 320 });
    curY += 44;

    doc.strokeColor(BRAND.lineColor).lineWidth(1).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // Info blocks
    this.renderInfoBlock(doc, BRAND.marginH, curY, 230, 'REFUND DETAILS', [
      { label: 'Refund Ref', value: s.refundRef },
      { label: 'Refund Date', value: this.formatDate(s.refundDate) },
      { label: 'Refund Method', value: s.refundMethod },
      { label: 'Reason', value: s.refundReason },
      { label: 'Razorpay Refund ID', value: s.razorpayRefundId ?? 'N/A' },
    ]);

    this.renderInfoBlock(doc, 300, curY, 245, 'RECIPIENT', [
      { label: 'Resident', value: s.residentName },
      { label: 'Code', value: s.residentCode ?? 'N/A' },
      { label: 'Phone', value: s.residentPhone ?? 'N/A' },
      { label: 'PG Property', value: s.pgName ?? 'N/A' },
    ]);

    curY += 82;

    // Original transaction
    this.renderInfoBlock(doc, BRAND.marginH, curY, 495, 'ORIGINAL TRANSACTION REFERENCE', [
      { label: 'Original Receipt', value: s.originalReceiptNumber ?? 'N/A' },
      { label: 'Original Payment Date', value: this.formatDate(s.originalPaymentDate) },
      { label: 'Razorpay Payment ID', value: s.originalRazorpayPaymentId ?? 'N/A' },
    ]);

    curY += 50;
    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY).lineTo(545, curY).stroke();
    curY += 12;

    // Amount breakdown table
    const TABLE_COLS = [
      { label: 'DESCRIPTION', x: 60, width: 320, align: 'left' as const },
      { label: 'AMOUNT (INR)', x: 390, width: 145, align: 'right' as const },
    ];
    this.renderTableHeader(doc, curY, TABLE_COLS);
    curY += 26;

    let rowIndex = 0;
    this.renderTableRow(doc, curY, rowIndex++, [
      { value: 'Original Amount Paid', x: 60, width: 320 },
      { value: this.formatCurrency(s.originalAmount), x: 390, width: 145, align: 'right' },
    ]);
    curY += 20;

    if (s.deductions && s.deductions.length > 0) {
      for (const ded of s.deductions) {
        this.renderTableRow(doc, curY, rowIndex++, [
          { value: `Deduction: ${ded.label}`, x: 60, width: 320 },
          { value: `- ${this.formatCurrency(ded.amount)}`, x: 390, width: 145, align: 'right', color: BRAND.dangerRed },
        ]);
        curY += 20;
      }
    }

    doc.strokeColor(BRAND.lineColor).lineWidth(0.8).moveTo(BRAND.marginH, curY + 4).lineTo(545, curY + 4).stroke();
    curY += 14;

    this.renderTotalBox(doc, curY, 'TOTAL REFUNDED:', this.formatCurrency(s.refundedAmount));
    curY += 44;

    // QR
    const qrPayload = `https://roombae.com/verify-refund?ref=${encodeURIComponent(s.refundRef)}&status=${s.refundStatus}`;
    await this.renderQrSection(
      doc, curY, qrPayload, 'SCAN TO VERIFY REFUND',
      `Refund: ${s.refundRef} | Resident: ${s.residentName} | Amount: ${this.formatCurrency(s.refundedAmount)} | ${this.formatDate(s.refundDate)}`
    );

    this.renderFooter(doc, 1, 1);
  }
}
