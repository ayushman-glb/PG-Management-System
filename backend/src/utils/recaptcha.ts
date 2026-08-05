/**
 * Helper utility for reCAPTCHA Enterprise risk classification and LRU replay prevention
 */

export function classifyRiskTier(score: number): 'TRUSTED' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' {
  if (score >= 0.9) return 'TRUSTED';
  if (score >= 0.7) return 'NORMAL';
  if (score >= 0.5) return 'ELEVATED';
  return 'HIGH_RISK';
}

/**
 * LRU In-Memory Cache to prevent Replay Attacks (tokens used within 2 minutes)
 */
class TokenReplayCache {
  private usedTokens: Map<string, number> = new Map();
  private readonly TTL_MS = 2 * 60 * 1000; // 2 minutes

  public isReused(token: string): boolean {
    this.cleanup();
    if (this.usedTokens.has(token)) {
      return true;
    }
    this.usedTokens.set(token, Date.now());
    return false;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.usedTokens.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.usedTokens.delete(token);
      }
    }
  }
}

export const tokenReplayCache = new TokenReplayCache();
