import QRCode from "qrcode";

export class QrCodeService {
  /**
   * Generates a PNG Buffer representation of a QR Code for embedding in PDFKit documents
   * @param payload String payload (URL, invoice verification payload, or transaction ID)
   * @param width Desired width in pixels (default 150)
   */
  static async generateQrCodeBuffer(payload: string, width: number = 150): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(payload, {
        type: "png",
        width,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("❌ QrCodeService Error generating QR buffer:", error);
      // Fallback: Return empty transparent 1x1 buffer or handle gracefully
      throw error;
    }
  }

  /**
   * Generates a Data URL string representation of a QR Code
   */
  static async generateQrCodeDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, { margin: 1 });
  }
}
