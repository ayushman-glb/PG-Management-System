import { DeviceRiskEngine } from '../../modules/devices/device.riskEngine';
import { DeviceService } from '../../modules/devices/device.service';

describe('Device Fingerprint & Anomaly Evaluation Unit Tests', () => {
  describe('DeviceRiskEngine.evaluate', () => {
    test('evaluates LOW risk for known trusted device', () => {
      const risk = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: 'TRUSTED',
        failedAttempts: 0,
      });

      expect(risk.score).toBe(0);
      expect(risk.level).toBe('LOW');
      expect(risk.requiresStepUp).toBe(false);
    });

    test('evaluates MEDIUM risk for unrecognized new device', () => {
      const risk = DeviceRiskEngine.evaluate({
        isNewDevice: true,
        deviceStatus: 'NEW',
        failedAttempts: 0,
      });

      expect(risk.score).toBe(25);
      expect(risk.level).toBe('MEDIUM');
      expect(risk.requiresStepUp).toBe(false);
    });

    test('evaluates HIGH risk for device with multiple failed attempts and IP change', () => {
      const risk = DeviceRiskEngine.evaluate({
        isNewDevice: true,
        deviceStatus: 'NEW',
        failedAttempts: 2, // 2 * 15 = 30
        ipChanged: true, // 15
      }); // Total: 25 + 30 + 15 = 70 => HIGH

      expect(risk.score).toBe(70);
      expect(risk.level).toBe('HIGH');
      expect(risk.requiresStepUp).toBe(true);
    });

    test('evaluates CRITICAL risk for explicitly BLOCKED device', () => {
      const risk = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: 'BLOCKED',
      });

      expect(risk.score).toBe(100);
      expect(risk.level).toBe('CRITICAL');
      expect(risk.requiresStepUp).toBe(true);
    });

    test('evaluates HIGH risk for REVOKED device', () => {
      const risk = DeviceRiskEngine.evaluate({
        isNewDevice: false,
        deviceStatus: 'REVOKED',
      });

      expect(risk.score).toBe(60);
      expect(risk.level).toBe('HIGH');
      expect(risk.requiresStepUp).toBe(true);
    });
  });

  describe('DeviceService.parseDeviceLabel', () => {
    const mockRepo: any = {};
    const service = new DeviceService(mockRepo);

    test('parses Chrome on Windows user agent', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const label = service.parseDeviceLabel(ua);
      expect(label).toBe('Chrome on Windows');
    });

    test('parses Firefox on macOS user agent', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0';
      const label = service.parseDeviceLabel(ua);
      expect(label).toBe('Firefox on macOS');
    });

    test('uses fallbackLabel if explicitly provided', () => {
      const label = service.parseDeviceLabel('some ua', 'My Work Laptop');
      expect(label).toBe('My Work Laptop');
    });
  });
});
