/**
 * Token bucket rate limiter for API requests.
 * Best-practice cross-platform: use window.setTimeout / window.clearTimeout if present, fallback to global, fallback to Node.js.
 * No ambiguity for TS. Compatible with TurboRepo, Node, browser, pnpm, CI, and all environments.
 */

export interface RateLimiterConfig {
  tokensPerSecond: number;
  capacity: number;
}

// Get cross-platform setTimeout / clearTimeout.
function getTimeoutFns() {
  if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
    return { setTimeout: window.setTimeout.bind(window), clearTimeout: window.clearTimeout.bind(window) };
  }
  if (typeof global !== 'undefined' && typeof global.setTimeout === 'function') {
    return { setTimeout: global.setTimeout.bind(global), clearTimeout: global.clearTimeout.bind(global) };
  }
  // Last-ditch: see if globalThis is defined with setTimeout.
  if (typeof globalThis !== 'undefined' && typeof globalThis.setTimeout === 'function') {
    return { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) };
  }
  throw new Error('setTimeout not available in this JS environment.');
}
const { setTimeout, clearTimeout } = getTimeoutFns();

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
      this.timerRef = setTimeout(() => {
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
      clearTimeout(this.timerRef);
      this.timerRef = null;
    }
  }
}
