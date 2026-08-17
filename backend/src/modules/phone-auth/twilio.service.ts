import twilio from 'twilio';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { normalizeIndianPhone } from './phoneAuth.validation';
import { SmsSendResult } from './phoneAuth.types';

export class TwilioService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string;
  private isConfigured: boolean = false;

  constructor() {
    const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = env.TWILIO_AUTH_TOKEN?.trim();
    this.fromNumber = env.TWILIO_PHONE_NUMBER?.trim() || '';

    if (accountSid && authToken && (accountSid.startsWith('AC') || accountSid.startsWith('SK'))) {
      try {
        if (accountSid.startsWith('SK')) {
          const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID || accountSid;
          this.client = twilio(accountSid, authToken, { accountSid: mainAccountSid });
        } else {
          this.client = twilio(accountSid, authToken);
        }
        this.isConfigured = true;
        logger.info(`📱 [Twilio SMS Service] Initialized successfully. From: ${this.fromNumber || 'Trial Default'}`);
      } catch (err: any) {
        logger.warn('⚠️ [Twilio SMS Service] Twilio client initialization note:', { note: err?.message });
      }
    } else {
      logger.warn('⚠️ [Twilio SMS Service] Credentials not fully configured. Operating in simulated SMS mode.');
    }
  }

  public isReady(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public getFromNumber(): string {
    return this.fromNumber;
  }

  /**
   * Dispatches 6-digit verification code to recipient phone number
   */
  async sendOTP(rawPhone: string, otp: string): Promise<SmsSendResult> {
    const formattedPhone = normalizeIndianPhone(rawPhone);
    const body = `RoomBae Verification\nYour verification code is:\n${otp}\nValid for 10 minutes.`;
    return this.sendSms(formattedPhone, body);
  }

  /**
   * Resends verification code with urgent delivery headers
   */
  async resendOTP(rawPhone: string, otp: string): Promise<SmsSendResult> {
    const formattedPhone = normalizeIndianPhone(rawPhone);
    const body = `RoomBae Verification\nYour new verification code is:\n${otp}\nValid for 10 minutes.`;
    return this.sendSms(formattedPhone, body);
  }

  /**
   * Sends generic transactional or security notifications to tenant/owner
   */
  async sendNotification(rawPhone: string, message: string): Promise<SmsSendResult> {
    const formattedPhone = normalizeIndianPhone(rawPhone);
    const body = `[RoomBae] ${message}`;
    return this.sendSms(formattedPhone, body);
  }

  /**
   * Core SMS sending dispatch with Twilio trial protection and error normalization
   */
  private async sendSms(toPhone: string, body: string): Promise<SmsSendResult> {
    if (!this.client || !this.isConfigured) {
      logger.info(`📱 [Twilio Simulated SMS] To: ${toPhone} | Body:\n${body}`);
      return {
        success: true,
        messageId: `sim_sms_${Date.now()}`,
        isTrialNotice: false,
      };
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.fromNumber,
        to: toPhone,
      });

      logger.info(`📱 [Twilio SMS Delivered] SID: ${message.sid} | Status: ${message.status} | To: ${toPhone}`);
      return {
        success: true,
        messageId: message.sid,
        isTrialNotice: false,
      };
    } catch (err: any) {
      const errorCode = err?.code;
      const errorMessage = err?.message || 'Twilio SMS sending failed';

      logger.error(`❌ [Twilio SMS Delivery Error] Code: ${errorCode} | To: ${toPhone} | Msg: ${errorMessage}`);

      // Handle Twilio Trial Account unverified destination number error (21608)
      if (errorCode === 21608) {
        return {
          success: false,
          error: `Twilio Trial Notice: The phone number ${toPhone} is unverified in your Twilio Trial Console. Please verify it in Twilio Caller IDs (https://www.twilio.com/user/account/phone-numbers/verified) to receive live SMS.`,
          isTrialNotice: true,
        };
      }

      // Handle invalid phone number format error (21211)
      if (errorCode === 21211) {
        return {
          success: false,
          error: `Invalid destination phone number format (${toPhone}). Please ensure it is a valid 10-digit mobile number.`,
          isTrialNotice: false,
        };
      }

      return {
        success: false,
        error: errorMessage,
        isTrialNotice: false,
      };
    }
  }
}

export const twilioService = new TwilioService();
