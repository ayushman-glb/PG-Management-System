import React, { useEffect } from 'react';
import { env } from '../config/env';

interface ReCaptchaWidgetProps {
  action?: string;
  siteKey?: string;
  className?: string;
}

/**
 * Google reCAPTCHA Enterprise Widget Component
 * Renders the g-recaptcha container element based on Google Enterprise guidelines:
 * <div class="g-recaptcha" data-sitekey="..." data-action="..."></div>
 */
export const ReCaptchaWidget: React.FC<ReCaptchaWidgetProps> = ({
  action = 'LOGIN',
  siteKey = env.RECAPTCHA_SITE_KEY,
  className = '',
}) => {
  useEffect(() => {
    // Ensure reCAPTCHA script is loaded if not already present
    if (!document.querySelector('script[src*="recaptcha/enterprise.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/enterprise.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div
      className={`g-recaptcha ${className}`.trim()}
      data-sitekey={siteKey}
      data-action={action}
    />
  );
};

export default ReCaptchaWidget;
