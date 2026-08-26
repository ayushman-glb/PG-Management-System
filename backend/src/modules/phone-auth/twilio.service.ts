export class TwilioService {
  async sendSms(to: string, message: string): Promise<any> {
    return { success: true, messageId: `msg_${Date.now()}` };
  }
}
