import { Router } from 'express';
import { Container } from '../container';
import {
  loginLimiter,
  registerLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  phoneVerifyLimiter,
  sendEmailCodeLimiter,
  verifyEmailCodeLimiter,
  refreshTokenLimiter,
} from '../middleware/rateLimiter';
import { logAudit } from '../middleware/auditLogger';

const router = Router();
const { authController } = Container;

router.post('/login', loginLimiter, logAudit('AUTH_LOGIN'), authController.login);
router.post('/register', registerLimiter, logAudit('AUTH_REGISTER'), authController.register);
router.post('/send-otp', sendOtpLimiter, authController.sendOtp);
router.post('/verify-otp', verifyOtpLimiter, logAudit('AUTH_VERIFY_OTP'), authController.verifyOtp);

router.post('/send-phone-otp', sendOtpLimiter, authController.sendPhoneOtp);
router.post('/verify-phone-otp', phoneVerifyLimiter, authController.verifyPhoneOtp);
router.post('/send-email-verification', sendEmailCodeLimiter, authController.sendEmailVerification);
router.post('/verify-email', verifyEmailCodeLimiter, authController.verifyEmail);
router.post('/enable-2fa', loginLimiter, authController.enableTwoFactor);
router.post('/verify-2fa', verifyOtpLimiter, authController.verifyTwoFactor);
router.post('/disable-2fa', loginLimiter, authController.disableTwoFactor);
router.post('/refresh-token', refreshTokenLimiter, authController.refreshToken);
router.post('/test-email', authController.testEmail);
router.get('/me', authController.me);


router.get('/google', (req, res, next) => authController.googleLogin(req, res, next));
router.get('/google/callback', (req, res, next) => authController.googleCallback(req, res, next));
router.post('/logout', authController.logout);

export default router;
