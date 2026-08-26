import { Response } from 'express';
import { env } from '../config/env';

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const CROSS_ORIGIN_DEPLOYMENT = process.env.CROSS_ORIGIN_DEPLOYMENT !== 'false'; // default true

export const getCookieEnvironmentOptions = () => {
  const isCrossOrigin = CROSS_ORIGIN_DEPLOYMENT;
  const isProd = env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production';
  return {
    isCrossOrigin,
    isProd,
    secure: isCrossOrigin ? true : isProd,
    sameSite: (isCrossOrigin ? 'none' : 'lax') as 'none' | 'lax',
  };
};

/**
 * Centralized, production-safe auth cookie setter.
 * Enforces SameSite=None; Secure; HttpOnly for cross-origin Vercel <-> Render communication.
 */
export const setAuthCookies = (res: Response, tokens: AuthTokens): void => {
  const { secure, sameSite } = getCookieEnvironmentOptions();

  if (tokens.accessToken) {
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  if (tokens.refreshToken) {
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Non-sensitive, non-httpOnly session presence marker for frontend gating
    res.cookie('hasSession', '1', {
      httpOnly: false,
      secure,
      sameSite,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};

/**
 * Centralized auth cookie clearer.
 * Clears cookies matching exact attributes (including path) to prevent zombie sessions.
 */
export const clearAuthCookies = (res: Response): void => {
  const { secure, sameSite } = getCookieEnvironmentOptions();

  // Clear accessToken on root path
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  });

  // Clear refreshToken on scoped /api/v1/auth path
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/v1/auth',
  });

  // Clear legacy root path refreshToken to ensure clean migration
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  });

  // Clear hasSession marker
  res.clearCookie('hasSession', {
    httpOnly: false,
    secure,
    sameSite,
    path: '/',
  });
};

