import { describe, it, expect, beforeEach } from 'vitest';
import { TokenBucketLimiter } from '../rate-limiter';

describe('TokenBucketLimiter', () => {
  let limiter: TokenBucketLimiter;

  beforeEach(() => {
    limiter = new TokenBucketLimiter({ tokensPerSecond: 10, capacity: 10 });
  });

  describe('initialization', () => {
    it('should start with full capacity', () => {
      expect(limiter.isReady(10)).toBe(true);
    });

    it('should use default config when none provided', () => {
      const defaultLimiter = new TokenBucketLimiter();
      expect(defaultLimiter.isReady(1)).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return true when tokens are available', () => {
      expect(limiter.isReady(5)).toBe(true);
    });

    it('should return false when not enough tokens', async () => {
      // Consume all tokens immediately
      await limiter.waitFor(10);
      // Check immediately before any refill can occur
      expect(limiter.isReady(1)).toBe(false);
    });

    it('should check specific token count', () => {
      expect(limiter.isReady(10)).toBe(true);
      expect(limiter.isReady(11)).toBe(false);
    });
  });

  describe('waitFor', () => {
    it('should consume tokens when available', async () => {
      await limiter.waitFor(5);
      expect(limiter.isReady(6)).toBe(false);
      expect(limiter.isReady(5)).toBe(true);
    });

    it('should wait when tokens are not available', async () => {
      // Consume all tokens
      await limiter.waitFor(10);
      
      const start = Date.now();
      await limiter.waitFor(1);
      const elapsed = Date.now() - start;

      // Should have waited ~100ms for 1 token at 10/sec
      expect(elapsed).toBeGreaterThan(50);
    });

    it('should handle multiple tokens', async () => {
      await limiter.waitFor(3);
      expect(limiter.isReady(7)).toBe(true);
      expect(limiter.isReady(8)).toBe(false);
    });
  });

  describe('token refill', () => {
    it('should refill tokens over time', async () => {
      // Consume all tokens
      await limiter.waitFor(10);
      expect(limiter.isReady(1)).toBe(false);

      // Wait for refill (100ms = 1 token at 10/sec)
      await new Promise((resolve) => setTimeout(resolve, 150));
      
      expect(limiter.isReady(1)).toBe(true);
    });

    it('should not exceed capacity', async () => {
      // Wait for potential over-refill
      await new Promise((resolve) => setTimeout(resolve, 200));
      
      expect(limiter.isReady(10)).toBe(true);
      expect(limiter.isReady(11)).toBe(false);
    });
  });

  describe('reset', () => {
    it('should restore full capacity', async () => {
      await limiter.waitFor(10);
      expect(limiter.isReady(1)).toBe(false);

      limiter.reset();
      expect(limiter.isReady(10)).toBe(true);
    });
  });
});
