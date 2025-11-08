/**
 * Token bucket rate limiter for API requests.
 * 
 * Configurable for different APIs with varying rate limits.
 */

export interface RateLimiterConfig {
  /** Tokens per second */
  tokensPerSecond: number;
  /** Maximum burst capacity */
  capacity: number;
}

/**
 * Token bucket rate limiter implementation.
 * 
 * Ensures requests don't exceed API rate limits.
 */
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

  /**
   * Acquire a token, waiting if necessary.
   * @param tokens - Number of tokens needed (default: 1)
   * @returns Promise that resolves when token is acquired
   */
  async acquire(tokens: number = 1): Promise<void> {
    this.refillTokens();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }
    // Calculate wait time needed
    const tokensNeeded = tokens - this.tokens;
    const waitMs = (tokensNeeded / this.tokensPerSecond) * 1000;
    // @ts-ignore: node and browser support
    const _setTimeout = typeof setTimeout !== 'undefined' ? setTimeout : (fn: () => void, ms: number) => {require('timers').setTimeout(fn, ms);};
    await new Promise((resolve) => _setTimeout(resolve, waitMs));
    this.refillTokens();
    this.tokens -= tokens;
  }

  /**
   * Check if tokens are available without waiting.
   */
  isReady(tokens: number = 1): boolean {
    this.refillTokens();
    return this.tokens >= tokens;
  }

  /**
   * Refill tokens based on time elapsed.
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.tokensPerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Reset the limiter.
   */
  reset(): void {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}
