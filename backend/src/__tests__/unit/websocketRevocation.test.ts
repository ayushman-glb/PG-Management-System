import { SocketSessionService } from '../../services/security/SocketSessionService';
import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { TokenVersionService } from '../../services/security/TokenVersionService';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

jest.mock('../../services/tokenBlacklistService', () => ({
  tokenBlacklistService: {
    isTokenBlacklisted: jest.fn(),
  },
}));

jest.mock('../../services/security/TokenVersionService', () => ({
  TokenVersionService: {
    isValidTokenVersion: jest.fn(),
  },
}));

describe('Security Remediation Issue 5: WebSocket Zero-Trust Handshake and Live Revocation', () => {
  const mockUserId = 'usr_ws_sec_test';
  let mockSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket = {
      id: 'sock_123',
      handshake: {
        auth: { token: 'valid_access_token_123' },
        headers: {},
        query: {},
      },
      data: {},
      disconnect: jest.fn(),
      emit: jest.fn(),
    };
  });

  test('should accept valid socket handshake and configure disconnect timer', async () => {
    jest.spyOn(JwtTokenService.prototype, 'verifyAccessToken').mockReturnValue({
      id: mockUserId,
      email: 'ws@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 1,
      exp: Math.floor(Date.now() / 1000) + 300,
    } as any);

    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    (TokenVersionService.isValidTokenVersion as jest.Mock).mockResolvedValue(true);

    const nextFn = jest.fn();
    await SocketSessionService.authenticateSocket(mockSocket, nextFn);

    expect(nextFn).toHaveBeenCalledWith();
    expect(mockSocket.data.userId).toBe(mockUserId);
    expect(mockSocket.data.disconnectTimer).toBeDefined();

    clearTimeout(mockSocket.data.disconnectTimer);
  });

  test('should reject socket connection if access token is blacklisted in Redis', async () => {
    jest.spyOn(JwtTokenService.prototype, 'verifyAccessToken').mockReturnValue({
      id: mockUserId,
      email: 'ws@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 1,
    } as any);

    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(true);

    const nextFn = jest.fn();
    await SocketSessionService.authenticateSocket(mockSocket, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
    const errorPassed: Error = nextFn.mock.calls[0][0];
    expect(errorPassed.message).toContain('Token has been revoked');
  });

  test('should reject socket connection if token version is invalidated', async () => {
    jest.spyOn(JwtTokenService.prototype, 'verifyAccessToken').mockReturnValue({
      id: mockUserId,
      email: 'ws@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 1,
    } as any);

    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    (TokenVersionService.isValidTokenVersion as jest.Mock).mockResolvedValue(false);

    const nextFn = jest.fn();
    await SocketSessionService.authenticateSocket(mockSocket, nextFn);

    expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
    const errorPassed: Error = nextFn.mock.calls[0][0];
    expect(errorPassed.message).toContain('Session invalidated');
  });

  test('should broadcast auth:revoked and disconnect active sockets when session revoked', async () => {
    const mockEmit = jest.fn();
    const mockTo = jest.fn(() => ({
      emit: mockEmit,
    }));

    const mockSocketDisconnect = jest.fn();
    const mockUserSocket = {
      id: 'sock_live_user',
      data: { userId: mockUserId },
      disconnect: mockSocketDisconnect,
    };

    const mockSocketsMap = new Map();
    mockSocketsMap.set('sock_live_user', mockUserSocket);

    const mockIo = {
      to: mockTo,
      sockets: {
        sockets: mockSocketsMap,
      },
    };

    SocketSessionService.registerIO(mockIo as any);
    SocketSessionService.revokeUserSockets(mockUserId, 'LOGOUT_ALL');

    expect(mockTo).toHaveBeenCalledWith(`user_${mockUserId}`);
    expect(mockEmit).toHaveBeenCalledWith('auth:revoked', expect.objectContaining({
      userId: mockUserId,
      reason: 'LOGOUT_ALL',
    }));
    expect(mockSocketDisconnect).toHaveBeenCalledWith(true);
  });
});
