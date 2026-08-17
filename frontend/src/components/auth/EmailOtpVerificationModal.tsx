import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/auth.service';

interface EmailOtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  name?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmailOtpVerificationModal: React.FC<EmailOtpVerificationModalProps> = ({
  isOpen,
  email,
  name,
  onClose,
  onSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setError(null);
      setCountdown(60);
      setCanResend(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    setError(null);
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits entered
    if (newDigits.every((d) => d !== '') && index === 5) {
      triggerVerification(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const chars = pastedData.split('');
      setDigits(chars);
      inputRefs.current[5]?.focus();
      triggerVerification(pastedData);
    }
  };

  const triggerVerification = async (otpCode: string) => {
    setIsVerifying(true);
    setError(null);
    try {
      await authService.verifyEmailOtp(email, otpCode);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Invalid or expired OTP code');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      await authService.resendEmailOtp(email, name);
      setCountdown(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-center"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>

          {/* Icon */}
          <div className="mx-auto w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-2xl mb-4">
            🔐
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
          <p className="text-sm text-slate-400 mb-6">
            We sent a 6-digit security code to <br />
            <strong className="text-amber-400">{email}</strong>
          </p>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-slate-950 border-2 border-slate-700 rounded-xl text-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 outline-none transition disabled:opacity-50"
              />
            ))}
          </div>

          {/* Error Message with Shake */}
          {error && (
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-4 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Verification Button */}
          <button
            onClick={() => triggerVerification(digits.join(''))}
            disabled={isVerifying || digits.some((d) => d === '')}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Verifying Code...
              </>
            ) : (
              'Verify & Continue'
            )}
          </button>

          {/* Resend Timer & Action */}
          <div className="text-xs text-slate-400">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 cursor-pointer"
              >
                {isResending ? 'Resending Code...' : 'Resend Verification Code'}
              </button>
            ) : (
              <span>Resend code in <strong className="text-amber-400">{countdown}s</strong></span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default EmailOtpVerificationModal;
