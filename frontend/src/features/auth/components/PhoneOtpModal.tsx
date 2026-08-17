import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { OTPInput } from './OTPInput';
import { VerificationTimer } from './VerificationTimer';
import { ResendOTPButton } from './ResendOTPButton';
import { authService } from '../../../services/auth.service';

interface PhoneOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  phone: string;
  onVerified: (verificationResult: any) => void;
  purpose?: string;
  initialNotice?: string | null;
}

export const PhoneOtpModal: React.FC<PhoneOtpModalProps> = ({
  isOpen,
  onClose,
  phone,
  onVerified,
  purpose = 'PHONE_VERIFICATION',
  initialNotice = null,
}) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trialNotice, setTrialNotice] = useState<string | null>(initialNotice);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setIsSuccess(false);
      setErrorMessage(null);
      setTrialNotice(initialNotice);
      // Set initial 10-minute expiry
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
    }
  }, [isOpen, initialNotice]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || otp;
    if (!code || code.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const result = await authService.verifyPhoneOtp(fullPhone, code, purpose);

      setIsSuccess(true);
      setTimeout(() => {
        onVerified(result);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsSuccess(false);
      setErrorMessage(err?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage(null);

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`;
      const result = await authService.resendPhoneOtp(fullPhone);

      setOtp('');
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      if (result.isTrialNotice || result.notice) {
        setTrialNotice(result.notice || result.error || null);
      } else {
        setTrialNotice(null);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  const formattedPhone = phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 $2 $3');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success State */}
          {isSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Phone Verified!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your mobile number has been successfully verified with RoomBae.
              </p>
            </motion.div>
          ) : (
            <div>
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Phone Verification</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter the 6-digit OTP code sent via Twilio SMS to
                  </p>
                  <p className="text-xs font-semibold font-mono text-primary-600 dark:text-primary-400">
                    {formattedPhone || phone}
                  </p>
                </div>
              </div>

              {/* Twilio Trial Notice Banner */}
              {trialNotice && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Twilio Trial Account Notice:</span>
                    <span>{trialNotice}</span>
                  </div>
                </div>
              )}

              {/* OTP Inputs */}
              <div className="my-6">
                <OTPInput
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onComplete={handleVerify}
                  disabled={isVerifying}
                  hasError={Boolean(errorMessage)}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Timer and Resend Controls */}
              <div className="flex items-center justify-between pt-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                <VerificationTimer expiresAt={expiresAt} />
                <ResendOTPButton
                  onResend={handleResend}
                  isLoading={isResending}
                  disabled={isVerifying}
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={otp.length !== 6 || isVerifying}
                  className={`flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 transition-all ${
                    otp.length !== 6 || isVerifying ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
