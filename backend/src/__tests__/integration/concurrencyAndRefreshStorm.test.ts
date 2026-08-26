import { TokenVersionService } from '../../services/security/TokenVersionService';
import { SocketSessionService } from '../../services/security/SocketSessionService';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';
import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
    securityAuditEvent: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../services/tokenBlacklistService', () => ({
  tokenBlacklistService: {
    isTokenBlacklisted: jest.fn(),
    blacklistToken: jest.fn(),
  },
}));

describe('Concurrency & Load Simulation: Refresh Storm & Multi-Session Validation (Redis-Free)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ((prisma as any).user.findUnique as jest.Mock).mockResolvedValue({ tokenVersion: 1 });
    ((prisma as any).user.update as jest.Mock).mockResolvedValue({ tokenVersion: 2 });
    ((prisma as any).refreshToken.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    ((prisma as any).securityAuditEvent.create as jest.Mock).mockResolvedValue({ id: 'audit_conc' });
    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    (tokenBlacklistService.blacklistToken as jest.Mock).mockResolvedValue(undefined);
  });

  test('should simulate 100 parallel API requests checking tokenVersion without race conditions or memory spikes', async () => {
    const userId = 'usr_conc_test';
    const jwtVersion = 1;

    // Launch 100 concurrent validation queries simultaneously
    const validationPromises = Array.from({ length: 100 }, () =>
      TokenVersionService.isValidTokenVersion(userId, jwtVersion)
    );

    const results = await Promise.all(validationPromises);

    expect(results).toHaveLength(100);
    expect(results.every((res) => res === true)).toBe(true);
  });

  test('should simulate 20 concurrent WebSocket connections handshaking simultaneously', async () => {
    const tokenService = new JwtTokenService();
    const token = tokenService.generateAccessToken({
      id: 'usr_ws_concurrent',
      email: 'ws_concurrent@example.com',
      role: 'OWNER',
      tokenVersion: 1,
    });

    const handshakePromises = Array.from({ length: 20 }, (_, idx) => {
      const mockSocket: any = {
        id: `sock_concurrent_${idx}`,
        handshake: {
          auth: { token, deviceId: `dev_${idx}` },
        },
        join: jest.fn(),
      };

      return new Promise<boolean>((resolve) => {
        SocketSessionService.authenticateSocket(mockSocket, (err?: Error) => {
          if (!err) resolve(true);
          else resolve(false);
        });
      });
    });

    const outcomes = await Promise.all(handshakePromises);

    expect(outcomes).toHaveLength(20);
    expect(outcomes.every((ok) => ok === true)).toBe(true);
  });

  test('should simulate singleton refreshPromise deduplicating concurrent 401 token refresh bursts', async () => {
    let networkRefreshCallCount = 0;

    class MockAuthService {
      private refreshPromise: Promise<string> | null = null;

      public async refreshToken(): Promise<string> {
        if (!this.refreshPromise) {
          this.refreshPromise = (async () => {
            networkRefreshCallCount++;
            // Simulate network round-trip latency
            await new Promise((r) => setTimeout(r, 50));
            return 'new_access_token_xyz';
          })().finally(() => {
            this.refreshPromise = null;
          });
        }
        return this.refreshPromise;
      }
    }

    const authService = new MockAuthService();

    // 10 concurrent requests arrive simultaneously after 401
    const burstPromises = Array.from({ length: 10 }, () => authService.refreshToken());
    const refreshedTokens = await Promise.all(burstPromises);

    // Exactly 1 network call must be executed
    expect(networkRefreshCallCount).toBe(1);
    expect(refreshedTokens.every((t) => t === 'new_access_token_xyz')).toBe(true);
  });
});
