import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { authenticate } from '../../middleware/authMiddleware';
import { authLimiter } from '../../middleware/rateLimiter';
import { generateCsrfToken } from '../../middleware/csrfMiddleware';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = Router();

// CSRF Bootstrap Endpoint (Public)
router.get('/csrf-token', (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({
    success: true,
    data: { csrfToken: token },
  });
});

// Public Authentication Endpoints
router.post('/register/resident', authLimiter, authController.registerResident);
router.post('/register/owner', authLimiter, authController.registerOwner);
router.post('/register', authLimiter, authController.register);

// OTP Endpoints (Canonical & REST Aliases)
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/send-phone-otp', authLimiter, authController.sendPhoneOtp);
router.post('/phone/send-otp', authLimiter, authController.sendPhoneOtp);
router.post('/phone/resend-otp', authLimiter, authController.sendPhoneOtp);
router.post('/email/send-otp', authLimiter, authController.sendEmailOtp);
router.post('/email/resend-otp', authLimiter, authController.sendEmailOtp);

router.post('/verify-otp', authLimiter, authController.verifyPhoneOtp);
router.post('/verify-phone-otp', authLimiter, authController.verifyPhoneOtp);
router.post('/phone/verify-otp', authLimiter, authController.verifyPhoneOtp);
router.post('/verify-email-otp', authLimiter, authController.verifyEmailOTP);
router.post('/email/verify-otp', authLimiter, authController.verifyEmailOTP);

// Password Reset Endpoints
router.post('/password/send-reset', authLimiter, authController.sendPasswordReset);
router.post('/password/verify', authLimiter, authController.verifyPasswordReset);

// Login & Session Endpoints
router.post('/login', authLimiter, authController.login);
router.post('/sign-in', authLimiter, authController.login);
router.post('/verify-2fa', authLimiter, authController.verify2FA);
router.post('/2fa/verify', authLimiter, authController.verify2FA);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Google OAuth 2.0 Endpoints
router.get('/google', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);
router.post('/google/verify', authLimiter, authController.verifyGoogleToken);
router.post('/google/token', authLimiter, authController.verifyGoogleToken);

// Protected routes
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);
router.post('/device/transfer-primary', authenticate, authController.transferPrimaryDevice);
router.post('/google/link', authenticate, authLimiter, authController.linkGoogle);
router.post('/google/unlink', authenticate, authLimiter, authController.unlinkGoogle);
router.post('/create-password', authenticate, authLimiter, authController.createPassword);
router.post('/complete-profile', authenticate, authLimiter, authController.completeProfile);
router.get('/auth-methods', authenticate, authController.getAuthMethods);

export { router as authRoutes };
