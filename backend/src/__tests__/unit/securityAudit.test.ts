import { SecurityAuditService } from '../../services/security/SecurityAuditService';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    securityAuditEvent: {
      create: jest.fn().mockResolvedValue({ id: 'audit_123' }),
    },
  },
}));

describe('SecurityAuditService Structured Telemetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should record login success audit event', async () => {
    await SecurityAuditService.logLoginSuccess('usr_audit_1', '192.168.1.1', 'Chrome', 'fp_123', 10);

    expect((prisma as any).securityAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'usr_audit_1',
        eventType: 'LOGIN_SUCCESS',
        severity: 'INFO',
        riskScore: 10,
      }),
    });
  });

  test('should record impossible travel audit event with CRITICAL severity', async () => {
    await SecurityAuditService.logImpossibleTravel('usr_audit_2', 'London', 'Tokyo', 25000, '203.0.113.1');

    expect((prisma as any).securityAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'usr_audit_2',
        eventType: 'IMPOSSIBLE_TRAVEL_DETECTED',
        severity: 'CRITICAL',
        riskLevel: 'HIGH',
      }),
    });
  });

  test('should record key rotation audit event', async () => {
    await SecurityAuditService.logKeyRotation('admin_1', 'v1', 'v2', 45);

    expect((prisma as any).securityAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'admin_1',
        eventType: 'KEY_ROTATED',
        severity: 'CRITICAL',
      }),
    });
  });
});
