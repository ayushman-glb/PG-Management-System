import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface VerificationTimerProps {
  expiresAt: Date | string | null;
  onExpire?: () => void;
}

export const VerificationTimer: React.FC<VerificationTimerProps> = ({
  expiresAt,
  onExpire,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    const expiryTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setSecondsLeft(diffSeconds);

      if (diffSeconds === 0 && onExpire) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!expiresAt || secondsLeft <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Code expired</span>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 120; // less than 2 minutes left

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-mono font-medium transition-colors ${
        isUrgent ? 'text-amber-500 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'animate-pulse' : ''}`} />
      <span>
        Expires in {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};
