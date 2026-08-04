import fs from "fs";
import PDFDocument from "pdfkit";

export class PdfHelpers {
  /**
   * Safe image rendering: draws image if file path exists on disk,
   * otherwise renders a stylized vector brand box fallback.
   */
  static renderSafeImage(
    doc: InstanceType<typeof PDFDocument>,
    imagePath: string | Buffer,
    x: number,
    y: number,
    options: { width?: number; height?: number; fallbackText?: string } = {}
  ): void {
    const width = options.width || 120;
    const height = options.height || 40;
    const fallbackText = options.fallbackText || "RoomBae";

    try {
      if (typeof imagePath === "string") {
        if (fs.existsSync(imagePath)) {
          doc.image(imagePath, x, y, { width, height });
          return;
        }
      } else if (Buffer.isBuffer(imagePath)) {
        doc.image(imagePath, x, y, { width, height });
        return;
      }
    } catch {
      // Fallback below on image load failure
    }

    // Vector Brand Badge Fallback
    doc.save();
    doc.roundedRect(x, y, width, height, 6).fillAndStroke("#1E293B", "#3b82f6");
    doc.fillColor("#FFFFFF").fontSize(11).font("Helvetica-Bold");
    doc.text(fallbackText, x, y + height / 2 - 5, { width, align: "center" });
    doc.restore();
  }

  /**
   * Draws a diagonal watermark text background across document page
   */
  static renderWatermark(
    doc: InstanceType<typeof PDFDocument>,
    watermarkText: string = "OFFICIAL DOCUMENT"
  ): void {
    doc.save();
    doc.fillColor("#CBD5E1").opacity(0.12);
    doc.fontSize(48).font("Helvetica-Bold");
    doc.rotate(-45, { origin: [300, 400] });
    doc.text(watermarkText, 50, 400, { width: 500, align: "center" });
    doc.restore();
  }

  /**
   * Renders a clean 2-column key/value data table row
   */
  static renderTableRow(
    doc: InstanceType<typeof PDFDocument>,
    y: number,
    label: string,
    value: string,
    isHeader: boolean = false
  ): void {
    doc.save();
    if (isHeader) {
      doc.rect(50, y - 2, 495, 20).fill("#F1F5F9");
      doc.fillColor("#0F172A").fontSize(10).font("Helvetica-Bold");
    } else {
      doc.fillColor("#334155").fontSize(9).font("Helvetica");
    }

    doc.text(label, 60, y, { width: 300 });
    doc.text(value, 360, y, { width: 175, align: "right" });
    doc.restore();
  }

  /**
   * Formats numeric amounts to INR currency representation
   */
  static formatCurrency(amount: number | null | undefined): string {
    const val = Number(amount || 0);
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
