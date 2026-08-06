import { env } from './env';
import { IRecaptchaConfig } from '../types/recaptcha';

export const recaptchaConfig: IRecaptchaConfig = {
  siteKey: env.RECAPTCHA_SITE_KEY || '6LelFHgtAAAAAKBdRLguYh39vKllYv_uF1k07sUB',
  projectId: env.GOOGLE_CLOUD_PROJECT_ID || 'roombae-cff13',
  minScore: parseFloat(env.RECAPTCHA_MIN_SCORE || '0.5'),
  enabled: env.RECAPTCHA_ENABLED !== 'false',
};
