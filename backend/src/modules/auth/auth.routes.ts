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

const router = Router();

import { phoneVerifyLimiter } from "../../middleware/rateLimiter";

router.post("/login", validate(LoginSchema), (req, res, next) =>
  Container.authController.login(req, res, next),
);
router.post("/register", validate(RegisterSchema), (req, res, next) =>
  Container.authController.register(req, res, next),
);
router.post("/send-otp", (req, res, next) =>
  Container.authController.sendOtp(req, res, next),
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
router.post("/firebase-login", phoneVerifyLimiter, (req, res, next) =>
  Container.authController.firebaseLogin(req, res, next),
);
router.post("/phone-verify", phoneVerifyLimiter, (req, res, next) =>
  Container.authController.phoneVerify(req, res, next),
);
router.post("/test-email", (req, res, next) =>
  Container.authController.testEmail(req, res, next),
);

router.post("/send-phone-otp", validate(SendPhoneOtpSchema), (req, res, next) =>
  Container.authController.sendPhoneOtp(req, res, next),
);
router.post(
  "/verify-phone-otp",
  validate(VerifyPhoneOtpSchema),
  (req, res, next) => Container.authController.verifyPhoneOtp(req, res, next),
);
router.post("/send-email-verification", (req, res, next) =>
  Container.authController.sendEmailVerification(req, res, next),
);
router.post("/verify-email", (req, res, next) =>
  Container.authController.verifyEmail(req, res, next),
);

router.post(
  "/2fa/enable",
  authenticate,
  validate(Enable2FASchema),
  (req, res, next) => Container.authController.enableTwoFactor(req, res, next),
);
router.post("/2fa/verify", authenticate, (req, res, next) =>
  Container.authController.verifyTwoFactor(req, res, next),
);
router.post("/2fa/disable", authenticate, (req, res, next) =>
  Container.authController.disableTwoFactor(req, res, next),
);

router.get("/me", authenticate, (req, res, next) =>
  Container.authController.me(req, res, next),
);
router.get("/google", (req, res, next) =>
  Container.authController.googleLogin(req, res, next),
);
router.get("/google/callback", (req, res, next) =>
  Container.authController.googleCallback(req, res, next),
);

export default router;
