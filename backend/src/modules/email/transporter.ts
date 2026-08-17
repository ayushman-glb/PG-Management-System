import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { EMAIL_CONSTANTS } from './email.constants';

/**
 * Production Gmail SMTP Transporter with connection pooling, rate-limiting, and error diagnostics
 */
export function createGmailTransporter(): nodemailer.Transporter {
  const host = env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(env.MAIL_PORT || '587', 10);
  const secure = env.MAIL_SECURE === 'true' || port === 465;
  const user = env.MAIL_USER || 'ayushman@globussoft.in';
  const pass = env.MAIL_APP_PASSWORD || '[,zZn*n6k.v%[7yX';

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    pool: true,
    maxConnections: EMAIL_CONSTANTS.SMTP.MAX_CONNECTIONS,
    maxMessages: EMAIL_CONSTANTS.SMTP.MAX_MESSAGES,
    rateDelta: EMAIL_CONSTANTS.SMTP.RATE_DELTA_MS,
    rateLimit: EMAIL_CONSTANTS.SMTP.RATE_LIMIT,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return transporter;
}

export const gmailTransporter = createGmailTransporter();

/**
 * Verify Gmail SMTP Connectivity on startup
 */
export async function verifyGmailConnection(): Promise<boolean> {
  if (env.NODE_ENV === 'test') {
    return true;
  }

  try {
    await gmailTransporter.verify();
    console.log(`✅ [Gmail SMTP] Connected successfully to ${env.MAIL_HOST || 'smtp.gmail.com'} as ${env.MAIL_USER || 'ayushman@globussoft.in'}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [Gmail SMTP] Connection verification failed: ${error.message}`);
    console.warn(`⚠️ [Gmail SMTP] Please verify that MAIL_USER and MAIL_APP_PASSWORD (16-character Google App Password) are correctly configured.`);
    return false;
  }
}

// Automatically verify on import unless running under test environment
if (env.NODE_ENV !== 'test') {
  verifyGmailConnection().catch(() => {});
}

export default gmailTransporter;
