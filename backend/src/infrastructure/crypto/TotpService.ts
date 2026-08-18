import * as crypto from "crypto";
import QRCode from "qrcode";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export class TotpService {
  private static readonly OTP_DIGITS = 6;
  private static readonly OTP_PERIOD = 30;
  private static readonly OTP_WINDOW = 1;

  static generateSecret(): string {
    const bytes = crypto.randomBytes(20);
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      result += BASE32_CHARS[bytes[i] % 32];
    }
    return result;
  }

  static generateQrCodeUrl(secret: string, accountName: string, issuer: string = "RoomBae"): string {
    const otpauthUrl = this.buildOtpAuthUrl(secret, accountName, issuer);
    return otpauthUrl;
  }

  static async generateQrCodeImage(secret: string, accountName: string, issuer: string = "RoomBae"): Promise<string> {
    const otpauthUrl = this.buildOtpAuthUrl(secret, accountName, issuer);
    const dataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    return dataUrl;
  }

  static verifyToken(secret: string, token: string, window: number = this.OTP_WINDOW): boolean {
    if (!token || token.length !== this.OTP_DIGITS || !/^\d+$/.test(token)) {
      return false;
    }

    const key = Buffer.from(this.base32ToHex(secret), "hex");

    for (let i = -window; i <= window; i++) {
      const time = Math.floor(Date.now() / 1000 / this.OTP_PERIOD) + i;
      const expected = this.generateOtpForKey(key, time);
      if (this.constantTimeCompare(token, expected)) {
        return true;
      }
    }

    return false;
  }

  // DEV-ONLY: remove or verify gated before production deploy
  static generateCurrentToken(secret: string): string {
    const key = Buffer.from(this.base32ToHex(secret), "hex");
    const time = Math.floor(Date.now() / 1000 / this.OTP_PERIOD);
    return this.generateOtpForKey(key, time);
  }

  private static buildOtpAuthUrl(secret: string, accountName: string, issuer: string): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${this.OTP_DIGITS}&period=${this.OTP_PERIOD}`;
  }

  private static generateOtpForKey(key: Buffer, time: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(Math.floor(time / 0x100000000), 0);
    buffer.writeUInt32BE(time & 0xffffffff, 4);

    const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (hmac.readUInt32BE(offset) & 0x7fffffff) % Math.pow(10, this.OTP_DIGITS);

    return code.toString().padStart(this.OTP_DIGITS, "0");
  }

  private static base32ToHex(base32: string): string {
    const lookup: Record<string, number> = {};
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    for (let i = 0; i < chars.length; i++) {
      lookup[chars[i]] = i;
    }

    let bits = "";
    let hex = "";

    for (let i = 0; i < base32.length; i++) {
      const val = lookup[base32[i]];
      if (val === undefined) continue;
      bits += val.toString(2).padStart(5, "0");
    }

    for (let i = 0; i + 8 <= bits.length; i += 8) {
      hex += parseInt(bits.substring(i, i + 8), 2).toString(16);
    }

    return hex;
  }

  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}
