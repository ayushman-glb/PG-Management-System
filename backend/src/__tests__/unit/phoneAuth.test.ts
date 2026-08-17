import bcrypt from 'bcryptjs';
import { PhoneAuthService } from '../../modules/phone-auth/phoneAuth.service';
import { OtpService } from '../../modules/phone-auth/otp.service';
import { TwilioService } from '../../modules/phone-auth/twilio.service';
import { normalizeIndianPhone } from '../../modules/phone-auth/phoneAuth.validation';

describe('Twilio SMS Phone OTP Authentication System Suite', () => {
  let phoneAuthService: PhoneAuthService;
  let otpService: OtpService;
  let twilioService: TwilioService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      phoneOTP: {
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      securityAuditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'sec_evt_1' }),
      },
      activityLog: {
        create: jest.fn().mockResolvedValue({ id: 'act_1' }),
      },
    };

    otpService = new OtpService();
    (otpService as any).db = mockDb;

    twilioService = new TwilioService();
    phoneAuthService = new PhoneAuthService();

    (phoneAuthService as any).db = mockDb;
    (phoneAuthService as any).otpService = otpService;
    (phoneAuthService as any).twilioService = twilioService;
  });

  describe('1. Phone Number Normalization & Validation', () => {
    it('should normalize 10-digit Indian phone numbers to E.164 (+91)', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('98765-43210')).toBe('+919876543210');
      expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
    });

    it('should reject invalid phone numbers', async () => {
      await expect(
        phoneAuthService.sendOtp({ phone: '' })
      ).rejects.toThrow('A valid mobile number is required.');
    });
  });

  describe('2. Cryptographic OTP Generation & Bcrypt Hashing', () => {
    it('should generate a 6-digit numeric OTP', () => {
      const otp = otpService.generateSecureOtp();
      expect(otp).toHaveLength(6);
      expect(Number(otp)).toBeGreaterThanOrEqual(100000);
      expect(Number(otp)).toBeLessThanOrEqual(999999);
    });

    it('should hash OTP with bcrypt and successfully compare', async () => {
      const plainOtp = '654321';
      const hashed = await otpService.hashOtp(plainOtp);
      expect(hashed).not.toBe(plainOtp);
      expect(hashed.startsWith('$2')).toBe(true);

      const isValid = await otpService.compareOtp(plainOtp, hashed);
      expect(isValid).toBe(true);

      const isInvalid = await otpService.compareOtp('111111', hashed);
      expect(isInvalid).toBe(false);
    });
  });

  describe('3. Send & Resend SMS OTP Flow', () => {
    it('should generate OTP, store bcrypt hash, and dispatch via Twilio', async () => {
      mockDb.phoneOTP.findFirst.mockResolvedValue(null);
      mockDb.phoneOTP.deleteMany.mockResolvedValue({ count: 0 });
      mockDb.phoneOTP.create.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        attempts: 0,
        resendCount: 0,
      });

      const result = await phoneAuthService.sendOtp({
        phone: '9876543210',
        ipAddress: '127.0.0.1',
      });

      expect(result.success).toBe(true);
      expect(result.phone).toBe('+919876543210');
      expect(result.cooldownSecondsRemaining).toBe(30);
      expect(mockDb.phoneOTP.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+919876543210',
            attempts: 0,
          }),
        })
      );
    });

    it('should enforce 30-second cooldown on consecutive requests', async () => {
      const recentDate = new Date(); // Created just now
      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        createdAt: recentDate,
        resendCount: 0,
      });

      await expect(
        otpService.createOrUpdateOtp('+919876543210', '127.0.0.1', 'jest', false)
      ).rejects.toThrow(/Please wait \d+ seconds before requesting a new OTP/);
    });

    it('should block resend if maximum resends (3) exceeded', async () => {
      const oldDate = new Date(Date.now() - 40 * 1000); // 40 seconds ago (cooldown passed)
      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        createdAt: oldDate,
        resendCount: 3, // Already maxed out
      });

      await expect(
        otpService.createOrUpdateOtp('+919876543210', '127.0.0.1', 'jest', true)
      ).rejects.toThrow('Maximum resend limit reached for this session. Please try again after 10 minutes.');
    });
  });

  describe('4. Verify OTP & Update User Status', () => {
    it('should successfully verify correct OTP, delete OTP record, and update User', async () => {
      const plainOtp = '789123';
      const hashedOtp = await bcrypt.hash(plainOtp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        hashedOtp,
        expiresAt,
        attempts: 0,
      });
      mockDb.phoneOTP.deleteMany.mockResolvedValue({ count: 1 });

      const mockUser = {
        id: 'usr_123',
        email: 'resident@roombae.com',
        name: 'John Resident',
        role: 'RESIDENT',
        phone: '+919876543210',
        phoneVerified: true,
        isPhoneVerified: true,
      };

      mockDb.user.update.mockResolvedValue(mockUser);

      const result = await phoneAuthService.verifyOtp({
        phone: '9876543210',
        otp: plainOtp,
        userId: 'usr_123',
      });

      expect(result.success).toBe(true);
      expect(result.isPhoneVerified).toBe(true);
      expect(result.verificationToken).toBeDefined();
      expect(mockDb.phoneOTP.deleteMany).toHaveBeenCalledWith({ where: { phone: '+919876543210' } });
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_123' },
          data: expect.objectContaining({ isPhoneVerified: true }),
        })
      );
    });

    it('should reject wrong OTP and decrement remaining attempts', async () => {
      const correctOtp = '999999';
      const wrongOtp = '111111';
      const hashedOtp = await bcrypt.hash(correctOtp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        hashedOtp,
        expiresAt,
        attempts: 2,
      });
      mockDb.phoneOTP.update.mockResolvedValue({ id: 'otp_rec_1', attempts: 3 });

      await expect(
        phoneAuthService.verifyOtp({
          phone: '9876543210',
          otp: wrongOtp,
        })
      ).rejects.toThrow('Invalid verification code. 2 attempts remaining.');

      expect(mockDb.phoneOTP.update).toHaveBeenCalledWith({
        where: { id: 'otp_rec_1' },
        data: { attempts: 3 },
      });
    });

    it('should lock out session after 5 failed attempts', async () => {
      const correctOtp = '999999';
      const wrongOtp = '111111';
      const hashedOtp = await bcrypt.hash(correctOtp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        hashedOtp,
        expiresAt,
        attempts: 4,
      });
      mockDb.phoneOTP.update.mockResolvedValue({ id: 'otp_rec_1', attempts: 5 });
      mockDb.phoneOTP.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        phoneAuthService.verifyOtp({
          phone: '9876543210',
          otp: wrongOtp,
        })
      ).rejects.toThrow(/Maximum verification attempts/);
    });

    it('should reject expired OTP', async () => {
      const correctOtp = '999999';
      const hashedOtp = await bcrypt.hash(correctOtp, 10);
      const pastDate = new Date(Date.now() - 5 * 60 * 1000); // Expired 5 mins ago

      mockDb.phoneOTP.findFirst.mockResolvedValue({
        id: 'otp_rec_1',
        phone: '+919876543210',
        hashedOtp,
        expiresAt: pastDate,
        attempts: 0,
      });
      mockDb.phoneOTP.deleteMany.mockResolvedValue({ count: 1 });

      await expect(
        phoneAuthService.verifyOtp({
          phone: '9876543210',
          otp: correctOtp,
        })
      ).rejects.toThrow('Verification code has expired. Please request a new OTP.');
    });
  });

  describe('5. Status & Unlink Phone', () => {
    it('should return verification and OTP countdown metadata', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'usr_123',
        phone: '+919876543210',
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      });
      mockDb.phoneOTP.findFirst.mockResolvedValue(null);

      const status = await phoneAuthService.getStatus('9876543210', 'usr_123');

      expect(status.isPhoneVerified).toBe(true);
      expect(status.hasActiveOtp).toBe(false);
      expect(status.cooldownSecondsRemaining).toBe(0);
    });

    it('should allow authenticated users to unlink their phone number', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        id: 'usr_123',
        phone: '+919876543210',
      });
      mockDb.user.update.mockResolvedValue({
        id: 'usr_123',
        phone: null,
        isPhoneVerified: false,
      });

      const res = await phoneAuthService.removePhone('usr_123', '127.0.0.1');

      expect(res.success).toBe(true);
      expect(mockDb.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr_123' },
          data: expect.objectContaining({
            phone: null,
            phoneVerified: false,
            isPhoneVerified: false,
          }),
        })
      );
    });
  });
});
