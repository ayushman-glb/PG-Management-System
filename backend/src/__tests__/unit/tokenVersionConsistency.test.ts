import { TokenVersionService } from '../../services/security/TokenVersionService';
import { prisma } from '../../config/prisma';

jest.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('Security Remediation: Token Version Authoritative MongoDB Consistency', () => {
  const userId = 'usr_version_test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return true on matching token version from cache', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 2 });

    // Prime cache
    const initialVersion = await TokenVersionService.getTokenVersion(userId);
    expect(initialVersion).toBe(2);

    // Subsequent call should hit memory cache without calling MongoDB
    (prisma.user.findUnique as jest.Mock).mockClear();
    const isValid = await TokenVersionService.isValidTokenVersion(userId, 2);
    expect(isValid).toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('should return false when decoded token version does not match authoritative version', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 3 });

    const isValid = await TokenVersionService.isValidTokenVersion(userId, 1);
    expect(isValid).toBe(false);
  });

  test('should atomically increment token version in MongoDB and synchronize cache', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 4 });

    const newVersion = await TokenVersionService.incrementTokenVersion(userId);
    expect(newVersion).toBe(4);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });
  });

  test('should invalidate cache and re-query MongoDB when explicitly requested', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, tokenVersion: 5 });

    await TokenVersionService.invalidateCache(userId);
    const version = await TokenVersionService.getTokenVersion(userId);
    expect(version).toBe(5);
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });
});
