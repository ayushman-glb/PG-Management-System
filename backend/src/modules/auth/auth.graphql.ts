import { Container } from '../../container';

export const authGraphQLResolvers = {
  Query: {
    me: async (_: any, { userId }: { userId: string }) => {
      return Container.authService.me(userId);
    },
    ownerProfile: async (_: any, { userId }: { userId: string }) => {
      return Container.authService.ownerProfile(userId);
    },
    residentProfile: async (_: any, { userId }: { userId: string }) => {
      return Container.authService.residentProfile(userId);
    },
  },
  Mutation: {
    register: async (_: any, args: any) => {
      const res = await Container.authService.register(args);
      return { success: true, message: 'Registration successful', ...res };
    },
    login: async (_: any, { identifier, password }: any) => {
      const res = await Container.authService.login(identifier, password);
      return { success: true, message: 'Login successful', ...res };
    },
    logout: async () => {
      return true;
    },
    sendPhoneOTP: async (_: any, { phone }: { phone: string }) => {
      const res = await Container.authService.sendPhoneOtp(phone);
      return { success: res.success, message: res.message };
    },
    verifyPhoneOTP: async (_: any, { phone, otp }: { phone: string; otp: string }) => {
      const res = await Container.authService.verifyPhoneOtp(phone, otp);
      return { success: res.success, message: res.message };
    },
    sendEmailOTP: async (_: any, { email }: { email: string }) => {
      const res = await Container.authService.sendEmailVerification(email);
      return { success: res.success, message: res.message };
    },
    verifyEmailOTP: async (_: any, { email, code }: { email: string; code: string }) => {
      const res = await Container.authService.verifyEmail(email, code);
      return { success: res.success, message: res.message };
    },
    enable2FA: async (_: any, { userId }: { userId: string }) => {
      const res = await Container.authService.enableTwoFactor(userId);
      return { success: true, message: '2FA generated', ...res };
    },
    disable2FA: async (_: any, { userId }: { userId: string }) => {
      const res = await Container.authService.disableTwoFactor(userId);
      return { success: res.success, message: res.message };
    },
  },
};
