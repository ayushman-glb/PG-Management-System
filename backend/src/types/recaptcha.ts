/**
 * Strongly typed definitions for Google reCAPTCHA Enterprise Assessment API
 */

export type RecaptchaActionType =
  | 'signup'
  | 'login'
  | 'forgot_password'
  | 'send_otp'
  | 'verify_otp'
  | 'contact'
  | 'booking'
  | 'payment'
  | 'complaint'
  | 'review'
  | 'visitor'
  | 'owner_registration'
  | 'property_creation';

export interface IRecaptchaAssessmentParams {
  token: string;
  expectedAction: RecaptchaActionType;
  userIp?: string;
  userAgent?: string;
}

export interface IRecaptchaAssessmentResult {
  success: boolean;
  score: number;
  action: string;
  actionMatched: boolean;
  tokenValid: boolean;
  invalidReason?: string;
  hostname?: string;
  eventTimestamp?: string;
  riskTier: 'TRUSTED' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK';
  assessmentName?: string;
}

export interface IRecaptchaConfig {
  siteKey: string;
  secretKey?: string;
  projectId: string;
  minScore: number;
  enabled: boolean;
}
