import { env } from '../config/env';

export type RecaptchaAction =
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

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: {
        ready: (callback: () => void) => void;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}

class RecaptchaService {
  private scriptLoadingPromise: Promise<boolean> | null = null;
  private siteKey = env.RECAPTCHA_SITE_KEY;

  /**
   * Lazy load Google reCAPTCHA Enterprise script once
   */
  public loadScript(): Promise<boolean> {
    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise((resolve) => {
      // Check if script is already present in DOM
      if (document.querySelector(`script[src*="recaptcha/enterprise.js"]`)) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${this.siteKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        resolve(true);
      };

      script.onerror = (err) => {
        this.scriptLoadingPromise = null;
        console.warn('⚠️ Google reCAPTCHA Enterprise script load failed:', err);
        // Resolve true in dev fallback mode to prevent blocking forms
        resolve(false);
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Execute reCAPTCHA Enterprise and retrieve token
   */
  public async getRecaptchaToken(action: RecaptchaAction): Promise<string> {
    try {
      await this.loadScript();

      if (!window.grecaptcha?.enterprise) {
        // Synthetic token for fallback mode when script fails or blocked by adblockers
        return `mock_recaptcha_token_fallback_${action}_${Date.now()}`;
      }

      return new Promise((resolve) => {
        window.grecaptcha!.enterprise!.ready(async () => {
          try {
            const token = await window.grecaptcha!.enterprise!.execute(this.siteKey, { action });
            resolve(token);
          } catch (err) {
            console.warn(`⚠️ reCAPTCHA execution error for action '${action}':`, err);
            resolve(`mock_recaptcha_token_fallback_${action}_${Date.now()}`);
          }
        });
      });
    } catch (error) {
      console.warn('⚠️ reCAPTCHA token generation exception:', error);
      return `mock_recaptcha_token_fallback_${action}_${Date.now()}`;
    }
  }
}

export const recaptchaService = new RecaptchaService();
