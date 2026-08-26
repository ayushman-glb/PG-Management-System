import { prisma } from '../../config/prisma';

export class TokenVersionService {
  private static versionCache = new Map<string, number>();

  public static async incrementTokenVersion(userId: string): Promise<number> {
    if ((prisma as any).user?.update) {
      const updated = await (prisma as any).user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
        select: { tokenVersion: true },
      });
      this.versionCache.set(userId, updated.tokenVersion);
      return updated.tokenVersion;
    }
    return 1;
  }

  public static async invalidateCache(userId: string): Promise<void> {
    this.versionCache.delete(userId);
  }

  public static async getTokenVersion(userId: string): Promise<number> {
    return this.getCachedVersion(userId);
  }

  public static async syncCache(userId: string): Promise<number> {
    if ((prisma as any).user?.findUnique) {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: { tokenVersion: true },
      });
      const version = user?.tokenVersion || 1;
      this.versionCache.set(userId, version);
      return version;
    }
    return 1;
  }

  public static async getCachedVersion(userId: string): Promise<number> {
    if (this.versionCache.has(userId)) {
      return this.versionCache.get(userId)!;
    }
    return this.syncCache(userId);
  }

  public static async isValidTokenVersion(userId: string, tokenVersion: number): Promise<boolean> {
    const currentVersion = await this.getCachedVersion(userId);
    return currentVersion === tokenVersion;
  }
}
