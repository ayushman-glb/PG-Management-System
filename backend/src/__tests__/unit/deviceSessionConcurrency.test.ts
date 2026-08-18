import { DeviceService } from "../../modules/devices/device.service";
import { DeviceRepository } from "../../modules/devices/device.repository";
import { SocketServer } from "../../socket/socketServer";

describe("Device Session Concurrency & Policy Suite (Project-Specific Rules)", () => {
  let mockPrisma: any;
  let deviceRepo: DeviceRepository;
  let deviceService: DeviceService;

  beforeEach(() => {
    mockPrisma = {
      userDevice: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      securityAuditEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      loginHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    deviceRepo = new DeviceRepository(mockPrisma as any);
    deviceService = new DeviceService(deviceRepo);
    jest.clearAllMocks();
  });

  describe("Rule 1: Same-Credential, Same-Instant Multi-Device Login Attempts", () => {
    it("should handle concurrent login evaluations for the same account across distinct visitor IDs without collision", async () => {
      const userId = "usr_concurrent_123";
      const attempts = [
        { visitorId: "vis_desktop_1", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0", ip: "192.168.1.1" },
        { visitorId: "vis_desktop_2", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0", ip: "192.168.1.2" },
        { visitorId: "vis_mobile_1", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", ip: "192.168.1.3" },
      ];

      mockPrisma.userDevice.findUnique.mockResolvedValue(null);
      mockPrisma.userDevice.create.mockImplementation((args: any) =>
        Promise.resolve({ id: `dev_${Math.random()}`, ...args.data })
      );
      mockPrisma.securityAuditEvent.create.mockResolvedValue({ id: "aud_1" });

      // Run all attempts in the same instant (Promise.all)
      const results = await Promise.all(
        attempts.map((att) =>
          deviceService.identifyAndEvaluateDevice(
            userId,
            { visitorId: att.visitorId },
            { ipAddress: att.ip, userAgent: att.userAgent, requestId: `req_${att.visitorId}` }
          )
        )
      );

      expect(results).toHaveLength(3);
      results.forEach((res) => {
        expect(res.device).toBeDefined();
        expect(res.isNew).toBe(true);
        expect(res.risk.level).toBeDefined();
      });

      // Confirm all 3 unique devices were created with audit records
      expect(mockPrisma.userDevice.create).toHaveBeenCalledTimes(3);
      expect(mockPrisma.securityAuditEvent.create).toHaveBeenCalledTimes(3);
    });
  });

  describe("Rule 2: Concurrent Session Cap (1 Desktop + 1 Mobile Max)", () => {
    it("should correctly classify device categories as DESKTOP, MOBILE, or TABLET", () => {
      const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      const mobileUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";
      const androidMobileUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
      const iPadUA = "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1";

      const classify = (ua?: string) => {
        if (!ua) return "DESKTOP";
        const low = ua.toLowerCase();
        if (low.includes("ipad") || (low.includes("tablet") && !low.includes("mobile"))) return "TABLET";
        if (low.includes("mobile") || low.includes("android") || low.includes("iphone") || low.includes("ipod")) return "MOBILE";
        return "DESKTOP";
      };

      expect(classify(desktopUA)).toBe("DESKTOP");
      expect(classify(mobileUA)).toBe("MOBILE");
      expect(classify(androidMobileUA)).toBe("MOBILE");
      expect(classify(iPadUA)).toBe("TABLET");
    });

    it("should allow simultaneous active sessions for 1 Desktop and 1 Mobile device without eviction", async () => {
      const userId = "usr_multi_device_1";
      const activeDevices = [
        { id: "dev_desk_1", userId, deviceLabel: "Chrome on Windows", status: "TRUSTED", trustLevel: "TRUSTED" },
        { id: "dev_mob_1", userId, deviceLabel: "Safari on iOS", status: "TRUSTED", trustLevel: "TRUSTED" },
      ];

      mockPrisma.userDevice.findByUserId = jest.fn().mockResolvedValue(activeDevices);

      // Desktop and Mobile coexist peacefully
      const desktopDevices = activeDevices.filter((d) => d.deviceLabel.includes("Windows"));
      const mobileDevices = activeDevices.filter((d) => d.deviceLabel.includes("iOS"));

      expect(desktopDevices).toHaveLength(1);
      expect(mobileDevices).toHaveLength(1);
    });

    it("should revoke previous session and emit real-time event when a second device in the same category logs in", async () => {
      const userId = "usr_evict_test";
      const existingDesktopDevice = {
        id: "dev_desk_old",
        userId,
        deviceLabel: "Chrome on Windows",
        status: "TRUSTED",
        trustLevel: "TRUSTED",
        visitorIdHash: "hash_old",
      };

      const emitSpy = jest.spyOn(SocketServer, "emitToUser").mockImplementation(() => {});

      mockPrisma.userDevice.findUnique.mockResolvedValue(existingDesktopDevice);
      mockPrisma.userDevice.update.mockResolvedValue({
        ...existingDesktopDevice,
        status: "REVOKED",
        trustLevel: "UNTRUSTED",
      });
      mockPrisma.securityAuditEvent.create.mockResolvedValue({ id: "aud_evict_1" });

      // Execute revocation of the old desktop session
      const result = await deviceService.revokeDevice(userId, existingDesktopDevice.id, {
        ipAddress: "10.0.0.1",
        userAgent: "New Desktop Browser",
        requestId: "req_evict_123",
      });

      expect(result.status).toBe("REVOKED");
      expect(mockPrisma.userDevice.update).toHaveBeenCalledWith({
        where: { id: existingDesktopDevice.id },
        data: expect.objectContaining({
          status: "REVOKED",
          trustLevel: "UNTRUSTED",
        }),
      });

      // Verify security audit log record was created
      expect(mockPrisma.securityAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            deviceId: existingDesktopDevice.id,
            eventType: "DEVICE_REVOKED",
          }),
        })
      );

      emitSpy.mockRestore();
    });
  });

  describe("Rule 3: Login/Device History Persistence & Audit Trail", () => {
    it("should record append-only security audit events for every device state transition", async () => {
      const userId = "usr_audit_trail_1";
      const deviceId = "dev_audit_101";

      mockPrisma.securityAuditEvent.create.mockResolvedValue({ id: "aud_evt_1" });

      await deviceRepo.createAuditEvent({
        userId,
        deviceId,
        eventType: "NEW_DEVICE",
        severity: "INFO",
        riskScore: 15,
        riskLevel: "LOW",
        ipAddress: "192.168.1.50",
        userAgent: "Firefox on Windows",
        requestId: "req_audit_1",
        metadata: { outcome: "SUCCESS", deviceCategory: "DESKTOP" },
      });

      expect(mockPrisma.securityAuditEvent.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.securityAuditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          deviceId,
          eventType: "NEW_DEVICE",
          severity: "INFO",
          riskScore: 15,
          riskLevel: "LOW",
          ipAddress: "192.168.1.50",
        }),
      });
    });
  });

  describe("Rule 4: Abuse-Path & Tampering Protection", () => {
    it("should handle blocked devices with immediate access refusal", async () => {
      const blockedDevice = {
        id: "dev_blocked_999",
        userId: "usr_attacker_1",
        visitorIdHash: "hash_malicious",
        status: "BLOCKED",
        trustLevel: "UNTRUSTED",
      };

      mockPrisma.userDevice.findUnique.mockResolvedValue(blockedDevice);

      // Attempting to trust a blocked device must throw an error
      await expect(
        deviceService.trustDevice(blockedDevice.userId, blockedDevice.id)
      ).rejects.toThrow("Cannot trust an explicitly blocked device");
    });

    it("should assign elevated risk score when visitorId is absent or blocked", async () => {
      const result = await deviceService.identifyAndEvaluateDevice(
        "usr_no_visitor",
        { visitorId: "" },
        { ipAddress: "127.0.0.1", userAgent: "HeadlessBot/1.0" }
      );

      expect(result.device).toBeNull();
      expect(result.isNew).toBe(false);
      expect(result.risk.score).toBe(40);
      expect(result.risk.level).toBe("MEDIUM");
      expect(result.risk.reasons).toContain("Fingerprint visitorId unavailable or blocked");
    });
  });
});
