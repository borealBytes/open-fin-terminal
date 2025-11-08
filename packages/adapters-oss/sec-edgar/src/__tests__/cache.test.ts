import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryCache } from '../cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.get('key1')).toBe('value1');
    });

    it('should handle different types', () => {
      cache.set('string', 'hello', 1000);
      cache.set('number', 42, 1000);
      cache.set('object', { foo: 'bar' }, 1000);
      cache.set('array', [1, 2, 3], 1000);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should expire after TTL', async () => {
      cache.set('key1', 'value1', 50); // 50ms TTL
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.get('key1')).toBeNull();
    });

    it('should not expire before TTL', async () => {
      cache.set('key1', 'value1', 200); // 200ms TTL
      
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired keys', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cache.set('key1', 'value1', 50);
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove keys', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.has('key1')).toBe(true);

      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should return true if key existed', () => {
      cache.set('key1', 'value1', 1000);
      expect(cache.delete('key1')).toBe(true);
    });

    it('should return false if key did not exist', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1', 1000);
      cache.set('key2', 'value2', 1000);
      cache.set('key3', 'value3', 1000);

      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return number of entries', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1', 1000);
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2', 1000);
      expect(cache.size()).toBe(2);
    });

    it('should include expired entries until accessed', async () => {
      cache.set('key1', 'value1', 50);
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Size includes expired entry
      expect(cache.size()).toBe(1);
      
      // Accessing expired entry removes it
      cache.get('key1');
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cache.set('key1', 'value1', 50);
      cache.set('key2', 'value2', 1000);

      await new Promise((resolve) => setTimeout(resolve, 100));
      
      expect(cache.size()).toBe(2); // Both still in cache
      cache.cleanup();
      expect(cache.size()).toBe(1); // Expired entry removed
      expect(cache.get('key2')).toBe('value2');
    });
  });
});
