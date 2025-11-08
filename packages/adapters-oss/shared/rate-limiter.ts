/**
 * Token bucket rate limiter for API requests.
 * Configurable for different APIs with varying rate limits.
 */

export interface RateLimiterConfig {
  tokensPerSecond: number;
  capacity: number;
}

export class TokenBucketLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly tokensPerSecond: number;
  private readonly capacity: number;

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
    await new Promise((resolve) => setTimeout(() => resolve(undefined), waitMs));
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
  }
}
