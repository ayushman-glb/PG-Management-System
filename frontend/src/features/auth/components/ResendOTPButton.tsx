import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface ResendOTPButtonProps {
  onResend: () => Promise<void> | void;
  cooldownSeconds?: number;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ResendOTPButton: React.FC<ResendOTPButtonProps> = ({
  onResend,
  cooldownSeconds = 30,
  isLoading = false,
  disabled = false,
}) => {
  const [remainingCooldown, setRemainingCooldown] = useState(cooldownSeconds);

  useEffect(() => {
    setRemainingCooldown(cooldownSeconds);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (remainingCooldown <= 0) return;

    const timer = setInterval(() => {
      setRemainingCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingCooldown]);

  const canResend = remainingCooldown <= 0 && !isLoading && !disabled;

  return (
    <button
      type="button"
      onClick={() => {
        if (canResend) {
          onResend();
        }
      }}
      disabled={!canResend}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        canResend
          ? 'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/40 cursor-pointer'
          : 'text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-800/30 cursor-not-allowed'
      }`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
      <span>
        {isLoading
          ? 'Sending...'
          : remainingCooldown > 0
          ? `Resend in ${remainingCooldown}s`
          : 'Resend Code'}
      </span>
    </button>
  );
};
