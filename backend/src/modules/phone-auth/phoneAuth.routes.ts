import { Router } from 'express';
import { phoneAuthController } from './phoneAuth.controller';
import { validate } from '../../middleware/validateMiddleware';
import { authenticate } from '../../middleware/authMiddleware';
import {
  sendOtpLimiter,
  phoneVerifyLimiter,
  resendOtpLimiter,
  generalLimiter,
} from '../../middleware/rateLimiter';
import {
  SendPhoneOtpSchema,
  VerifyPhoneOtpSchema,
  ResendPhoneOtpSchema,
  PhoneStatusSchema,
} from './phoneAuth.validation';

const router = Router();

/**
 * @route POST /api/v1/auth/phone/send-otp
 * @desc Generate and dispatch 6-digit SMS OTP via Twilio
 */
router.post(
  '/send-otp',
  sendOtpLimiter,
  validate(SendPhoneOtpSchema),
  (req, res, next) => phoneAuthController.sendOtp(req, res, next)
);

/**
 * @route POST /api/v1/auth/phone/verify-otp
 * @desc Verify submitted OTP against bcrypt hash and update user verification
 */
router.post(
  '/verify-otp',
  phoneVerifyLimiter,
  validate(VerifyPhoneOtpSchema),
  (req, res, next) => phoneAuthController.verifyOtp(req, res, next)
);

/**
 * @route POST /api/v1/auth/phone/resend-otp
 * @desc Resend OTP with strict 30s cooldown and retry tracking
 */
router.post(
  '/resend-otp',
  resendOtpLimiter,
  validate(ResendPhoneOtpSchema),
  (req, res, next) => phoneAuthController.resendOtp(req, res, next)
);

/**
 * @route GET /api/v1/auth/phone/status
 * @desc Retrieve phone verification status and active OTP countdown metadata
 */
router.get(
  '/status',
  generalLimiter,
  validate(PhoneStatusSchema),
  (req, res, next) => phoneAuthController.getStatus(req, res, next)
);

/**
 * @route DELETE /api/v1/auth/phone/remove
 * @desc Unlink verified phone number for authenticated user
 */
router.delete(
  '/remove',
  authenticate,
  generalLimiter,
  (req, res, next) => phoneAuthController.removePhone(req, res, next)
);

export default router;
export { router as phoneAuthRoutes };
