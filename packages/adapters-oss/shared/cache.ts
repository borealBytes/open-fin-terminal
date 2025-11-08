/**
 * Simple in-memory cache with TTL support.
 */

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}

/**
 * Memory cache with TTL support for adapter data.
 * 
 * @example
 * const cache = new MemoryCache<YieldCurve>(24 * 60 * 60 * 1000); // 24 hour TTL
 * cache.set('key', data);
 * const data = cache.get('key');
 */
export class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTtlMs: number;

  /**
   * @param defaultTtlMs - Default time-to-live in milliseconds
   */
  constructor(defaultTtlMs: number = 5 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Get a value from cache.
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in cache with TTL.
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlMs - Time to live in milliseconds (optional, uses default)
   */
  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size (includes expired entries until they're accessed).
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries.
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
