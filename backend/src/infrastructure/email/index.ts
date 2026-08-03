export class EmailService {
  static async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  }
}
