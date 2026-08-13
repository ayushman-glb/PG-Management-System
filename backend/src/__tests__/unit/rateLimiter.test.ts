import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';

const createTestLimiter = (max: number, code: string, message: string) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
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

describe('Rate Limiter Middleware Unit Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  test('loginLimiter returns 429 LOGIN_RATE_EXCEEDED after threshold exceeded', async () => {
    const loginLimiter = createTestLimiter(5, 'LOGIN_RATE_EXCEEDED', 'Too many login attempts');
    app.post('/test-login', loginLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    for (let i = 0; i < 5; i++) {
      const response = await request(app).post('/test-login');
      expect(response.status).toBe(200);
    }

    const rateLimitedRes = await request(app).post('/test-login');
    expect(rateLimitedRes.status).toBe(429);
    expect(rateLimitedRes.body.success).toBe(false);
    expect(rateLimitedRes.body.error.code).toBe('LOGIN_RATE_EXCEEDED');
  });

  test('sendOtpLimiter returns 429 SEND_OTP_RATE_EXCEEDED after 3 requests', async () => {
    const sendOtpLimiter = createTestLimiter(3, 'SEND_OTP_RATE_EXCEEDED', 'Too many OTP requests');
    app.post('/test-send-otp', sendOtpLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    for (let i = 0; i < 3; i++) {
      const response = await request(app).post('/test-send-otp');
      expect(response.status).toBe(200);
    }

    const fourthRes = await request(app).post('/test-send-otp');
    expect(fourthRes.status).toBe(429);
    expect(fourthRes.body.error.code).toBe('SEND_OTP_RATE_EXCEEDED');
  });

  test('refreshTokenLimiter returns 429 REFRESH_RATE_EXCEEDED after limit', async () => {
    const refreshTokenLimiter = createTestLimiter(20, 'REFRESH_RATE_EXCEEDED', 'Too many refresh requests');
    app.post('/test-refresh', refreshTokenLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    for (let i = 0; i < 20; i++) {
      const res = await request(app).post('/test-refresh');
      expect(res.status).toBe(200);
    }

    const breachRes = await request(app).post('/test-refresh');
    expect(breachRes.status).toBe(429);
    expect(breachRes.body.error.code).toBe('REFRESH_RATE_EXCEEDED');
  });
});
