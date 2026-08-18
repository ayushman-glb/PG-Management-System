import dns from 'dns';
import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { EMAIL_CONSTANTS } from './email.constants';

// Force IPv4-first resolution across Node DNS lookups (prevents IPv6 connection hang on Render/Docker/Linux)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

export interface SmtpHealthResult {
  status: 'healthy' | 'degraded';
  host?: string;
  port?: number;
  latency?: number;
  lastVerifiedAt?: string;
  reason?: string;
  errorDetails?: {
    code?: string;
    command?: string;
    errno?: string | number;
    address?: string;
    port?: number;
    elapsedMs?: number;
    retryCount?: number;
    message?: string;
  };
}

let smtpHealthState: SmtpHealthResult = {
  status: 'degraded',
  reason: 'UNVERIFIED',
};

let verificationInProgress: Promise<boolean> | null = null;
let transporterSingleton: nodemailer.Transporter | null = null;

/**
 * Returns strongly typed SMTP configuration derived strictly from environment variables
 */
export function getSmtpConfig() {
  const host = (env.MAIL_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(String(env.MAIL_PORT || '587').trim(), 10);
  const secure = String(env.MAIL_SECURE || 'false').trim().toLowerCase() === 'true' || port === 465;
  const user = (env.MAIL_USER || 'ayushman@globussoft.in').trim();
  const pass = (env.MAIL_APP_PASSWORD || '').trim();

  return {
    host,
    port,
    secure,
    pool: true,
    maxConnections: EMAIL_CONSTANTS.SMTP.MAX_CONNECTIONS || 5,
    maxMessages: EMAIL_CONSTANTS.SMTP.MAX_MESSAGES || 100,
    rateDelta: EMAIL_CONSTANTS.SMTP.RATE_DELTA_MS || 1000,
    rateLimit: EMAIL_CONSTANTS.SMTP.RATE_LIMIT || 14,
    auth: {
      user,
      pass,
    },
    family: 4, // Force IPv4 networking to eliminate cloud IPv6 timeout issues
    tls: {
      minVersion: 'TLSv1.2' as const,
      rejectUnauthorized: env.NODE_ENV === 'production',
    },
    connectionTimeout: 30000, // 30s connection timeout
    greetingTimeout: 30000,   // 30s greeting timeout
    socketTimeout: 30000,     // 30s socket inactivity timeout
  };
}

/**
 * Returns a sanitized configuration summary safe for logging
 */
export function getSmtpConfigSummary() {
  const cfg = getSmtpConfig();
  return {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    user: cfg.auth.user,
    hasPassword: Boolean(cfg.auth.pass && cfg.auth.pass.length > 0),
  };
}

/**
 * Safely logs SMTP environment configuration without exposing credentials
 */
export function logSmtpConfig(): void {
  const summary = getSmtpConfigSummary();
  console.log(`[INFO] [Gmail SMTP Configuration]`);
  console.log(`  Host: ${summary.host}`);
  console.log(`  Port: ${summary.port}`);
  console.log(`  Secure: ${summary.secure}`);
  console.log(`  User: ${summary.user}`);
  console.log(`  Password Present: ${summary.hasPassword}`);
}

/**
 * Creates or retrieves the singleton production-safe Gmail SMTP Transporter
 */
export function createGmailTransporter(): nodemailer.Transporter {
  if (!transporterSingleton) {
    const config = getSmtpConfig();
    transporterSingleton = nodemailer.createTransport(config as any);
  }
  return transporterSingleton;
}

export const gmailTransporter: nodemailer.Transporter = createGmailTransporter();

/**
 * Non-blocking, asynchronous SMTP verification with exponential backoff retries and structured logging
 */
export async function verifyGmailConnection(
  maxRetries: number = EMAIL_CONSTANTS.SMTP.RETRY_ATTEMPTS || 3,
  initialDelayMs: number = EMAIL_CONSTANTS.SMTP.RETRY_BASE_DELAY_MS || 1000
): Promise<boolean> {
  if (env.NODE_ENV === 'test') {
    smtpHealthState = {
      status: 'healthy',
      host: env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(String(env.MAIL_PORT || '587'), 10),
      latency: 1,
      lastVerifiedAt: new Date().toISOString(),
    };
    return true;
  }

  if (verificationInProgress) {
    return verificationInProgress;
  }

  verificationInProgress = (async () => {
    const summary = getSmtpConfigSummary();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      try {
        await gmailTransporter.verify();
        const latency = Date.now() - startTime;
        const nowIso = new Date().toISOString();

        smtpHealthState = {
          status: 'healthy',
          host: summary.host,
          port: summary.port,
          latency,
          lastVerifiedAt: nowIso,
        };

        console.log(`✅ [Gmail SMTP] Connected successfully to ${summary.host}:${summary.port} as ${summary.user} (${latency}ms)`);
        return true;
      } catch (error: any) {
        const elapsedMs = Date.now() - startTime;
        const errorCode = error.code || error.syscall || 'ETIMEDOUT';
        const errorCommand = error.command || 'CONN';
        const errorAddress = error.address || 'N/A';
        const errorPort = error.port || summary.port;

        console.warn(
          `⚠️ [Gmail SMTP] Verification Attempt ${attempt}/${maxRetries} Failed:\n` +
          `  Host: ${summary.host}\n` +
          `  Port: ${summary.port}\n` +
          `  Code: ${errorCode}\n` +
          `  Command: ${errorCommand}\n` +
          `  Address: ${errorAddress}\n` +
          `  Elapsed: ${elapsedMs}ms\n` +
          `  Retry: ${attempt}/${maxRetries}\n` +
          `  Error: ${error.message}`
        );

        smtpHealthState = {
          status: 'degraded',
          reason: errorCode,
          errorDetails: {
            code: errorCode,
            command: errorCommand,
            errno: error.errno,
            address: errorAddress,
            port: errorPort,
            elapsedMs,
            retryCount: attempt,
            message: error.message,
          },
        };

        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    console.error(`❌ [Gmail SMTP] All ${maxRetries} verification attempts failed. Operating in degraded email mode.`);
    console.warn(`⚠️ [Gmail SMTP] Please verify that MAIL_USER and MAIL_APP_PASSWORD (16-character Google App Password) are correctly configured.`);
    return false;
  })().finally(() => {
    verificationInProgress = null;
  });

  return verificationInProgress;
}

/**
 * Returns current SMTP health telemetry for health probe endpoints
 */
export function getSmtpHealth(): SmtpHealthResult {
  return { ...smtpHealthState };
}

// Automatically initiate non-blocking verification in background on startup
if (env.NODE_ENV !== 'test') {
  verifyGmailConnection().catch(() => {});
}

export default gmailTransporter;
