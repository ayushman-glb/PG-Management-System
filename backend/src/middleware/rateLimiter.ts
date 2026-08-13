import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs: number, max: number, message: string, code: string = 'TOO_MANY_REQUESTS') =>
  rateLimit({
    windowMs,
    max,
    skip: () => process.env.NODE_ENV === 'test',
    standardHeaders: true,
    legacyHeaders: true,
    statusCode: 429,
    message: {
      success: false,
      error: {
        code,
        message,
      },
    },
  });

export const generalLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests from this IP, please try again after 15 minutes.'
);

export const loginLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes — matches DESIGN.md §8.3 spec: 5 req/15min
  5,
  'Too many login attempts. Please try again after 15 minutes.',
  'LOGIN_RATE_EXCEEDED'
);

export const registerLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many registration attempts. Please try again after 1 hour.',
  'REGISTRATION_RATE_EXCEEDED'
);

export const sendOtpLimiter = createLimiter(
  10 * 60 * 1000, // 10 minutes
  3,
  'Too many OTP requests. Please wait 10 minutes before requesting again.',
  'SEND_OTP_RATE_EXCEEDED'
);

export const resendOtpLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  5,
  'Too many OTP resend attempts. Please wait 1 hour.',
  'RESEND_OTP_RATE_EXCEEDED'
);

export const verifyOtpLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many verification attempts. Account locked temporarily for security.',
  'VERIFY_OTP_RATE_EXCEEDED'
);

export const sendEmailCodeLimiter = createLimiter(
  10 * 60 * 1000, // 10 minutes
  3,
  'Too many email verification code requests. Please wait 10 minutes.',
  'SEND_EMAIL_CODE_RATE_EXCEEDED'
);

export const verifyEmailCodeLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  10,
  'Too many email verification attempts.',
  'VERIFY_EMAIL_RATE_EXCEEDED'
);

export const uploadLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  'Upload limit reached for this IP. Please wait before uploading more files.',
  'UPLOAD_RATE_EXCEEDED'
);

export const authLimiter = loginLimiter;
export const phoneVerifyLimiter = verifyOtpLimiter;
export const refreshTokenLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many token refresh attempts. Please try again after 15 minutes.',
  'REFRESH_RATE_EXCEEDED'
);

