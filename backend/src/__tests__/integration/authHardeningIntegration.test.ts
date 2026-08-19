import { SessionRevocationService } from '../../services/security/SessionRevocationService';
import { TokenVersionService } from '../../services/security/TokenVersionService';
import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { SocketSessionService } from '../../services/security/SocketSessionService';
import { prisma } from '../../config/prisma';
import { redisClient } from '../../config/redis';

jest.mock('../../config/prisma', () => ({
  prisma: {
    refreshToken: {
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    securityAuditEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../config/redis', () => {
  const store = new Map<string, string>();
  return {
    isRedisReady: jest.fn(() => true),
    redisClient: {
      get: jest.fn(async (k: string) => store.get(k) || null),
      set: jest.fn(async (k: string, v: string) => {
        store.set(k, v);
        return 'OK';
      }),
      del: jest.fn(async (k: string) => {
        store.delete(k);
        return 1;
      }),
      _clear: () => store.clear(),
    },
  };
});

describe('Security Remediation Issue 4: Unified Session Revocation Integration', () => {
  const userId = 'usr_int_revocation';

  beforeEach(() => {
    (redisClient as any)._clear();
    jest.clearAllMocks();
  });

  test('should execute full revocation cascade: DB sessions, tokenVersion, WebSocket eviction, and audit log', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 5 });
    const revokeSocketsSpy = jest.spyOn(SocketSessionService, 'revokeUserSockets').mockImplementation(async () => {});

    await SessionRevocationService.revokeAllSessions(
      userId,
      'REFRESH_TOKEN_REUSE_DETECTED',
      '203.0.113.195',
      'Mozilla/5.0'
    );

    // 1. All refresh tokens revoked in DB
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    // 2. TokenVersion incremented in MongoDB
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });

    // 3. Active WebSocket connections evicted
    expect(revokeSocketsSpy).toHaveBeenCalledWith(userId, 'REFRESH_TOKEN_REUSE_DETECTED');

    // 4. SecurityAuditEvent recorded
    expect(prisma.securityAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        eventType: 'SESSION_REVOKED',
        severity: 'CRITICAL',
      }),
    });
  });
});
