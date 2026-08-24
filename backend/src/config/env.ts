import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
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
if (!process.env.COOKIE_SECRET && process.env.SESSION_SECRET) {
  process.env.COOKIE_SECRET = process.env.SESSION_SECRET;
}
if (!process.env.CSRF_SECRET && process.env.SESSION_SECRET) {
  process.env.CSRF_SECRET = process.env.SESSION_SECRET;
}

// Clean placeholder CLOUDINARY_URL so Cloudinary SDK does not throw Invalid URL
if (process.env.CLOUDINARY_URL && (process.env.CLOUDINARY_URL.includes("<REPLACE") || process.env.CLOUDINARY_URL.includes("<"))) {
  delete process.env.CLOUDINARY_URL;
}

// Fallback defaults for local development / testing when env secrets are unpopulated or contain placeholders
const isDevOrTest = (process.env.NODE_ENV || "development") !== "production";

if (isDevOrTest) {
  const DEFAULT_64_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const DEFAULT_ACCESS_SECRET  = "dev_default_access_secret_key_32_chars_long!";
  const DEFAULT_REFRESH_SECRET = "dev_default_refresh_secret_key_32_chars_long!";
  const DEFAULT_SESSION_SECRET = "dev_default_session_secret_key_32_chars_long!";
  const DEFAULT_COOKIE_SECRET  = "dev_default_cookie_secret_key_32_chars_long!";
  const DEFAULT_CSRF_SECRET    = "dev_default_csrf_secret_key_32_chars_long!";
  const DEFAULT_RESET_SECRET   = "dev_default_reset_secret_key_32_chars_long!";

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("<REPLACE")) {
    process.env.DATABASE_URL = "mongodb://localhost:27017/roombae-db";
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16 || process.env.JWT_SECRET.startsWith("<REPLACE")) {
    process.env.JWT_SECRET = DEFAULT_ACCESS_SECRET;
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 16 || process.env.JWT_REFRESH_SECRET.startsWith("<REPLACE")) {
    process.env.JWT_REFRESH_SECRET = DEFAULT_REFRESH_SECRET;
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16 || process.env.SESSION_SECRET.startsWith("<REPLACE")) {
    process.env.SESSION_SECRET = DEFAULT_SESSION_SECRET;
  }
  if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 16 || process.env.COOKIE_SECRET.startsWith("<REPLACE")) {
    process.env.COOKIE_SECRET = DEFAULT_COOKIE_SECRET;
  }
  if (!process.env.CSRF_SECRET || process.env.CSRF_SECRET.length < 16 || process.env.CSRF_SECRET.startsWith("<REPLACE")) {
    process.env.CSRF_SECRET = DEFAULT_CSRF_SECRET;
  }
  if (!process.env.PASSWORD_RESET_SECRET || process.env.PASSWORD_RESET_SECRET.length < 16 || process.env.PASSWORD_RESET_SECRET.startsWith("<REPLACE")) {
    process.env.PASSWORD_RESET_SECRET = DEFAULT_RESET_SECRET;
  }
  if (!process.env.EMAIL_VERIFICATION_SECRET || process.env.EMAIL_VERIFICATION_SECRET.length < 16 || process.env.EMAIL_VERIFICATION_SECRET.startsWith("<REPLACE")) {
    process.env.EMAIL_VERIFICATION_SECRET = DEFAULT_RESET_SECRET;
  }
  if (!process.env.API_KEY_SECRET || process.env.API_KEY_SECRET.length < 16 || process.env.API_KEY_SECRET.startsWith("<REPLACE")) {
    process.env.API_KEY_SECRET = DEFAULT_ACCESS_SECRET;
  }
  if (!process.env.AES_256_KEY || process.env.AES_256_KEY.length < 32 || process.env.AES_256_KEY.startsWith("<REPLACE")) {
    process.env.AES_256_KEY = DEFAULT_64_HEX;
  }
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32 || process.env.ENCRYPTION_KEY.startsWith("<REPLACE")) {
    process.env.ENCRYPTION_KEY = DEFAULT_64_HEX;
  }
  if (!process.env.KYC_ENCRYPTION_KEY || process.env.KYC_ENCRYPTION_KEY.length < 32 || process.env.KYC_ENCRYPTION_KEY.startsWith("<REPLACE")) {
    process.env.KYC_ENCRYPTION_KEY = DEFAULT_64_HEX;
  }
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
  CACHE_TTL: z.string().default("3600"),
  SESSION_TTL: z.string().default("86400"),

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

  AES_256_KEY: z.string().min(32, "AES_256_KEY must be set in environment"),
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be set in environment"),
  KYC_ENCRYPTION_KEY: z.string().min(32, "KYC_ENCRYPTION_KEY must be set in environment"),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:5000/api/v1/auth/google/callback"),

  MAIL_HOST: z.string().default("smtp.gmail.com"),
  MAIL_PORT: z.string().default("587"),
  MAIL_SECURE: z.string().default("false"),
  MAIL_USER: z.string().default("ayushman@globussoft.in"),
  MAIL_APP_PASSWORD: z.string().default("[,zZn*n6k.v%[7yX"),
  MAIL_FROM_NAME: z.string().default("RoomBae"),
  MAIL_FROM_EMAIL: z.string().default("ayushman@globussoft.in"),
  EMAIL_FROM: z.string().default("RoomBae <ayushman@globussoft.in>"),

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

  SMS_PROVIDER: z.string().default("TWILIO"),
  TWILIO_ACCOUNT_SID: z.string().default(""),
  TWILIO_AUTH_TOKEN: z.string().default(""),
  TWILIO_PHONE_NUMBER: z.string().default(""),
  SMS_OTP_LENGTH: z.string().default("6"),
  SMS_OTP_EXPIRY_MINUTES: z.string().default("10"),
  OTP_DEV_OVERRIDE: z.string().default("false"),
  EXPOSE_DEV_OTP: z.string().default("false"),

  DEVICE_VISITOR_SALT: z.string().default("roombae_default_visitor_salt_32_chars!"),
  DEVICE_IP_SALT: z.string().default("roombae_default_ip_salt_32_chars!"),
  DEVICE_UA_SALT: z.string().default("roombae_default_ua_salt_32_chars!"),
  OAUTH_STATE_SECRET: z.string().default("oauth_state_signing_secret_32_chars!"),
  DEFAULT_AVATAR_URL: z.string().default("https://res.cloudinary.com/roombae/image/upload/v1700000000/default-avatar.png"),
  DEFAULT_OWNER_PHOTO_URL: z.string().default("https://res.cloudinary.com/roombae/image/upload/v1700000000/default-owner.png"),
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

// ── Mandatory Fail-Closed Startup Guards ──
if (env.NODE_ENV === "production" && (env.OTP_DEV_OVERRIDE === "true" || process.env.OTP_DEV_OVERRIDE === "true")) {
  const fatalMsg = "FATAL SECURITY ERROR: OTP_DEV_OVERRIDE is strictly forbidden in production mode!";
  console.error(`🚨 ${fatalMsg}`);
  throw new Error(fatalMsg);
}

if (env.NODE_ENV === "production" && (env.EXPOSE_DEV_OTP === "true" || process.env.EXPOSE_DEV_OTP === "true")) {
  const fatalMsg = "FATAL SECURITY ERROR: EXPOSE_DEV_OTP is strictly forbidden in production mode!";
  console.error(`🚨 ${fatalMsg}`);
  throw new Error(fatalMsg);
}

export const resolvedPort = parseInt(env.PORT || "5000", 10);
