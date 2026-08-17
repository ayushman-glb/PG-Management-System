import { SendEmailOptions, EmailDispatchResult } from './email.types';
import { gmailTransporter } from './transporter';
import { EmailLogger } from './email.logger';
import { EMAIL_CONSTANTS } from './email.constants';
import { env } from '../../config/env';

interface QueuedJob {
  id: string;
  options: SendEmailOptions;
  attempts: number;
  maxRetries: number;
  addedAt: number;
}

export class EmailQueue {
  private static queue: QueuedJob[] = [];
  private static isProcessing = false;
  private static listeners: Array<(result: EmailDispatchResult) => void> = [];

  /**
   * Enqueue an email job for background asynchronous dispatch
   */
  static enqueue(options: SendEmailOptions, maxRetries: number = EMAIL_CONSTANTS.SMTP.RETRY_ATTEMPTS): string {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.queue.push({
      id: jobId,
      options,
      attempts: 0,
      maxRetries,
      addedAt: Date.now(),
    });

    // Start background processor if not already running
    this.processQueue().catch((err) => {
      console.error('❌ [EmailQueue] Worker encountered error:', err.message);
    });

    return jobId;
  }

  /**
   * Process all queued email jobs with retry logic
   */
  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      job.attempts += 1;
      const recipientStr = Array.isArray(job.options.to) ? job.options.to.join(', ') : job.options.to;

      try {
        const fromName = env.MAIL_FROM_NAME || 'RoomBae';
        const fromEmail = env.MAIL_FROM_EMAIL || env.MAIL_USER || 'ayushman@globussoft.in';
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        const mailPayload = {
          from: job.options.from || fromAddress,
          to: job.options.to,
          subject: job.options.subject,
          html: job.options.html,
          text: job.options.text || job.options.html.replace(/<[^>]+>/g, ' ').slice(0, 300),
          replyTo: job.options.replyTo || fromEmail,
          attachments: job.options.attachments,
        };

        const info = await gmailTransporter.sendMail(mailPayload);
        const messageId = (info && info.messageId) ? info.messageId : `msg_${Date.now()}`;

        console.log(`✉️ [Gmail SMTP Delivered] ID: ${messageId} | Recipient: ${recipientStr} | Subject: "${job.options.subject}"`);

        await EmailLogger.logDelivery({
          recipient: recipientStr,
          subject: job.options.subject,
          template: job.options.template || 'GENERIC',
          status: EMAIL_CONSTANTS.STATUS.DELIVERED,
          messageId,
          metadata: job.options.metadata,
        });

        this.notifyListeners({
          success: true,
          messageId,
          recipient: job.options.to,
        });
      } catch (err: any) {
        console.error(`❌ [Gmail SMTP Attempt ${job.attempts}/${job.maxRetries} Failed] Recipient: ${recipientStr} | Error: ${err.message}`);

        if (job.attempts < job.maxRetries) {
          const backoffDelay = EMAIL_CONSTANTS.SMTP.RETRY_BASE_DELAY_MS * Math.pow(2, job.attempts - 1);
          console.log(`🔄 [EmailQueue] Requeuing job ${job.id} with delay ${backoffDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
          this.queue.push(job);
        } else {
          await EmailLogger.logDelivery({
            recipient: recipientStr,
            subject: job.options.subject,
            template: job.options.template || 'GENERIC',
            status: EMAIL_CONSTANTS.STATUS.FAILED,
            error: err.message,
            metadata: job.options.metadata,
          });

          this.notifyListeners({
            success: false,
            error: err.message,
            recipient: job.options.to,
          });
        }
      }
    }

    this.isProcessing = false;
  }

  private static notifyListeners(result: EmailDispatchResult) {
    this.listeners.forEach((listener) => {
      try {
        listener(result);
      } catch {}
    });
  }

  static onDispatch(listener: (result: EmailDispatchResult) => void) {
    this.listeners.push(listener);
  }
}
