import { SessionRevocationService } from '../../services/security/SessionRevocationService';
import { SocketSessionService } from '../../services/security/SocketSessionService';
import { prisma } from '../../config/prisma';

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

describe('Security Remediation: Unified Session Revocation Integration (Redis-Free)', () => {
  const userId = 'usr_int_revocation';

  beforeEach(() => {
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
      }),
    });
  });
});
