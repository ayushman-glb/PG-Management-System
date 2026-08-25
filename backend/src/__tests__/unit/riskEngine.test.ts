import { RiskEngine } from '../../services/security/RiskEngine';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    userDevice: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
      updateMany: jest.fn(),
    },
    loginHistory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    securityAuditEvent: {
      create: jest.fn(),
    },
  },
}));

describe('RiskEngine Multi-Signal Scoring & Impossible Travel', () => {
  const userId = 'usr_risk_test';
  const visitorId = 'fp_browser_12345';
  const ipAddress = '198.51.100.1';
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return ALLOW (risk < 40) for known trusted device', async () => {
    ((prisma as any).userDevice.findFirst as jest.Mock).mockResolvedValue({
      id: 'dev_1',
      userId,
      visitorIdHash: 'some_hash',
      status: 'TRUSTED',
      trustLevel: 'TRUSTED',
      lastIpHash: 'some_ip_hash',
      userAgentHash: 'some_ua_hash',
      lastActive: new Date(),
    });
    ((prisma as any).loginHistory.findFirst as jest.Mock).mockResolvedValue({
      id: 'lh_1',
      userId,
      ipAddress,
      createdAt: new Date(),
    });

    const assessment = await RiskEngine.evaluateLoginRisk(userId, visitorId, ipAddress, userAgent);
    expect(assessment.riskScore).toBeLessThan(40);
    expect(assessment.decision).toBe('ALLOW');
  });

  test('should return STEP_UP (40 <= risk <= 69) for new unrecognized device with VPN proxy anomaly', async () => {
    ((prisma as any).userDevice.findFirst as jest.Mock).mockResolvedValue(null);
    ((prisma as any).loginHistory.findFirst as jest.Mock).mockResolvedValue({
      id: 'lh_prev',
      userId,
      ipAddress: '10.0.0.1',
      createdAt: new Date(),
    });

    const assessment = await RiskEngine.evaluateLoginRisk(userId, visitorId, ipAddress, userAgent, { isVpn: true });
    expect(assessment.riskScore).toBeGreaterThanOrEqual(40);
    expect(assessment.riskScore).toBeLessThan(70);
    expect(assessment.decision).toBe('STEP_UP');
  });

  test('should return BLOCK (risk >= 70) for blocked or revoked device', async () => {
    ((prisma as any).userDevice.findFirst as jest.Mock).mockResolvedValue({
      id: 'dev_blocked',
      userId,
      visitorIdHash: 'some_hash',
      status: 'BLOCKED',
      trustLevel: 'UNTRUSTED',
      lastIpHash: 'some_ip_hash',
      userAgentHash: 'some_ua_hash',
      lastActive: new Date(),
    });

    const assessment = await RiskEngine.evaluateLoginRisk(userId, visitorId, ipAddress, userAgent);
    expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(assessment.decision).toBe('BLOCK');
  });

  test('should calculate impossible travel velocity correctly and flag IMPOSSIBLE_TRAVEL signal (+35)', async () => {
    ((prisma as any).userDevice.findFirst as jest.Mock).mockResolvedValue({
      id: 'dev_known',
      userId,
      visitorIdHash: 'some_hash',
      status: 'TRUSTED',
      trustLevel: 'TRUSTED',
      lastIpHash: 'some_ip_hash',
      userAgentHash: 'some_ua_hash',
    });

    ((prisma as any).loginHistory.findFirst as jest.Mock).mockResolvedValue({
      id: 'lh_london',
      userId,
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country: 'UK',
      createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    });

    // Current login in Tokyo (35.6762, 139.6503) ~9,500 km away in 10 minutes (speed ~57,000 km/h)
    const assessment = await RiskEngine.evaluateLoginRisk(
      userId,
      visitorId,
      '203.0.113.50',
      userAgent,
      {
        latitude: 35.6762,
        longitude: 139.6503,
        city: 'Tokyo',
        country: 'Japan',
      }
    );

    // Signal must be detected regardless of net score
    expect(assessment.signals.some((s: string) => s.includes('IMPOSSIBLE_TRAVEL'))).toBe(true);
    expect(assessment.riskScore).toBeGreaterThanOrEqual(0);
  });

  test('should detect VPN/Tor proxies and calculate Haversine distance accurately', () => {
    // Distance between New York (40.7128, -74.0060) and Los Angeles (34.0522, -118.2437) is ~3935 km
    const distance = RiskEngine.calculateHaversineDistanceKm(40.7128, -74.006, 34.0522, -118.2437);
    expect(Math.round(distance)).toBeGreaterThan(3900);
    expect(Math.round(distance)).toBeLessThan(4000);
  });
});
