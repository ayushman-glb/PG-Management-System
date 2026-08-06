import React, { useEffect, useState } from 'react';
import { env } from '../config/env';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ReCaptchaWidgetProps {
  action?: string;
  siteKey?: string;
  className?: string;
  showBadge?: boolean;
}

/**
 * Google reCAPTCHA Enterprise & v3 Widget Component
 * Renders the g-recaptcha container element and security status indicator:
 * <div className="g-recaptcha" data-sitekey="..." data-action="..."></div>
 */
export const ReCaptchaWidget: React.FC<ReCaptchaWidgetProps> = ({
  action = 'LOGIN',
  siteKey = env.RECAPTCHA_SITE_KEY,
  className = '',
  showBadge = true,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Ensure reCAPTCHA script is loaded if not already present
    if (!document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/enterprise.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => setIsLoaded(false);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`.trim()}>
      <div
        className="g-recaptcha"
        data-sitekey={siteKey}
        data-action={action}
      />
      {showBadge && (
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {isLoaded ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          )}
          <span>Protected by Google reCAPTCHA</span>
        </div>
      )}
    </div>
  );
};

export default ReCaptchaWidget;
