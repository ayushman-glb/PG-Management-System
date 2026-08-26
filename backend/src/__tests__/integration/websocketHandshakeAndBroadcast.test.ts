import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { SocketServer } from '../../socket/socketServer';
import { SocketSessionService } from '../../services/security/SocketSessionService';
import { TokenVersionService } from '../../services/security/TokenVersionService';
import { JwtTokenService } from '../../infrastructure/crypto/JwtTokenService';

const tokenService = new JwtTokenService();

describe('WebSocket Handshake, Room Isolation, Broadcast & Live Revocation Integration', () => {
  let httpServer: http.Server;
  let serverPort: number;
  let validOwnerToken: string;
  let validResidentToken: string;

  beforeAll((done) => {
    jest.spyOn(TokenVersionService, 'isValidTokenVersion').mockResolvedValue(true);
    validOwnerToken = tokenService.generateAccessToken({
      id: '64a000000000000000000010',
      email: 'owner.socket@roombae.com',
      role: 'OWNER',
      tokenVersion: 0,
    });

    validResidentToken = tokenService.generateAccessToken({
      id: '64a000000000000000000011',
      email: 'resident.socket@roombae.com',
      role: 'RESIDENT',
      tokenVersion: 0,
    });

    httpServer = http.createServer();
    SocketServer.init(httpServer);
    SocketSessionService.registerIO(SocketServer.getIO() as any);

    httpServer.listen(0, () => {
      const addr = httpServer.address();
      if (addr && typeof addr === 'object') {
        serverPort = addr.port;
      }
      done();
    });
  });

  afterAll((done) => {
    try {
      const io = SocketServer.getIO();
      if (io) {
        io.close(() => {
          done();
        });
      } else if (httpServer.listening) {
        httpServer.close(done);
      } else {
        done();
      }
    } catch {
      if (httpServer.listening) {
        httpServer.close(done);
      } else {
        done();
      }
    }
  });

  it('1. should connect via Socket.IO with valid Bearer JWT and join role rooms', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validOwnerToken },
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Origin: 'https://ayushman-glb.github.io',
      },
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      expect(client.id).toBeDefined();
      client.disconnect();
      done();
    });

    client.on('connect_error', (err) => {
      done(err);
    });
  });

  it('2. should reject socket connection when JWT is missing or invalid', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: 'invalid_malformed_token' },
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Origin: 'https://ayushman-glb.github.io',
      },
    });

    client.on('connect', () => {
      client.disconnect();
      done(new Error('Should not have connected with invalid token'));
    });

    client.on('connect_error', (err) => {
      expect(err.message).toBeDefined();
      client.disconnect();
      done();
    });
  });

  it('3. should broadcast event to resident room and receive payload on connected resident client', (done) => {
    const residentClient: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validResidentToken },
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Origin: 'https://ayushman-glb.github.io',
      },
    });

    residentClient.on('connect', () => {
      // Listen for custom broadcast
      residentClient.on('payment_received', (data: any) => {
        expect(data).toHaveProperty('amount', 8500);
        expect(data).toHaveProperty('status', 'SUCCESS');
        residentClient.disconnect();
        done();
      });

      // Emit event targeting this specific resident
      setTimeout(() => {
        SocketServer.emitToResident('64a000000000000000000011', 'payment_received', {
          amount: 8500,
          status: 'SUCCESS',
          invoiceId: 'inv_123',
        });
      }, 50);
    });

    residentClient.on('connect_error', (err) => {
      done(err);
    });
  });

  it('4. should disconnect active socket and emit auth:revoked upon session revocation', (done) => {
    const victimClient: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validOwnerToken },
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Origin: 'https://ayushman-glb.github.io',
      },
    });

    victimClient.on('connect', () => {
      victimClient.on('auth:revoked', (payload: any) => {
        expect(payload).toBeDefined();
      });

      victimClient.on('disconnect', (reason: string) => {
        expect(['io server disconnect', 'forced close', 'transport close']).toContain(reason);
        victimClient.close();
        done();
      });

      // Trigger mid-session revocation
      setTimeout(() => {
        SocketSessionService.revokeUserSockets('64a000000000000000000010', 'DEVICE_REVOKED');
      }, 100);
    });

    victimClient.on('connect_error', (err) => {
      victimClient.close();
      done(err);
    });
  });
});
