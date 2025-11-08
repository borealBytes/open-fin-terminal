/**
 * Token bucket rate limiter for SEC EDGAR API.
 * SEC allows 10 requests per second.
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
 * Ensures requests don't exceed SEC EDGAR's rate limit of 10 req/sec.
 */
export class TokenBucketLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      tokensPerSecond: config.tokensPerSecond ?? 10, // SEC EDGAR default
      capacity: config.capacity ?? 10,
    };
    this.tokens = this.config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Wait for a token to become available.
   * 
   * @param tokens - Number of tokens needed (default: 1)
   * @returns Promise that resolves when token is available
   */
  async waitFor(tokens: number = 1): Promise<void> {
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time needed
    const tokensNeeded = tokens - this.tokens;
    const waitMs = (tokensNeeded / this.config.tokensPerSecond) * 1000;

    await new Promise((resolve) => setTimeout(resolve, waitMs));
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
    const tokensToAdd = (elapsed / 1000) * this.config.tokensPerSecond;

    this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Reset the limiter.
   */
  reset(): void {
    this.tokens = this.config.capacity;
    this.lastRefill = Date.now();
  }
}
