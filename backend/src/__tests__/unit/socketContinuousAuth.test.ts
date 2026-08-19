import { SocketSessionService } from '../../services/security/SocketSessionService';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';
import { tokenBlacklistService } from '../../services/tokenBlacklistService';
import { TokenVersionService } from '../../services/security/TokenVersionService';

jest.mock('../../infrastructure/crypto/JwtTokenService');
jest.mock('../../services/tokenBlacklistService');
jest.mock('../../services/security/TokenVersionService');

describe('SocketSessionService Continuous WebSocket Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('authenticateSocket should successfully authenticate valid handshake and attach metadata', async () => {
    const mockDecoded = {
      id: 'usr_ws_1',
      email: 'ws@example.com',
      role: 'OWNER',
      tokenVersion: 1,
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    (JwtTokenService.prototype.verifyAccessToken as jest.Mock).mockReturnValue(mockDecoded);
    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(false);
    (TokenVersionService.isValidTokenVersion as jest.Mock).mockResolvedValue(true);

    const mockSocket: any = {
      id: 'sock_123',
      handshake: {
        auth: { token: 'valid_jwt_token', deviceId: 'dev_abc' },
      },
      join: jest.fn(),
    };

    const next = jest.fn();

    await SocketSessionService.authenticateSocket(mockSocket, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.data.userId).toBe('usr_ws_1');
    expect(mockSocket.data.role).toBe('OWNER');
    expect(mockSocket.join).toHaveBeenCalledWith('user_usr_ws_1');
    expect(mockSocket.join).toHaveBeenCalledWith('owner_usr_ws_1');
  });

  test('authenticateSocket should reject blacklisted tokens', async () => {
    (JwtTokenService.prototype.verifyAccessToken as jest.Mock).mockReturnValue({
      id: 'usr_ws_2',
      tokenVersion: 1,
    });
    (tokenBlacklistService.isTokenBlacklisted as jest.Mock).mockResolvedValue(true);

    const mockSocket: any = {
      id: 'sock_blacklisted',
      handshake: {
        auth: { token: 'blacklisted_jwt_token' },
      },
    };

    const next = jest.fn();

    await SocketSessionService.authenticateSocket(mockSocket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toContain('revoked');
  });

  test('authorizeSocketEvent should allow events when token is fresh and version matches', async () => {
    (TokenVersionService.isValidTokenVersion as jest.Mock).mockResolvedValue(true);

    const mockSocket: any = {
      id: 'sock_event_ok',
      data: {
        userId: 'usr_ws_3',
        tokenVersion: 1,
        exp: Math.floor(Date.now() / 1000) + 600,
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    const next = jest.fn();

    await SocketSessionService.authorizeSocketEvent(mockSocket, ['join_room', 'room_123'], next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });

  test('authorizeSocketEvent should block event and disconnect socket if token version becomes stale', async () => {
    (TokenVersionService.isValidTokenVersion as jest.Mock).mockResolvedValue(false);

    const mockSocket: any = {
      id: 'sock_stale',
      data: {
        userId: 'usr_ws_4',
        tokenVersion: 1,
        exp: Math.floor(Date.now() / 1000) + 600,
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    const next = jest.fn();

    await SocketSessionService.authorizeSocketEvent(mockSocket, ['post_message', 'hello'], next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(mockSocket.emit).toHaveBeenCalledWith('auth:revoked', expect.any(Object));
    expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
  });
});
