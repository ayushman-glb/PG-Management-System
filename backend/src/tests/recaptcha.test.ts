import { recaptchaService } from '../services/recaptcha.service';
import { verifyRecaptcha } from '../middleware/recaptcha.middleware';
import { Request, Response, NextFunction } from 'express';

describe('Google reCAPTCHA Enterprise Integration Test Suite', () => {
  describe('RecaptchaService', () => {
    it('should return MISSING_TOKEN invalidReason when empty token provided', async () => {
      const result = await recaptchaService.createAssessment({
        token: '',
        expectedAction: 'login',
      });

      expect(result.success).toBe(false);
      expect(result.score).toBe(0);
      expect(result.invalidReason).toBe('MISSING_TOKEN');
      expect(result.riskTier).toBe('HIGH_RISK');
    });

    it('should detect replay attack when token is reused within TTL', async () => {
      const testToken = `test_token_replay_${Date.now()}`;

      // First call -> assessment evaluates token
      await recaptchaService.createAssessment({
        token: testToken,
        expectedAction: 'signup',
      });

      // Second call with same token -> triggers replay detection
      const replayResult = await recaptchaService.createAssessment({
        token: testToken,
        expectedAction: 'signup',
      });

      expect(replayResult.success).toBe(false);
      expect(replayResult.invalidReason).toBe('REPLAY_ATTACK_TOKEN_REUSED');
      expect(replayResult.riskTier).toBe('HIGH_RISK');
    });

    it('should operate cleanly in fallback mode for valid unique token', async () => {
      const uniqueToken = `test_valid_token_${Date.now()}`;
      const result = await recaptchaService.createAssessment({
        token: uniqueToken,
        expectedAction: 'login',
      });

      expect(result.tokenValid).toBe(true);
      expect(result.actionMatched).toBe(true);
    });
  });

  describe('verifyRecaptcha Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockReq = {
        body: {},
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' } as any,
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFunction = jest.fn();
    });

    it('should reject requests missing recaptchaToken with HTTP 422', async () => {
      const middleware = verifyRecaptcha('login');
      await middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RECAPTCHA_TOKEN_MISSING',
          }),
        })
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should pass requests with valid recaptchaToken to next()', async () => {
      mockReq.body = { recaptchaToken: `valid_test_token_${Date.now()}` };
      const middleware = verifyRecaptcha('login');

      await middleware(mockReq as Request, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
