import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, RefreshCw, X, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { usePhoneAuth } from '../hooks/usePhoneAuth';
import { OTPInput } from './OTPInput';
import { authService } from '../services/auth.service';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: { user: any; accessToken: string }) => void;
  initialPhone?: string;
  title?: string;
  subtitle?: string;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
];

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = '',
  title = 'Phone Verification',
  subtitle = 'Verify your phone number with Firebase SMS OTP',
}) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [phoneValidationError, setPhoneValidationError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isVerifyingServer, setIsVerifyingServer] = useState(false);

  const {
    sendOTP,
    verifyOTP,
    loading: firebaseLoading,
    error: firebaseError,
    countdown,
    setError: setFirebaseError,
    resetState,
  } = usePhoneAuth();

  useEffect(() => {
    if (initialPhone) {
      const clean = initialPhone.replace(/\D/g, '');
      if (clean.length === 10) {
        setPhoneNumber(clean);
      } else if (initialPhone.startsWith('+')) {
        const found = COUNTRY_CODES.find((c) => initialPhone.startsWith(c.code));
        if (found) {
          setCountryCode(found.code);
          setPhoneNumber(initialPhone.slice(found.code.length));
        } else {
          setPhoneNumber(clean);
        }
      }
    }
  }, [initialPhone]);

  useEffect(() => {
    if (!isOpen) {
      setStep('phone');
      setOtpCode('');
      setPhoneValidationError('');
      setServerError('');
      resetState();
    }
  }, [isOpen]);

  const validatePhone = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    if (!clean || clean.length < 7 || clean.length > 15) {
      setPhoneValidationError('Please enter a valid 10-digit phone number');
      return false;
    }
    setPhoneValidationError('');
    return true;
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setServerError('');
    
    if (!validatePhone(phoneNumber)) return;

    const cleanNum = phoneNumber.replace(/\D/g, '');
    const fullE164 = `${countryCode}${cleanNum}`;

    const sent = await sendOTP(fullE164, 'modal-recaptcha-container');
    if (sent) {
      setStep('otp');
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length !== 6) {
      setServerError('Please enter all 6 digits of the OTP code');
      return;
    }

    setServerError('');
    setIsVerifyingServer(true);

    try {
      // Step 1: Verify OTP with Firebase Web SDK & obtain Firebase ID token
      const firebaseIdToken = await verifyOTP(code);
      
      if (!firebaseIdToken) {
        setIsVerifyingServer(false);
        return;
      }

      // Step 2: Send ID token to RoomBae backend endpoint for verification & token issuance
      const res = await authService.phoneVerify(firebaseIdToken);

      setIsVerifyingServer(false);
      setStep('success');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({
            user: res.user,
            accessToken: res.accessToken || res.token,
          });
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('❌ Server verification error:', err);
      setServerError(err.message || 'Failed to complete server authentication');
      setIsVerifyingServer(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setOtpCode('');
    setServerError('');
    setFirebaseError(null);
    const cleanNum = phoneNumber.replace(/\D/g, '');
    const fullE164 = `${countryCode}${cleanNum}`;
    await sendOTP(fullE164, 'modal-recaptcha-container');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Invisible reCAPTCHA Container */}
        <div id="modal-recaptcha-container" className="hidden" />

        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
          aria-hidden="true"
        />

        {/* Glassmorphism Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-slate-100"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phone-auth-modal-title"
        >
          {/* Header Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Secure Authentication
              </span>
              <p className="text-xs text-slate-400">Firebase Verified</p>
            </div>
          </div>

          <h2 id="phone-auth-modal-title" className="text-2xl font-bold text-slate-100 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">{subtitle}</p>

          {/* Inline Error Alert */}
          {(firebaseError || serverError || phoneValidationError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{phoneValidationError || firebaseError || serverError}</span>
            </motion.div>
          )}

          {/* Step 1: Phone Input Form */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label htmlFor="phone-input" className="block text-xs font-medium text-slate-300 mb-2">
                  Enter Phone Number
                </label>
                <div className="flex rounded-xl border border-slate-700 bg-slate-950/60 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/30 transition-all overflow-hidden">
                  {/* Country Selector */}
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-slate-900 text-slate-200 text-sm font-medium px-3 py-3 border-r border-slate-700 focus:outline-none cursor-pointer hover:bg-slate-800/60"
                    aria-label="Country Code"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  {/* Number Field */}
                  <input
                    id="phone-input"
                    type="tel"
                    inputMode="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (phoneValidationError) setPhoneValidationError('');
                    }}
                    className="w-full bg-transparent px-3.5 py-3 text-slate-100 placeholder-slate-500 focus:outline-none text-base tracking-wide"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Standard SMS rates may apply. An OTP will be sent to confirm ownership.
                </p>
              </div>

              <button
                type="submit"
                disabled={firebaseLoading || !phoneNumber.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {firebaseLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: 6-Digit OTP Verification Form */}
          {step === 'otp' && (
            <div className="space-y-5">
              <div className="text-center bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
                <p className="text-xs text-slate-400">Enter 6-digit code sent to</p>
                <p className="text-base font-semibold text-amber-400 tracking-wider mt-0.5">
                  {countryCode} {phoneNumber}
                </p>
                <button
                  onClick={() => setStep('phone')}
                  className="text-xs text-slate-400 hover:text-amber-400 underline mt-1 transition-colors"
                >
                  Change Phone Number
                </button>
              </div>

              <div>
                <label className="block text-center text-xs font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <OTPInput
                  length={6}
                  value={otpCode}
                  onChange={(val) => {
                    setOtpCode(val);
                    if (serverError) setServerError('');
                  }}
                  onComplete={(val) => handleVerifyOTP(val)}
                  disabled={firebaseLoading || isVerifyingServer}
                  error={!!serverError || !!firebaseError}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOTP()}
                disabled={firebaseLoading || isVerifyingServer || otpCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {firebaseLoading || isVerifyingServer ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify Phone Number</span>
                  </>
                )}
              </button>

              {/* Resend Link with Countdown Timer */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Didn't receive the SMS?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || firebaseLoading}
                  className={`flex items-center gap-1.5 font-medium transition-colors ${
                    countdown > 0 || firebaseLoading
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-amber-400 hover:text-amber-300 cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${firebaseLoading ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success State */}
          {step === 'success' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-100">Phone Verified!</h3>
              <p className="text-xs text-slate-400">
                Your phone number has been successfully authenticated with Firebase. Logging you in...
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
