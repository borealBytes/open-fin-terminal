/**
 * Token bucket rate limiter for API requests.
 * TS/Node/browser safe: no globals or platform specifics.
 * Use only globalThis which is always defined.
 * Avoids any reference errors or missing names in TS/Node/Browsers/CI.
 */

export interface RateLimiterConfig {
  tokensPerSecond: number;
  capacity: number;
}

// TS-safe: setTimeout and clearTimeout from globalThis, type assertions for universal compatibility
const setTimeoutAny = (globalThis as any).setTimeout as typeof setTimeout;
const clearTimeoutAny = (globalThis as any).clearTimeout as typeof clearTimeout;

export class TokenBucketLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerSecond: number;
  private readonly capacity: number;
  private timerRef: ReturnType<typeof setTimeout> | null = null;

  constructor(tokensPerSecond: number = 10) {
    this.tokensPerSecond = tokensPerSecond;
    this.capacity = tokensPerSecond;
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refillTokens();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }
    const tokensNeeded = tokens - this.tokens;
    const waitMs = (tokensNeeded / this.tokensPerSecond) * 1000;
    await new Promise<void>((resolve) => {
      this.timerRef = setTimeoutAny(() => {
        this.timerRef = null;
        resolve();
      }, waitMs);
    });
    this.refillTokens();
    this.tokens -= tokens;
  }

  isReady(tokens: number = 1): boolean {
    this.refillTokens();
    return this.tokens >= tokens;
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.tokensPerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
    if (this.timerRef) {
      clearTimeoutAny(this.timerRef);
      this.timerRef = null;
    }
  }
}
