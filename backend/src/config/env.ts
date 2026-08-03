import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env before configuration initialization
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  API_PREFIX: z.string().default('/api/v1'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_SECRET: z.string().default('roombae_default_jwt_secret_key_32bytes_long!!'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  SESSION_SECRET: z.string().default('roombae_default_session_secret_32bytes!!'),
  AES_256_KEY: z.string().default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  RAZORPAY_KEY_ID: z.string().default('rzp_test_mock_key'),
  RAZORPAY_KEY_SECRET: z.string().default('mock_razorpay_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().default('mock_webhook_secret'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:5000/api/v1/auth/google/callback'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().default('noreply@roombae.com'),
  SMTP_PASS: z.string().default('mock_password'),
  EMAIL_FROM: z.string().default('RoomBae Security <noreply@roombae.com>'),
  SMS_API_KEY: z.string().default('mock_sms_api_key'),
  NOMINATIM_USER_AGENT: z.string().default('RoomBae-PG-Management/1.0')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.warn('⚠️ Environment Validation Warnings:', parsedEnv.error.format());
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
export const resolvedPort = parseInt(process.env.PORT || env.PORT || '5000', 10);
