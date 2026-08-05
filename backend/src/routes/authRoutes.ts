import { Router } from 'express';
import { Container } from '../container';
import { authLimiter, phoneVerifyLimiter } from '../middleware/rateLimiter';
import { logAudit } from '../middleware/auditLogger';
import { verifyRecaptcha } from '../middleware/recaptcha.middleware';

const router = Router();
const { authController } = Container;

router.post('/login', authLimiter, verifyRecaptcha('login'), logAudit('AUTH_LOGIN'), authController.login);
router.post('/register', authLimiter, verifyRecaptcha('signup'), logAudit('AUTH_REGISTER'), authController.register);
router.post('/send-otp', authLimiter, verifyRecaptcha('send_otp'), authController.sendOtp);
router.post('/verify-otp', authLimiter, verifyRecaptcha('verify_otp'), logAudit('AUTH_VERIFY_OTP'), authController.verifyOtp);

router.post('/send-phone-otp', authLimiter, verifyRecaptcha('send_otp'), authController.sendPhoneOtp);
router.post('/verify-phone-otp', authLimiter, verifyRecaptcha('verify_otp'), authController.verifyPhoneOtp);
router.post('/phone-verify', phoneVerifyLimiter, verifyRecaptcha('verify_otp'), logAudit('AUTH_PHONE_VERIFY'), authController.phoneVerify);
router.post('/send-email-verification', authLimiter, authController.sendEmailVerification);
router.post('/verify-email', authLimiter, authController.verifyEmail);
router.post('/enable-2fa', authLimiter, authController.enableTwoFactor);
router.post('/verify-2fa', authLimiter, authController.verifyTwoFactor);
router.post('/disable-2fa', authLimiter, authController.disableTwoFactor);
router.post('/refresh-token', authLimiter, authController.refreshToken);
router.post('/firebase-login', phoneVerifyLimiter, verifyRecaptcha('verify_otp'), logAudit('AUTH_PHONE_VERIFY'), authController.firebaseLogin);
router.post('/test-email', authController.testEmail);
router.get('/me', authController.me);

router.get('/google', (req, res, next) => authController.googleLogin(req, res, next));
router.get('/google/callback', (req, res, next) => authController.googleCallback(req, res, next));
router.post('/logout', authController.logout);

export default router;


