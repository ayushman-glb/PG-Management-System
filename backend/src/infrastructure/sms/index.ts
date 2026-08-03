export class SmsService {
  static async sendSms(phone: string, message: string): Promise<boolean> {
    console.log(`[SMS SENT] To: ${phone} | Message: ${message}`);
    return true;
  }
}
