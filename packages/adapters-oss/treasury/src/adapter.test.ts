import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreasuryAdapter } from './adapter';
import yieldCurveFixture from './__fixtures__/yield-curve-2025-11-08.json';
import historicalYieldsFixture from './__fixtures__/historical-yields.json';

// Mock fetch globally
global.fetch = vi.fn();

describe('TreasuryAdapter', () => {
  let adapter: TreasuryAdapter;

  beforeEach(() => {
    adapter = new TreasuryAdapter();
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(adapter.name).toBe('treasury');
    });

    it('should be a built-in adapter', () => {
      expect(adapter.type).toBe('built-in');
    });

    it('should not require setup', () => {
      expect(adapter.requiresSetup).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.quotes).toBe(false);
      expect(capabilities.historical).toBe(false);
      expect(capabilities.fundamentals).toBe(false);
      expect(capabilities.realtime).toBe(false);
      expect(capabilities.yieldCurve).toBe(true);
      expect(capabilities.macro).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when API is accessible', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const health = await adapter.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Treasury API is accessible');
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('should return unhealthy when API returns error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.message).toContain('503');
    });

    it('should return unhealthy when network error occurs', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const health = await adapter.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.message).toBe('Network error');
    });
  });

  describe('getYieldCurve', () => {
    it('should fetch and parse yield curve for current date', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      const curve = await adapter.getYieldCurve();

      expect(curve.date).toBeInstanceOf(Date);
      expect(curve.source).toBe('treasury.gov');
      expect(curve.rates).toHaveLength(10); // All 10 maturities
      
      // Check specific rates
      const oneMonth = curve.rates.find(r => r.maturity === '1_MONTH');
      expect(oneMonth).toBeDefined();
      expect(oneMonth!.yield).toBe(5.25);

      const tenYear = curve.rates.find(r => r.maturity === '10_YEAR');
      expect(tenYear).toBeDefined();
      expect(tenYear!.yield).toBe(4.25);
    });

    it('should fetch yield curve for specific date', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      const targetDate = new Date('2025-11-08');
      const curve = await adapter.getYieldCurve(targetDate);

      expect(curve.date.toISOString().split('T')[0]).toBe('2025-11-08');
    });

    it('should use cache for repeated requests', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      const date = new Date('2025-11-08');
      
      // First call - should fetch
      await adapter.getYieldCurve(date);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await adapter.getYieldCurve(date);
      expect(fetch).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle missing maturities gracefully', async () => {
      const partialData = {
        data: [
          {
            record_date: '2025-11-08',
            bc_1month: '5.25',
            bc_3month: null, // Missing
            bc_10year: '4.25',
            // Other maturities missing
          },
        ],
        meta: { count: 1 },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => partialData,
      } as Response);

      const curve = await adapter.getYieldCurve();

      // Should only include non-null rates
      expect(curve.rates).toHaveLength(2);
      expect(curve.rates.map(r => r.maturity)).toEqual(['1_MONTH', '10_YEAR']);
    });

    it('should throw error when API returns error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(adapter.getYieldCurve()).rejects.toThrow(
        'Treasury API error: 500 Internal Server Error'
      );
    });

    it('should throw error when no data available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], meta: { count: 0 } }),
      } as Response);

      await expect(adapter.getYieldCurve()).rejects.toThrow(
        'No yield curve data available'
      );
    });

    it('should include correct User-Agent header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      await adapter.getYieldCurve();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('fiscaldata.treasury.gov'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('OpenFinTerminal'),
          }),
        })
      );
    });
  });

  describe('getHistoricalYields', () => {
    it('should fetch historical yield curves', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => historicalYieldsFixture,
      } as Response);

      const from = new Date('2025-11-06');
      const to = new Date('2025-11-08');
      const curves = await adapter.getHistoricalYields(from, to);

      expect(curves).toHaveLength(3);
      expect(curves[0].date.toISOString().split('T')[0]).toBe('2025-11-08');
      expect(curves[2].date.toISOString().split('T')[0]).toBe('2025-11-06');
    });

    it('should parse all rates correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => historicalYieldsFixture,
      } as Response);

      const from = new Date('2025-11-06');
      const to = new Date('2025-11-08');
      const curves = await adapter.getHistoricalYields(from, to);

      // Each day should have 3 rates (1M, 3M, 10Y)
      curves.forEach(curve => {
        expect(curve.rates).toHaveLength(3);
        expect(curve.source).toBe('treasury.gov');
      });
    });

    it('should use cache for repeated requests', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => historicalYieldsFixture,
      } as Response);

      const from = new Date('2025-11-06');
      const to = new Date('2025-11-08');

      // First call
      await adapter.getHistoricalYields(from, to);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await adapter.getHistoricalYields(from, to);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should build correct URL with date range', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => historicalYieldsFixture,
      } as Response);

      const from = new Date('2025-11-01');
      const to = new Date('2025-11-30');
      await adapter.getHistoricalYields(from, to);

      const call = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(call).toContain('record_date:gte:2025-11-01');
      expect(call).toContain('record_date:lte:2025-11-30');
    });
  });

  describe('rate limiting', () => {
    it('should apply rate limiting to requests', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      const start = Date.now();
      
      // Make 11 requests (more than the 10/sec limit)
      const promises = Array.from({ length: 11 }, () => 
        adapter.getYieldCurve(new Date(`2025-11-${String(8 + Math.random()).substring(0, 2)}`))
      );

      await Promise.all(promises);
      const duration = Date.now() - start;

      // Should take at least 50ms due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('date formatting', () => {
    it('should format dates correctly', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => yieldCurveFixture,
      } as Response);

      const date = new Date('2025-01-05');
      await adapter.getYieldCurve(date);

      const call = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(call).toContain('2025-01-05');
    });
  });
});
