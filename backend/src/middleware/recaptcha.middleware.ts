import { Request, Response, NextFunction } from 'express';
import { recaptchaService } from '../services/recaptcha.service';
import { RecaptchaActionType } from '../types/recaptcha';
import { recaptchaConfig } from '../config/recaptcha';
import { logger } from '../utils/logger';

/**
 * Express Middleware protecting routes against bot attacks using Google reCAPTCHA Enterprise
 */
export function verifyRecaptcha(expectedAction: RecaptchaActionType) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip reCAPTCHA check if explicitly disabled
    if (!recaptchaConfig.enabled) {
      return next();
    }

    const token = req.body?.recaptchaToken || (req.headers['x-recaptcha-token'] as string);
    const userIp = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!token) {
      logger.warn(`⛔ Bot Protection Triggered: Missing reCAPTCHA token on action [${expectedAction}] from IP: ${userIp}`);
      res.status(422).json({
        success: false,
        error: {
          code: 'RECAPTCHA_TOKEN_MISSING',
          message: 'Security validation token is missing. Please complete reCAPTCHA verification.',
        },
      });
      return;
    }

    const assessment = await recaptchaService.createAssessment({
      token,
      expectedAction,
      userIp,
      userAgent,
    });

    if (!assessment.success) {
      logger.warn(`⛔ Bot Protection Rejection: Action [${expectedAction}], Score=${assessment.score}, RiskTier=${assessment.riskTier}, Reason=${assessment.invalidReason} from IP: ${userIp}`);

      let statusCode = 422;
      let errorCode = 'RECAPTCHA_VERIFICATION_FAILED';
      let errorMessage = 'Security verification failed. High bot probability detected.';

      if (assessment.invalidReason === 'REPLAY_ATTACK_TOKEN_REUSED') {
        statusCode = 403;
        errorCode = 'RECAPTCHA_TOKEN_REUSED';
        errorMessage = 'Security token has already been used. Please submit form again.';
      } else if (!assessment.actionMatched) {
        statusCode = 422;
        errorCode = 'RECAPTCHA_ACTION_MISMATCH';
        errorMessage = `Action mismatch: expected '${expectedAction}' but received '${assessment.action}'.`;
      } else if (assessment.score < recaptchaConfig.minScore) {
        statusCode = 403;
        errorCode = 'RECAPTCHA_SCORE_TOO_LOW';
        errorMessage = `Security risk score (${assessment.score}) is below required threshold (${recaptchaConfig.minScore}).`;
      }

      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          score: assessment.score,
          riskTier: assessment.riskTier,
        },
      });
      return;
    }

    // Attach assessment result to request for downstream controller use if needed
    (req as any).recaptchaAssessment = assessment;
    next();
  };
}
