import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { app } from '../src/app';
import { SocketServer } from '../src/socket/socketServer';
import { prisma } from '../src/config/prisma';
import * as jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

const PORT = 5006;
let httpServer: http.Server;

interface ITestResult {
  suite: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

const results: ITestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ suite: 'Real-Time Socket.IO Pipeline', name, passed: true, durationMs });
    console.log(`\x1b[32m[PASS]\x1b[0m ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    const error = err?.message || String(err);
    results.push({ suite: 'Real-Time Socket.IO Pipeline', name, passed: false, durationMs, error });
    console.error(`\x1b[31m[FAIL]\x1b[0m ${name} (${durationMs}ms)\n       Error: ${error}`);
  }
}

export async function runSocketIOPipelineSuite(): Promise<{ total: number; passed: number; failed: number; results: ITestResult[] }> {
  console.log('\n================================================================');
  console.log('⚡ MODULE 4: REAL-TIME SOCKET.IO PIPELINE & ROOM AUTHORIZATION');
  console.log('================================================================\n');

  httpServer = http.createServer(app);
  SocketServer.init(httpServer);

  await new Promise<void>((resolve) => {
    httpServer.listen(PORT, () => resolve());
  });

  const resident = await prisma.user.findFirst({ where: { email: 'ankursaha985@gmail.com' } });
  const owner = await prisma.user.findFirst({ where: { email: '33200122040@tib.edu.in' } });
  const pg = await prisma.pG.findFirst({ where: { ownerId: owner!.id } });

  const residentToken = jwt.sign(
    { id: resident!.id, email: resident!.email, role: resident!.role, tokenVersion: resident!.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const ownerToken = jwt.sign(
    { id: owner!.id, email: owner!.email, role: owner!.role, tokenVersion: owner!.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  let residentClient: any = null;
  let ownerClient: any = null;

  try {
    // 1. Socket Handshake Authentication
    await test('4.1 Socket.IO Handshake Authentication with Valid JWT', async () => {
      residentClient = ClientSocket(`http://127.0.0.1:${PORT}`, {
        auth: { token: residentToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Handshake connection timed out')), 5000);
        residentClient!.on('connect', () => {
          clearTimeout(timer);
          resolve();
        });
        residentClient!.on('connect_error', (err: any) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      if (!residentClient?.connected) {
        throw new Error('Socket failed to connect');
      }
    });

    // 2. Direct User Room Message Delivery
    await test('4.2 Direct User Room Message Dispatch (emitToUser)', async () => {
      const received = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('emitToUser event timed out')), 5000);
        residentClient!.once('test_user_notification', (data: any) => {
          clearTimeout(timer);
          resolve(data);
        });

        // Trigger event from server
        SocketServer.emitToUser(resident!.id, 'test_user_notification', {
          title: 'Rent Receipt Ready',
          invoiceId: 'inv_qa_123',
        });
      });

      if (received.invoiceId !== 'inv_qa_123') {
        throw new Error('Received unexpected payload data');
      }
    });

    // 3. PG Multi-Tenant Room Joining & Event Delivery
    await test('4.3 PG Multi-Tenant Room Joining & Targeted Broadcast (emitToPG)', async () => {
      ownerClient = ClientSocket(`http://127.0.0.1:${PORT}`, {
        auth: { token: ownerToken },
        transports: ['websocket'],
      });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Owner connection timed out')), 5000);
        ownerClient!.on('connect', () => {
          clearTimeout(timer);
          resolve();
        });
      });

      // Join PG room
      ownerClient.emit('join_pg', pg!.id);
      await new Promise((r) => setTimeout(r, 200));

      const received = await new Promise<any>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('emitToPG event timed out')), 5000);
        ownerClient!.once('pg_bed_status_changed', (data: any) => {
          clearTimeout(timer);
          resolve(data);
        });

        // Trigger PG event from server
        SocketServer.emitToPG(pg!.id, 'pg_bed_status_changed', {
          bedNumber: 'B101',
          newStatus: 'OCCUPIED',
        });
      });

      if (received.bedNumber !== 'B101') {
        throw new Error('Received incorrect PG broadcast payload');
      }
    });

    // 4. Global Broadcast Event Delivery
    await test('4.4 Global System Broadcast Delivery to Multiple Active Clients', async () => {
      let residentGotIt = false;
      let ownerGotIt = false;

      const pResident = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Resident broadcast timed out')), 5000);
        residentClient!.once('system_broadcast', (msg: any) => {
          clearTimeout(timer);
          if (msg.announcement === 'MAINTENANCE_TONIGHT') residentGotIt = true;
          resolve();
        });
      });

      const pOwner = new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Owner broadcast timed out')), 5000);
        ownerClient!.once('system_broadcast', (msg: any) => {
          clearTimeout(timer);
          if (msg.announcement === 'MAINTENANCE_TONIGHT') ownerGotIt = true;
          resolve();
        });
      });

      // Emit global broadcast
      SocketServer.broadcast('system_broadcast', { announcement: 'MAINTENANCE_TONIGHT' });

      await Promise.all([pResident, pOwner]);

      if (!residentGotIt || !ownerGotIt) {
        throw new Error(`Broadcast not received by all clients (resident: ${residentGotIt}, owner: ${ownerGotIt})`);
      }
    });

  } finally {
    if (residentClient?.connected) residentClient.disconnect();
    if (ownerClient?.connected) ownerClient.disconnect();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  return { total: results.length, passed, failed, results };
}

if (require.main === module) {
  runSocketIOPipelineSuite()
    .then(({ passed, failed }) => {
      console.log(`\nModule 4 Completed: ${passed} passed, ${failed} failed.\n`);
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Fatal Module 4 Error:', err);
      process.exit(1);
    });
}
