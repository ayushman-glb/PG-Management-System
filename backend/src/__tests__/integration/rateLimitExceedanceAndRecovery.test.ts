import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

describe('Rate Limit Exceedance, Header Verification & Window Recovery Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('1. should block repeated login attempts after exceeding quota and return 429 RATE_LIMIT_EXCEEDED', async () => {
    const loginLimiter = rateLimit({
      windowMs: 500, // 500ms sliding window for fast test recovery
      max: 3,
      standardHeaders: true,
      legacyHeaders: true,
      statusCode: 429,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'LOGIN_RATE_EXCEEDED',
            message: 'Too many login attempts. Please try again later.',
          },
        });
      },
    });

    app.post('/auth/login', loginLimiter, (_req, res) => {
      res.status(200).json({ success: true, message: 'Login successful' });
    });

    // Send 3 allowed requests
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/auth/login').send({ email: 'user@roombae.com' });
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    }

    // 4th request exceeds threshold -> 429
    const blockedRes = await request(app).post('/auth/login').send({ email: 'user@roombae.com' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.success).toBe(false);
    expect(blockedRes.body.error.code).toBe('LOGIN_RATE_EXCEEDED');

    // Wait for the window to reset (600ms)
    await new Promise((r) => setTimeout(r, 600));

    // Subsequent request succeeds
    const recoveredRes = await request(app).post('/auth/login').send({ email: 'user@roombae.com' });
    expect(recoveredRes.status).toBe(200);
  });

  it('2. should enforce phone OTP rate limits and reject burst spam', async () => {
    const otpLimiter = rateLimit({
      windowMs: 500,
      max: 2,
      standardHeaders: true,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'OTP_RATE_EXCEEDED',
            message: 'Too many OTP requests generated for this phone number.',
          },
        });
      },
    });

    app.post('/auth/send-phone-otp', otpLimiter, (_req, res) => {
      res.status(200).json({ success: true, message: 'OTP sent' });
    });

    // 2 allowed requests
    for (let i = 0; i < 2; i++) {
      const res = await request(app).post('/auth/send-phone-otp').send({ phone: '+919876543210' });
      expect(res.status).toBe(200);
    }

    // 3rd request blocked
    const blockedRes = await request(app).post('/auth/send-phone-otp').send({ phone: '+919876543210' });
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.body.error.code).toBe('OTP_RATE_EXCEEDED');
  });
});
