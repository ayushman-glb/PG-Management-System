import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { z } from "zod";

// Determine active environment (default to 'development')
const nodeEnv = process.env.NODE_ENV || "development";

// Target environment file selection: .env.${NODE_ENV} -> .env fallback
const cwd = process.cwd();
const customEnvPath = process.env.DOTENV_CONFIG_PATH;
const envFile = customEnvPath || path.resolve(cwd, `.env.${nodeEnv}`);
const fallbackEnvFile = path.resolve(cwd, ".env");

if (customEnvPath && fs.existsSync(customEnvPath)) {
  dotenv.config({ path: customEnvPath });
} else {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  }
  if (fs.existsSync(fallbackEnvFile)) {
    dotenv.config({ path: fallbackEnvFile, override: false });
  }
}

// Normalize duplicate alias variables prior to Zod validation
if (!process.env.DATABASE_URL && process.env.MONGODB_URI) {
  process.env.DATABASE_URL = process.env.MONGODB_URI;
}
if (!process.env.MONGODB_URI && process.env.DATABASE_URL) {
  process.env.MONGODB_URI = process.env.DATABASE_URL;
}
if (!process.env.FRONTEND_URL && process.env.CLIENT_URL) {
  process.env.FRONTEND_URL = process.env.CLIENT_URL;
}
if (!process.env.CLIENT_URL && process.env.FRONTEND_URL) {
  process.env.CLIENT_URL = process.env.FRONTEND_URL;
}
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes("ayushman-glb.github.io") && !process.env.FRONTEND_URL.includes("PG-Management-System")) {
  process.env.FRONTEND_URL = `${process.env.FRONTEND_URL.replace(/\/$/, "")}/PG-Management-System`;
}
if (process.env.CLIENT_URL && process.env.CLIENT_URL.includes("ayushman-glb.github.io") && !process.env.CLIENT_URL.includes("PG-Management-System")) {
  process.env.CLIENT_URL = `${process.env.CLIENT_URL.replace(/\/$/, "")}/PG-Management-System`;
}
if (!process.env.JWT_REFRESH_SECRET && process.env.JWT_SECRET) {
  process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
}
if (!process.env.COOKIE_SECRET && process.env.SESSION_SECRET) {
  process.env.COOKIE_SECRET = process.env.SESSION_SECRET;
}
if (!process.env.CSRF_SECRET && process.env.SESSION_SECRET) {
  process.env.CSRF_SECRET = process.env.SESSION_SECRET;
}
if (!process.env.PASSWORD_RESET_SECRET && process.env.JWT_SECRET) {
  process.env.PASSWORD_RESET_SECRET = process.env.JWT_SECRET;
}
if (!process.env.EMAIL_VERIFICATION_SECRET && process.env.JWT_SECRET) {
  process.env.EMAIL_VERIFICATION_SECRET = process.env.JWT_SECRET;
}
if (!process.env.API_KEY_SECRET && process.env.JWT_SECRET) {
  process.env.API_KEY_SECRET = process.env.JWT_SECRET;
}

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  API_BASE_URL: z.string().default("http://localhost:5000"),
  API_PREFIX: z.string().default("/api/v1"),
  REST_PREFIX: z.string().default("/api/v1"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters long"),
  JWT_ACCESS_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters long"),
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters long"),
  CSRF_SECRET: z.string().min(16, "CSRF_SECRET must be at least 16 characters long"),
  PASSWORD_RESET_SECRET: z.string().min(16, "PASSWORD_RESET_SECRET must be at least 16 characters long"),
  EMAIL_VERIFICATION_SECRET: z.string().min(16, "EMAIL_VERIFICATION_SECRET must be at least 16 characters long"),
  API_KEY_SECRET: z.string().min(16, "API_KEY_SECRET must be at least 16 characters long"),

  AES_256_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  ENCRYPTION_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),
  KYC_ENCRYPTION_KEY: z.string().default("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"),

  RAZORPAY_KEY_ID: z.string().default("rzp_test_mock_key"),
  RAZORPAY_KEY_SECRET: z.string().default("mock_razorpay_secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("mock_webhook_secret"),

  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:5000/api/v1/auth/google/callback"),

  SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
  SMTP_PORT: z.string().default("587"),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  EMAIL_FROM: z.string().default("RoomBae Enterprise <noreply@roombae.com>"),

  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_FOLDER_PREFIX: z.string().default(`RoomBae-${nodeEnv}`),

  CLAMAV_HOST: z.string().default("localhost"),
  CLAMAV_PORT: z.string().default("3310"),
  UPLOAD_MAX_SIZE: z.string().default("10485760"),
  ALLOWED_IMAGE_TYPES: z.string().default("image/jpeg,image/jpg,image/png,image/webp,image/avif"),
  ALLOWED_DOCUMENT_TYPES: z.string().default("application/pdf"),
  GOOGLE_CLOUD_PROJECT_ID: z.string().default("roombae-cff13"),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  SMS_API_KEY: z.string().default("mock_sms_api_key"),
  NOMINATIM_USER_AGENT: z.string().default("RoomBae-PG-Management/1.0"),
  CLUSTER_MODE: z.string().default("false"),

});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const formattedErrors = parseResult.error.issues
    .map((issue) => `  ❌ [${issue.path.join(".")}]: ${issue.message}`)
    .join("\n");
  console.error("❌ CRITICAL: Environment Variable Validation Failed!\n" + formattedErrors);
  throw new Error(`CRITICAL: Environment validation failed.\n${formattedErrors}`);
}

export const env = parseResult.data;
export const resolvedPort = parseInt(env.PORT || "5000", 10);
