import { SessionRevocationService } from '../../services/security/SessionRevocationService';
import { prisma } from '../../config/prisma';
import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { TokenVersionService } from '../../services/security/TokenVersionService';
import { SocketSessionService } from '../../services/security/SocketSessionService';

jest.mock('../../config/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    refreshToken: {
      updateMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    securityAuditEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  tokenBlacklistService: {
    blacklistToken: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/security/TokenVersionService', () => ({
  TokenVersionService: {
    incrementTokenVersion: jest.fn().mockResolvedValue(1),
    syncCache: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('../../services/security/SocketSessionService', () => ({
  SocketSessionService: {
    revokeUserSockets: jest.fn(),
  },
}));

describe('SessionRevocationService Atomic Revocation Engine', () => {
  const userId = 'usr_session_test';

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      return callback({
        refreshToken: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
        user: { update: jest.fn().mockResolvedValue({ id: userId, tokenVersion: 2 }) },
      });
    });
  });

  test('revokeAllSessions should execute DB transaction, sync cache, and evict live sockets', async () => {
    await SessionRevocationService.revokeAllSessions(userId, 'USER_LOGOUT_ALL', '192.168.1.1', 'Chrome');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(TokenVersionService.syncCache).toHaveBeenCalledWith(userId);
    expect(SocketSessionService.revokeUserSockets).toHaveBeenCalledWith(userId, 'USER_LOGOUT_ALL');
  });

  test('revokeForPasswordReset should execute revocation with PASSWORD_RESET tag', async () => {
    await SessionRevocationService.revokeForPasswordReset(userId);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(SocketSessionService.revokeUserSockets).toHaveBeenCalledWith(userId, 'PASSWORD_RESET');
  });

  test('revokeForReuseDetection should execute revocation with TOKEN_REUSE tag', async () => {
    await SessionRevocationService.revokeForReuseDetection(userId, 'a1b2c3d4e5f6');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(SocketSessionService.revokeUserSockets).toHaveBeenCalledWith(
      userId,
      expect.stringContaining('TOKEN_REUSE_DETECTED')
    );
  });

  test('revokeForAdmin should execute revocation with ADMIN_ACTION tag', async () => {
    await SessionRevocationService.revokeForAdmin(userId, 'admin_999', 'POLICY_VIOLATION');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(SocketSessionService.revokeUserSockets).toHaveBeenCalledWith(
      userId,
      expect.stringContaining('ADMIN_ACTION:admin_999')
    );
  });
});
