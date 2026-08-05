import { useState, useCallback } from 'react';
import { recaptchaService, RecaptchaAction } from '../services/recaptcha';

interface UseRecaptchaOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

interface UseRecaptchaReturn {
  execute: (action: RecaptchaAction) => Promise<string>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
}

export function useRecaptcha(options: UseRecaptchaOptions = {}): UseRecaptchaReturn {
  const { timeoutMs = 10000, maxRetries = 2 } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async (action: RecaptchaAction): Promise<string> => {
      setLoading(true);
      setError(null);

      let attempts = 0;
      let lastError: Error | null = null;

      while (attempts <= maxRetries) {
        try {
          // Wrap token generation in a timeout promise
          const tokenPromise = recaptchaService.getRecaptchaToken(action);
          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error(`reCAPTCHA token generation timed out after ${timeoutMs}ms`)), timeoutMs)
          );

          const token = await Promise.race([tokenPromise, timeoutPromise]);
          setLoading(false);
          return token;
        } catch (err) {
          attempts++;
          lastError = err as Error;
          if (attempts <= maxRetries) {
            // Short backoff delay before retry
            await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
          }
        }
      }

      setLoading(false);
      const errMsg = lastError?.message || 'reCAPTCHA verification failed.';
      setError(errMsg);

      // Return synthetic fallback token on total failure so user form submission is not hard blocked
      return `mock_recaptcha_token_fallback_${action}_${Date.now()}`;
    },
    [maxRetries, timeoutMs]
  );

  return { execute, loading, error, resetError };
}
