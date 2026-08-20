import { z } from 'zod';
import { env } from './env';
import { logger } from '../utils/logger';

const SecretsSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  SESSION_SECRET: z.string().min(8).default('roombae-secure-session-secret-change-in-production'),
  COOKIE_SECRET: z.string().min(8).default('roombae-secure-cookie-secret-change-in-production'),
  ENCRYPTION_KEY: z.string().optional(),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  // Gmail / SMTP
  GMAIL_USER: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  
  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

export type AppSecrets = z.infer<typeof SecretsSchema>;

function loadAndValidateSecrets(): AppSecrets {
  try {
    const rawConfig = {
      NODE_ENV: env.NODE_ENV,
      PORT: env.PORT,
      DATABASE_URL: env.DATABASE_URL,
      JWT_SECRET: env.JWT_SECRET,
      JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
      JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
      SESSION_SECRET: env.SESSION_SECRET,
      COOKIE_SECRET: env.COOKIE_SECRET,
      ENCRYPTION_KEY: env.ENCRYPTION_KEY,
      GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
      GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL,
      CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
      GMAIL_USER: process.env.GMAIL_USER || (env as any).MAIL_USER,
      GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
      GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET,
      GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
      RAZORPAY_KEY_ID: env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: env.RAZORPAY_KEY_SECRET,
    };

    const parsed = SecretsSchema.parse(rawConfig);
    return parsed;
  } catch (error: any) {
    logger.error('❌ Fast-fail: Secrets validation failed on startup', { error: error.errors || error.message });
    if (env.NODE_ENV === 'production') {
      throw new Error(`Fatal: Invalid environment configuration: ${JSON.stringify(error.errors || error.message)}`);
    }
    // Return fallback for test/dev
    return SecretsSchema.parse({
      ...process.env,
      DATABASE_URL: env.DATABASE_URL || 'mongodb://localhost:27017/roombae',
      JWT_SECRET: env.JWT_SECRET || 'dev-secret-key-at-least-32-chars-long!',
    });
  }
}

export const secrets = loadAndValidateSecrets();
