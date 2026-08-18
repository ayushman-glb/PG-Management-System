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
  phoneVerifyLimiter,
} from "../../middleware/rateLimiter";

const router = Router();

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

router.post("/verify-otp", (req, res, next) =>
  Container.authController.verifyOtp(req, res, next),
);

router.post("/logout", (req, res, next) =>
  Container.authController.logout(req, res, next),
);

router.post("/refresh-token", (req, res, next) =>
  Container.authController.refreshToken(req, res, next),
);

router.post("/test-email", (req, res, next) =>
  Container.authController.testEmail(req, res, next),
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
  (req, res, next) => Container.authController.verifyPasswordReset(req, res, next),
);

// ── Backwards Compatible Aliases ──────────────────────────────────────────
router.post("/send-email-verification", (req, res, next) =>
  Container.authController.sendEmailVerification(req, res, next),
);

router.post("/verify-email", (req, res, next) =>
  Container.authController.verifyEmail(req, res, next),
);

// ── 2FA endpoints ─────────────────────────────────────────────────────────────
router.post(
  "/2fa/enable",
  authenticate,
  validate(Enable2FASchema),
  (req, res, next) => Container.authController.enableTwoFactor(req, res, next),
);

router.post("/2fa/verify", (req, res, next) =>
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
