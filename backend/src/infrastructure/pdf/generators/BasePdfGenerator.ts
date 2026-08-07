import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { QrCodeService } from '../../../utils/pdf/QrCodeService';

// Brand palette
export const BRAND = {
  darkBg: '#0F172A',
  darkBg2: '#1E293B',
  brandOrange: '#D9A87C',
  brandOrangeDark: '#C58B63',
  successGreen: '#059669',
  warningAmber: '#D97706',
  dangerRed: '#DC2626',
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  lineColor: '#E2E8F0',
  rowAlt: '#F8FAFC',
  white: '#FFFFFF',
  pageWidth: 595,
  pageHeight: 842,
  marginH: 50,
  marginV: 45,
  contentWidth: 495,
} as const;

export type PdfDocInstance = InstanceType<typeof PDFDocument>;

export interface PdfGeneratorOptions {
  title: string;
  subtitle: string;
  watermarkText: string;
}

export abstract class BasePdfGenerator {
  /**
   * Generate a complete PDF as a Buffer. This is the ONLY entry point —
   * resolves only after doc.end() + all 'data' events are emitted.
   */
  protected generateBuffer(buildFn: (doc: PdfDocInstance) => Promise<void>): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: BRAND.marginH, size: 'A4', autoFirstPage: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      buildFn(doc)
        .then(() => { doc.end(); })
        .catch((err) => {
          doc.end();
          reject(err);
        });
    });
  }

  /**
   * Validate that a buffer is a real PDF
   */
  static validatePdfBuffer(buf: Buffer): boolean {
    if (!buf || buf.length < 16) return false;
    const header = buf.slice(0, 5).toString('ascii');
    return header === '%PDF-';
  }

  /**
   * Calculate SHA-256 hash of buffer
   */
  static sha256(buf: Buffer): string {
    return crypto.createHash('sha256').update(buf).digest('hex');
  }

  /**
   * Render RoomBae logo (file if available, else vector badge fallback)
   */
  protected renderLogo(doc: PdfDocInstance, x: number, y: number, width = 110, height = 36): void {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'assets', 'logo.png'),
      path.join(process.cwd(), 'assets', 'logo.png'),
      path.join(__dirname, '..', '..', '..', '..', 'public', 'assets', 'logo.png'),
    ];

    const found = candidatePaths.find(p => fs.existsSync(p));
    if (found) {
      try {
        doc.image(found, x, y, { width, height });
        return;
      } catch {
        // fall through to vector badge
      }
    }

    // Vector brand badge fallback — works in any environment
    doc.save();
    doc.roundedRect(x, y, width, height, 6).fillAndStroke(BRAND.darkBg2, BRAND.brandOrange);
    doc.fillColor(BRAND.white).fontSize(13).font('Helvetica-Bold');
    doc.text('RoomBae', x, y + height / 2 - 7, { width, align: 'center' });
    doc.restore();
  }

  /**
   * Render watermark diagonally across page
   */
  protected renderWatermark(doc: PdfDocInstance, text: string): void {
    doc.save();
    doc.fillColor('#CBD5E1').opacity(0.10);
    doc.fontSize(52).font('Helvetica-Bold');
    doc.rotate(-42, { origin: [298, 421] });
    doc.text(text, 50, 421, { width: 495, align: 'center' });
    doc.restore();
    doc.opacity(1);
  }

  /**
   * Draw a full-width header with logo and document title
   */
  protected renderHeader(
    doc: PdfDocInstance,
    title: string,
    subtitle: string,
  ): void {
    this.renderLogo(doc, BRAND.marginH, BRAND.marginV, 110, 36);

    doc.fillColor(BRAND.darkBg)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('ROOMBAE CO-LIVING SYSTEMS', 170, BRAND.marginV, { align: 'right', width: 375 });

    doc.fillColor(BRAND.textSecondary)
      .fontSize(8.5)
      .font('Helvetica')
      .text(title, 170, BRAND.marginV + 22, { align: 'right', width: 375 });

    doc.fillColor(BRAND.textMuted)
      .fontSize(7.5)
      .text(subtitle, 170, BRAND.marginV + 33, { align: 'right', width: 375 });

    // Header divider
    doc.strokeColor(BRAND.lineColor).lineWidth(1.5)
      .moveTo(BRAND.marginH, 90).lineTo(545, 90).stroke();
  }

  /**
   * Draw professional footer on current page
   */
  protected renderFooter(doc: PdfDocInstance, pageNum: number, totalPages: number): void {
    const y = 815;
    doc.strokeColor(BRAND.lineColor).lineWidth(0.5)
      .moveTo(BRAND.marginH, y - 8).lineTo(545, y - 8).stroke();

    doc.fillColor(BRAND.textMuted).fontSize(7).font('Helvetica');
    doc.text(
      'This is a computer-generated document. No physical signature required. RoomBae Co-Living Systems © 2026',
      BRAND.marginH, y, { align: 'left', width: 360 }
    );
    doc.text(`Page ${pageNum} of ${totalPages}`, BRAND.marginH, y, { align: 'right', width: BRAND.contentWidth });
  }

  /**
   * Format a number as Indian currency (₹X,XX,XXX.XX)
   */
  protected formatCurrency(amount: number | null | undefined): string {
    const val = Number(amount ?? 0);
    return `\u20B9${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format a Date or ISO string as DD/MM/YYYY
   */
  protected formatDate(d: Date | string | null | undefined): string {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /**
   * Draw a table header row (dark navy background)
   */
  protected renderTableHeader(doc: PdfDocInstance, y: number, columns: Array<{ label: string; x: number; width: number; align?: 'left' | 'right' | 'center' }>): void {
    doc.rect(BRAND.marginH, y, BRAND.contentWidth, 22).fill(BRAND.darkBg2);
    doc.fillColor(BRAND.white).fontSize(8.5).font('Helvetica-Bold');
    for (const col of columns) {
      doc.text(col.label, col.x, y + 7, { width: col.width, align: col.align ?? 'left' });
    }
  }

  /**
   * Draw alternating-row table data cell
   */
  protected renderTableRow(
    doc: PdfDocInstance,
    y: number,
    rowIndex: number,
    columns: Array<{ value: string; x: number; width: number; align?: 'left' | 'right' | 'center'; color?: string }>
  ): void {
    if (rowIndex % 2 === 1) {
      doc.rect(BRAND.marginH, y - 2, BRAND.contentWidth, 20).fill(BRAND.rowAlt);
    }
    doc.font('Helvetica').fontSize(8.5);
    for (const col of columns) {
      doc.fillColor(col.color ?? BRAND.textSecondary);
      doc.text(col.value, col.x, y, { width: col.width, align: col.align ?? 'left' });
    }
  }

  /**
   * Draw green total amount box
   */
  protected renderTotalBox(doc: PdfDocInstance, y: number, label: string, amount: string): void {
    doc.rect(290, y, 255, 28).fill(BRAND.successGreen);
    doc.fillColor(BRAND.white).fontSize(10).font('Helvetica-Bold');
    doc.text(label, 298, y + 9, { width: 120 });
    doc.text(amount, 298, y + 9, { width: 237, align: 'right' });
  }

  /**
   * Render a QR code verification section
   */
  protected async renderQrSection(doc: PdfDocInstance, y: number, payload: string, label: string, additionalText: string): Promise<void> {
    try {
      const qrBuf = await QrCodeService.generateQrCodeBuffer(payload, 100);
      doc.image(qrBuf, BRAND.marginH, y, { width: 75, height: 75 });
    } catch {
      // QR generation failed — draw placeholder
      doc.rect(BRAND.marginH, y, 75, 75).stroke(BRAND.lineColor);
      doc.fillColor(BRAND.textMuted).fontSize(7).text('QR', BRAND.marginH + 28, y + 30);
    }

    const textX = BRAND.marginH + 85;
    doc.fillColor(BRAND.darkBg).fontSize(8.5).font('Helvetica-Bold').text(label, textX, y + 8);
    doc.fillColor(BRAND.textSecondary).fontSize(7.5).font('Helvetica');
    doc.text(additionalText, textX, y + 22, { width: 380 });
  }

  /**
   * Draw a 2-column info block (label: value pairs)
   */
  protected renderInfoBlock(
    doc: PdfDocInstance,
    x: number,
    y: number,
    width: number,
    heading: string,
    rows: Array<{ label: string; value: string }>
  ): number {
    doc.fillColor(BRAND.darkBg).fontSize(9).font('Helvetica-Bold').text(heading, x, y);
    let curY = y + 14;
    doc.fontSize(8).font('Helvetica');
    for (const row of rows) {
      doc.fillColor(BRAND.textMuted).text(`${row.label}:`, x, curY, { continued: true, width: width / 2 });
      doc.fillColor(BRAND.textSecondary).text(` ${row.value || 'N/A'}`, { width: width - width / 2 });
      curY += 13;
    }
    return curY;
  }
}
