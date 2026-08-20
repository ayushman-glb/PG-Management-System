import { DeviceService } from "../../modules/devices/device.service";
import { DeviceRepository } from "../../modules/devices/device.repository";
import { GeoIpUtil } from "../../utils/geoIp.util";
import { emailTemplates } from "../../modules/email/email.templates";

describe("New Device Alert & Telemetry Logging Suite", () => {
  describe("GeoIpUtil", () => {
    it("should correctly identify localhost and private IPs", () => {
      expect(GeoIpUtil.isLocalOrPrivateIp("127.0.0.1")).toBe(true);
      expect(GeoIpUtil.isLocalOrPrivateIp("::1")).toBe(true);
      expect(GeoIpUtil.isLocalOrPrivateIp("localhost")).toBe(true);
      expect(GeoIpUtil.isLocalOrPrivateIp("192.168.1.100")).toBe(true);
      expect(GeoIpUtil.isLocalOrPrivateIp("10.0.0.1")).toBe(true);
      expect(GeoIpUtil.isLocalOrPrivateIp("203.0.113.195")).toBe(false);
    });

    it("should resolve local development environment details for localhost IP", () => {
      const loc = GeoIpUtil.resolveLocation("127.0.0.1");
      expect(loc.isLocal).toBe(true);
      expect(loc.city).toBe("Localhost");
      expect(loc.region).toBe("Local Development");
      expect(loc.formattedLocation).toContain("Localhost");
    });

    it("should extract client IP from x-forwarded-for header", () => {
      const mockReq: any = {
        headers: {
          "x-forwarded-for": "203.0.113.50, 198.51.100.1",
        },
      };
      const ip = GeoIpUtil.extractClientIp(mockReq);
      expect(ip).toBe("203.0.113.50");
    });
  });

  describe("New Device Login Alert Email Template", () => {
    it("should generate HTML containing device, screen, ip, and location telemetry", () => {
      const html = emailTemplates.newDeviceLoginAlert({
        email: "resident@roombae.com",
        name: "Aayushman",
        deviceLabel: "Chrome on Windows",
        screenResolution: "1920x1080 (24-bit)",
        ipAddress: "127.0.0.1",
        location: "Bengaluru, Karnataka, India",
        loginTime: "2026-08-20T10:00:00Z",
      });

      expect(html).toContain("New Device Sign-in Detected");
      expect(html).toContain("Chrome on Windows");
      expect(html).toContain("1920x1080 (24-bit)");
      expect(html).toContain("127.0.0.1");
      expect(html).toContain("Bengaluru, Karnataka, India");
      expect(html).toContain("Aayushman");
    });
  });

  describe("DeviceService & DeviceRepository Integration", () => {
    let mockPrisma: any;
    let deviceRepo: DeviceRepository;
    let deviceService: DeviceService;

    const testUserId = "507f1f77bcf86cd799439011";
    const testVisitorId = "visitor_fp_unique_abc123";

    beforeEach(() => {
      mockPrisma = {
        userDevice: {
          findUnique: jest.fn(),
          findMany: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        deviceLoginLog: {
          create: jest.fn(),
          update: jest.fn(),
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        securityAuditEvent: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: testUserId,
            email: "resident@roombae.com",
            name: "Resident User",
          }),
        },
      };

      deviceRepo = new DeviceRepository(mockPrisma);
      deviceService = new DeviceService(deviceRepo);
    });

    it("should identify a new device, create PENDING_ALERT log and flag requiresAlert = true", async () => {
      mockPrisma.userDevice.findUnique.mockResolvedValue(null);
      mockPrisma.userDevice.create.mockResolvedValue({
        id: "dev_rec_1",
        userId: testUserId,
        visitorIdHash: "hash_123",
        deviceLabel: "Chrome on Windows",
        status: "NEW",
        trustLevel: "UNTRUSTED",
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      });
      mockPrisma.deviceLoginLog.create.mockResolvedValue({
        id: "log_rec_1",
        userId: testUserId,
        deviceId: "dev_rec_1",
        status: "PENDING_ALERT",
      });

      const result = await deviceService.identifyAndEvaluateDevice(
        testUserId,
        {
          visitorId: testVisitorId,
          deviceLabel: "Chrome on Windows",
          screenResolution: "1920x1080 (24-bit)",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
          requestId: "req_1",
        },
      );

      expect(result.isNew).toBe(true);
      expect(result.requiresAlert).toBe(true);
      expect(result.device.status).toBe("NEW");
      expect(mockPrisma.userDevice.create).toHaveBeenCalled();
      expect(mockPrisma.deviceLoginLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: testUserId,
            status: "PENDING_ALERT",
            screenResolution: "1920x1080 (24-bit)",
            ipAddress: "127.0.0.1",
          }),
        }),
      );
    });

    it("should process ACCEPT decision by marking device TRUSTED and log as ACCEPTED", async () => {
      const existingDevice = {
        id: "dev_rec_1",
        userId: testUserId,
        visitorIdHash: deviceRepo.hashVisitorId(testVisitorId),
        deviceLabel: "Chrome on Windows",
        status: "NEW",
        trustLevel: "UNTRUSTED",
      };

      mockPrisma.userDevice.findUnique.mockResolvedValue(existingDevice);
      mockPrisma.userDevice.update.mockResolvedValue({
        ...existingDevice,
        status: "TRUSTED",
        trustLevel: "TRUSTED",
      });
      mockPrisma.deviceLoginLog.findFirst.mockResolvedValue({
        id: "log_rec_1",
        userId: testUserId,
        status: "PENDING_ALERT",
      });
      mockPrisma.deviceLoginLog.update.mockResolvedValue({
        id: "log_rec_1",
        status: "ACCEPTED",
        actionTaken: "USER_ACCEPTED",
      });

      const decisionResult = await deviceService.processAlertDecision(
        testUserId,
        {
          visitorId: testVisitorId,
          decision: "ACCEPT",
          screenResolution: "1920x1080 (24-bit)",
          deviceLabel: "Chrome on Windows",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
      );

      expect(decisionResult.status).toBe("ACCEPTED");
      expect(mockPrisma.userDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "dev_rec_1" },
          data: expect.objectContaining({
            status: "TRUSTED",
            trustLevel: "TRUSTED",
          }),
        }),
      );
      expect(mockPrisma.deviceLoginLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "ACCEPTED",
            actionTaken: "USER_ACCEPTED",
          }),
        }),
      );
    });

    it("should process REJECT decision by marking device REJECTED, log as REJECTED, and returning loggedOut = true", async () => {
      const existingDevice = {
        id: "dev_rec_1",
        userId: testUserId,
        visitorIdHash: deviceRepo.hashVisitorId(testVisitorId),
        deviceLabel: "Chrome on Windows",
        status: "NEW",
        trustLevel: "UNTRUSTED",
      };

      mockPrisma.userDevice.findUnique.mockResolvedValue(existingDevice);
      mockPrisma.userDevice.update.mockResolvedValue({
        ...existingDevice,
        status: "REJECTED",
        trustLevel: "UNTRUSTED",
      });
      mockPrisma.deviceLoginLog.findFirst.mockResolvedValue({
        id: "log_rec_1",
        userId: testUserId,
        status: "PENDING_ALERT",
      });
      mockPrisma.deviceLoginLog.update.mockResolvedValue({
        id: "log_rec_1",
        status: "REJECTED",
        actionTaken: "USER_REJECTED",
      });

      const decisionResult = await deviceService.processAlertDecision(
        testUserId,
        {
          visitorId: testVisitorId,
          decision: "REJECT",
          screenResolution: "1920x1080 (24-bit)",
          deviceLabel: "Chrome on Windows",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        },
      );

      expect(decisionResult.status).toBe("REJECTED");
      expect(decisionResult.loggedOut).toBe(true);
      expect(mockPrisma.userDevice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "dev_rec_1" },
          data: expect.objectContaining({
            status: "REJECTED",
            trustLevel: "UNTRUSTED",
          }),
        }),
      );
      expect(mockPrisma.deviceLoginLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "REJECTED",
            actionTaken: "USER_REJECTED",
          }),
        }),
      );
    });
  });
});
