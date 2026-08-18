import { RedisOtpService } from '../src/infrastructure/otp/RedisOtpService';
import { TotpService } from '../src/infrastructure/crypto/TotpService';
import { emailService } from '../src/modules/email/email.service';
import { ApiResponse } from '../src/utils/apiResponse';

async function runDevOtpChecks() {
  console.log('--- TESTING DEV-ONLY OTP GATING ---');

  // Test 1: TotpService generateCurrentToken
  const secret = TotpService.generateSecret();
  const token = TotpService.generateCurrentToken(secret);
  const isValid = TotpService.verifyToken(secret, token);
  console.log(`[1] TotpService generateCurrentToken test: token=${token}, valid=${isValid}`);
  if (!isValid) throw new Error('TotpService generateCurrentToken produced invalid token');

  // Test 2: In development mode (NODE_ENV=development)
  process.env.NODE_ENV = 'development';
  const otpService = new RedisOtpService();

  // Test ApiResponse.success in dev mode
  let devResPayload: any = null;
  const mockResDev: any = {
    status: () => mockResDev,
    json: (payload: any) => { devResPayload = payload; return mockResDev; },
  };
  ApiResponse.success(mockResDev, 'OTP sent', { devOtp: '123456', extra: 'info' });
  console.log('[2] Development ApiResponse:', JSON.stringify(devResPayload));
  if (devResPayload.devOtp !== '123456' || devResPayload.data.devOtp !== '123456') {
    throw new Error('Failed to include devOtp in development mode payload');
  }

  // Test 3: In production mode (NODE_ENV=production) - MUST FAIL CLOSED
  process.env.NODE_ENV = 'production';
  let prodResPayload: any = null;
  const mockResProd: any = {
    status: () => mockResProd,
    json: (payload: any) => { prodResPayload = payload; return mockResProd; },
  };
  ApiResponse.success(mockResProd, 'OTP sent', { devOtp: '123456', extra: 'info' });
  console.log('[3] Production ApiResponse:', JSON.stringify(prodResPayload));
  if (prodResPayload.devOtp !== undefined) {
    throw new Error('CRITICAL SECURITY VIOLATION: devOtp leaked at root in production mode!');
  }
  if (prodResPayload.data?.devOtp !== undefined) {
    throw new Error('CRITICAL SECURITY VIOLATION: devOtp leaked in data object in production mode!');
  }
  if (prodResPayload.data?.extra !== 'info') {
    throw new Error('Production sanitized data corrupted non-OTP fields');
  }

  console.log('✅ ALL DEV-OTP GATING AND TOTP TESTS PASSED SUCCESSFULLY!');
}

runDevOtpChecks().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
