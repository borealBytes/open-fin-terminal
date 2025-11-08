import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CIKLookup } from '../cik-lookup';
import tickerMappingFixture from './fixtures/ticker-cik-mapping.json';

// Mock fetch globally
global.fetch = vi.fn();

describe('CIKLookup', () => {
  let lookup: CIKLookup;

  beforeEach(() => {
    lookup = new CIKLookup();
    vi.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => tickerMappingFixture,
    });
  });

  describe('formatCIK', () => {
    it('should pad CIK with leading zeros', () => {
      expect(lookup.formatCIK(320193)).toBe('0000320193');
      expect(lookup.formatCIK('320193')).toBe('0000320193');
      expect(lookup.formatCIK('1234')).toBe('0000001234');
    });

    it('should handle already formatted CIKs', () => {
      expect(lookup.formatCIK('0000320193')).toBe('0000320193');
    });

    it('should handle CIKs longer than 10 digits', () => {
      expect(lookup.formatCIK('12345678901')).toBe('12345678901');
    });
  });

  describe('getCIK', () => {
    it('should look up CIK by ticker', async () => {
      const cik = await lookup.getCIK('AAPL');
      expect(cik).toBe('0000320193');
    });

    it('should handle lowercase tickers', async () => {
      const cik = await lookup.getCIK('aapl');
      expect(cik).toBe('0000320193');
    });

    it('should handle tickers with whitespace', async () => {
      const cik = await lookup.getCIK('  AAPL  ');
      expect(cik).toBe('0000320193');
    });

    it('should return null for unknown tickers', async () => {
      const cik = await lookup.getCIK('UNKNOWN');
      expect(cik).toBeNull();
    });

    it('should cache results', async () => {
      // First call
      await lookup.getCIK('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await lookup.getCIK('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should make one fetch for multiple tickers', async () => {
      await lookup.getCIK('AAPL');
      await lookup.getCIK('MSFT');
      await lookup.getCIK('GOOGL');

      // Should only fetch mappings once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error if fetch fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(lookup.getCIK('AAPL')).rejects.toThrow('SEC ticker lookup failed');
    });

    it('should set correct User-Agent header', async () => {
      await lookup.getCIK('AAPL');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('Open Financial Terminal'),
          }),
        })
      );
    });
  });

  describe('clearCache', () => {
    it('should clear cached CIK lookups', async () => {
      await lookup.getCIK('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      lookup.clearCache();

      await lookup.getCIK('AAPL');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Fetched again
    });
  });
});
