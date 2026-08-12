import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import { app } from "../app";
import { DeviceRiskEngine } from "../modules/devices/device.riskEngine";
import { DeviceRepository } from "../modules/devices/device.repository";
import { prisma } from "../config/prisma";

describe("RoomBae Device Identification & Security Subsystem Test Suite", () => {
  const repo = new DeviceRepository(prisma);

  describe("Device Risk Engine Unit Evaluation", () => {
    it("should classify known trusted device with no failed attempts as LOW risk", () => {
      const result = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: "TRUSTED",
        failedAttempts: 0,
      });
      expect(result.level).toBe("LOW");
      expect(result.requiresStepUp).toBe(false);
      expect(result.score).toBe(0);
    });

    it("should classify unrecognized new device as MEDIUM risk", () => {
      const result = DeviceRiskEngine.evaluate({
        isNewDevice: true,
        deviceStatus: "NEW",
        failedAttempts: 0,
      });
      expect(result.level).toBe("MEDIUM");
      expect(result.score).toBeGreaterThanOrEqual(25);
    });

    it("should classify revoked device with failed attempts as HIGH/CRITICAL risk", () => {
      const result = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: "REVOKED",
        failedAttempts: 3,
      });
      expect(["HIGH", "CRITICAL"]).toContain(result.level);
      expect(result.requiresStepUp).toBe(true);
    });

    it("should classify explicitly BLOCKED device as CRITICAL risk with 100 score", () => {
      const result = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: "BLOCKED",
      });
      expect(result.level).toBe("CRITICAL");
      expect(result.score).toBe(100);
      expect(result.requiresStepUp).toBe(true);
    });
  });

  describe("Device Repository & Hashing Security", () => {
    it("should produce consistent SHA-256 visitor ID hashes without storing raw values", () => {
      const rawVisitorId = "test_visitor_fp_123456";
      const hash1 = repo.hashVisitorId(rawVisitorId);
      const hash2 = repo.hashVisitorId(rawVisitorId);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(rawVisitorId);
      expect(hash1.length).toBe(64); // 256 bits in hex
    });
  });

  describe("Security API Endpoints & Auth Guard", () => {
    it("GET /api/v1/security/devices - should return 401 Unauthorized without auth token", async () => {
      const res = await request(app).get("/api/v1/security/devices");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/v1/security/devices/events - should return 401 Unauthorized without auth token", async () => {
      const res = await request(app).get("/api/v1/security/devices/events");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
