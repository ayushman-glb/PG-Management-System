import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OTPInputProps {
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  hasError = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.padEnd(length, '').slice(0, length).split('');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newOtp = newDigits.join('').replace(/\s/g, '');
    onChange(newOtp);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.length === length && onComplete) {
      onComplete(newOtp);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      {Array.from({ length }).map((_, index) => {
        const isFilled = Boolean(digits[index] && digits[index] !== ' ');
        return (
          <motion.input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digits[index] === ' ' ? '' : digits[index] || ''}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            whileFocus={{ scale: 1.05 }}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl transition-all duration-200 outline-none select-none shadow-sm ${
              hasError
                ? 'border-2 border-rose-500 bg-rose-50/30 text-rose-600 dark:border-rose-500/80 dark:bg-rose-950/20 dark:text-rose-400 focus:ring-4 focus:ring-rose-500/20'
                : isFilled
                ? 'border-2 border-primary-500 bg-primary-50/20 text-slate-900 dark:text-white dark:border-primary-400 dark:bg-primary-950/20'
                : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        );
      })}
    </div>
  );
};
