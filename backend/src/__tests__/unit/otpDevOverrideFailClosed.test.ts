describe('OTP_DEV_OVERRIDE Fail-Closed Security Startup Guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should throw a fatal error if NODE_ENV is production and OTP_DEV_OVERRIDE is true', () => {
    process.env.NODE_ENV = 'production';
    process.env.OTP_DEV_OVERRIDE = 'true';
    process.env.DATABASE_URL = 'mongodb+srv://mock:mock@cluster.mongodb.net/test';
    process.env.JWT_SECRET = 'super_secret_jwt_key_32_chars_long!';
    process.env.JWT_REFRESH_SECRET = 'super_secret_refresh_key_32_chars_long!';
    process.env.SESSION_SECRET = 'super_secret_session_key_32_chars_long!';
    process.env.COOKIE_SECRET = 'super_secret_cookie_key_32_chars_long!';
    process.env.CSRF_SECRET = 'super_secret_csrf_key_32_chars_long!';
    process.env.PASSWORD_RESET_SECRET = 'super_secret_reset_key_32_chars_long!';
    process.env.EMAIL_VERIFICATION_SECRET = 'super_secret_email_key_32_chars_long!';
    process.env.API_KEY_SECRET = 'super_secret_api_key_32_chars_long!';
    process.env.AES_256_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.KYC_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    expect(() => {
      // Re-require env to trigger startup validation
      require('../../config/env');
    }).toThrow(/FATAL SECURITY ERROR: OTP_DEV_OVERRIDE is strictly forbidden in production mode!/);
  });

  it('should boot cleanly in development when OTP_DEV_OVERRIDE is true', () => {
    process.env.NODE_ENV = 'development';
    process.env.OTP_DEV_OVERRIDE = 'true';

    expect(() => {
      const { env } = require('../../config/env');
      expect(env.OTP_DEV_OVERRIDE).toBe('true');
    }).not.toThrow();
  });
});
