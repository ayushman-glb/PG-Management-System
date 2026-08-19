import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { SocketServer } from '../../socket/socketServer';
import jwt from 'jsonwebtoken';

describe('RoomBae Enterprise Real-time WebSocket Subsystem Suite', () => {
  let httpServer: http.Server;
  let serverPort: number;
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me_in_production';

  const validOwnerToken = jwt.sign(
    { id: 'usr_owner_1', email: 'owner@roombae.com', role: 'OWNER', tokenVersion: 0 },
    secret,
    { expiresIn: '1h' }
  );

  const validResidentToken = jwt.sign(
    { id: 'usr_res_1', email: 'resident@roombae.com', role: 'RESIDENT', residentCode: 'RB-001', tokenVersion: 0 },
    secret,
    { expiresIn: '1h' }
  );

  beforeAll((done) => {
    httpServer = http.createServer();
    SocketServer.init(httpServer);
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
      io.close(() => {
        done();
      });
    } catch {
      if (httpServer.listening) {
        httpServer.close(done);
      } else {
        done();
      }
    }
  });

  it('1. Should successfully connect and complete handshake with valid Bearer token', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validOwnerToken },
      transports: ['websocket', 'polling'],
      extraHeaders: {
        Origin: 'https://ayushman-glb.github.io'
      }
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      client.disconnect();
      done();
    });

    client.on('connect_error', (err: any) => {
      done(err);
    });
  });

  it('2. Should reject handshake when authentication token is missing', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      transports: ['websocket', 'polling'],
      reconnection: false
    });

    client.on('connect', () => {
      client.disconnect();
      done(new Error('Should not have connected without token'));
    });

    client.on('connect_error', (err: any) => {
      expect(err.message).toMatch(/Authentication failed/);
      client.disconnect();
      done();
    });
  });

  it('3. Should join PG room and receive targeted broadcast events', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validOwnerToken },
      transports: ['websocket', 'polling']
    });

    client.on('connect', () => {
      client.emit('join_pg', 'pg_marathahalli_1');

      client.on('bed_updated', (payload: any) => {
        expect(payload.bedId).toBe('bed_101');
        expect(payload.status).toBe('OCCUPIED');
        client.disconnect();
        done();
      });

      setTimeout(() => {
        SocketServer.emitToPg('pg_marathahalli_1', 'bed_updated', {
          bedId: 'bed_101',
          status: 'OCCUPIED'
        });
      }, 50);
    });
  });

  it('4. Should join Resident room and receive private tenant notifications', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validResidentToken },
      transports: ['websocket', 'polling']
    });

    client.on('connect', () => {
      client.emit('join_resident', 'usr_res_1');

      client.on('payment_received', (payload: any) => {
        expect(payload.invoiceId).toBe('INV-2026-001');
        expect(payload.amount).toBe(8500);
        client.disconnect();
        done();
      });

      setTimeout(() => {
        SocketServer.emitToResident('usr_res_1', 'payment_received', {
          invoiceId: 'INV-2026-001',
          amount: 8500
        });
      }, 50);
    });
  });

  it('5. Should handle mid-session token refresh via auth_refresh event', (done) => {
    const client: ClientSocketType = ClientSocket(`http://127.0.0.1:${serverPort}`, {
      auth: { token: validOwnerToken },
      transports: ['websocket', 'polling']
    });

    const refreshedToken = jwt.sign(
      { id: 'usr_owner_1', email: 'owner@roombae.com', role: 'OWNER', tokenVersion: 0 },
      secret,
      { expiresIn: '2h' }
    );

    client.on('connect', () => {
      client.emit('auth_refresh', refreshedToken);

      client.on('auth_refresh_success', (res: any) => {
        expect(res.status).toBe('OK');
        expect(res.userId).toBe('usr_owner_1');
        client.disconnect();
        done();
      });
    });
  });
});
