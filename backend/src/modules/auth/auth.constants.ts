export const AUTH_CONSTANTS = {
  JWT_ACCESS_EXPIRATION: '15m',
  JWT_REFRESH_EXPIRATION: '7d',
  OTP_EXPIRATION_MINUTES: 10,
  MAX_LOGIN_ATTEMPTS: 5,
};

export const AUTH_EVENTS = {
  USER_LOGGED_IN: 'auth:user_logged_in',
  USER_REGISTERED: 'auth:user_registered',
  OTP_SENT: 'auth:otp_sent',
  TWO_FACTOR_ENABLED: 'auth:two_factor_enabled',
};
