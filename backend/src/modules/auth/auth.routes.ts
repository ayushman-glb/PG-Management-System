import { Router } from "express";
import { Container } from "../../container";
import { validate } from "../../middleware/validateMiddleware";
import {
  LoginSchema,
  RegisterSchema,
  SendPhoneOtpSchema,
  VerifyPhoneOtpSchema,
  Enable2FASchema,
} from "./auth.dto";
import { authenticate } from "../../middleware/authMiddleware";
import { phoneAuthRoutes } from "../phone-auth";
import {
  loginLimiter,
  registerLimiter,
  sendOtpLimiter,
  verifyOtpLimiter,
  phoneVerifyLimiter,
  refreshTokenLimiter,
  csrfBootstrapLimiter,
} from "../../middleware/rateLimiter";
import { generateCsrfToken } from '../../middleware/csrfMiddleware';

const router = Router();

// ── CSRF Bootstrap Endpoint ────────────────────────────────────────────────────────
// Issues or refreshes the csrf-token cookie for anonymous visitors before
// they call /register, /login, or /refresh-token. Must NOT itself require CSRF.
// Rate-limited with dedicated limiter to prevent resource exhaustion without colliding with OTP limits.
router.get('/csrf-token', csrfBootstrapLimiter, generateCsrfToken, (req, res) => {
  // The cookie was already set by generateCsrfToken. Return the value in the
  // body as well so the frontend can also read it directly if needed.
  const token: string = (req.cookies && req.cookies['csrf-token']) || res.getHeader('x-csrf-token') as string || '';
  res.status(200).json({
    success: true,
    message: 'CSRF token issued',
    data: { csrfToken: token },
  });
});

// ── Legacy CSRF alias (preserved for backward compat, redirects to new path) ──
router.get('/csrf', csrfBootstrapLimiter, generateCsrfToken, (req, res) => {
  const token: string = (req.cookies && req.cookies['csrf-token']) || res.getHeader('x-csrf-token') as string || '';
  res.status(200).json({
    success: true,
    message: 'CSRF token issued',
    data: { csrfToken: token },
  });
});

// ── Authentication endpoints with per-route rate limiting ─────────────────────
router.post(
  "/login",
  loginLimiter,                // 5 req / 15 min per IP
  validate(LoginSchema),
  (req, res, next) => Container.authController.login(req, res, next),
);

router.post(
  "/register",
  registerLimiter,             // 5 req / 1 hour per IP
  validate(RegisterSchema),
  (req, res, next) => Container.authController.register(req, res, next),
);

router.post(
  "/send-otp",
  sendOtpLimiter,              // 3 req / 10 min per IP
  (req, res, next) => Container.authController.sendOtp(req, res, next),
);

router.post(
  "/verify-otp",
  verifyOtpLimiter,
  (req, res, next) => Container.authController.verifyOtp(req, res, next)
);

router.post("/logout", (req, res, next) =>
  Container.authController.logout(req, res, next),
);

router.post("/logout-all", authenticate, (req, res, next) =>
  Container.authController.logoutAll(req, res, next),
);

router.post(
  "/refresh-token",
  refreshTokenLimiter,
  (req, res, next) => Container.authController.refreshToken(req, res, next)
);

// ── Phone Authentication Subsystem (Twilio SMS) ───────────────────────────
router.use("/phone", phoneAuthRoutes);

router.post(
  "/send-phone-otp",
  sendOtpLimiter,              // 3 req / 10 min per IP
  validate(SendPhoneOtpSchema),
  (req, res, next) => Container.phoneAuthController.sendOtp(req, res, next),
);

router.post(
  "/verify-phone-otp",
  phoneVerifyLimiter,          // 10 req / 15 min per IP
  validate(VerifyPhoneOtpSchema),
  (req, res, next) => Container.phoneAuthController.verifyOtp(req, res, next),
);

// ── Email OTP Authentication Endpoints ─────────────────────────────────────
router.post(
  "/email/send-otp",
  sendOtpLimiter,
  (req, res, next) => Container.authController.sendEmailOtp(req, res, next),
);

router.post(
  "/email/verify-otp",
  verifyOtpLimiter,
  (req, res, next) => Container.authController.verifyEmailOtp(req, res, next),
);

router.post(
  "/email/resend-otp",
  sendOtpLimiter,
  (req, res, next) => Container.authController.resendEmailOtp(req, res, next),
);

// ── Password Reset Endpoints ──────────────────────────────────────────────
router.post(
  "/password/send-reset",
  sendOtpLimiter,
  (req, res, next) => Container.authController.sendPasswordReset(req, res, next),
);

router.post(
  "/password/verify",
  verifyOtpLimiter,
  (req, res, next) => Container.authController.verifyPasswordReset(req, res, next),
);

// ── Backwards Compatible Aliases ──────────────────────────────────────────
router.post("/send-email-verification", sendOtpLimiter, (req, res, next) =>
  Container.authController.sendEmailVerification(req, res, next),
);

router.post("/verify-email", verifyOtpLimiter, (req, res, next) =>
  Container.authController.verifyEmail(req, res, next),
);

// ── 2FA endpoints ─────────────────────────────────────────────────────────────
router.post(
  "/2fa/enable",
  authenticate,
  validate(Enable2FASchema),
  (req, res, next) => Container.authController.enableTwoFactor(req, res, next),
);

router.post("/2fa/verify", verifyOtpLimiter, (req, res, next) =>
  Container.authController.verifyTwoFactor(req, res, next),
);

router.post("/2fa/disable", authenticate, (req, res, next) =>
  Container.authController.disableTwoFactor(req, res, next),
);

// ── Session / profile ─────────────────────────────────────────────────────────
router.get("/me", authenticate, (req, res, next) =>
  Container.authController.me(req, res, next),
);

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get("/google", (req, res, next) =>
  Container.authController.googleLogin(req, res, next),
);

router.get("/google/callback", (req, res, next) =>
  Container.authController.googleCallback(req, res, next),
);

export default router;
