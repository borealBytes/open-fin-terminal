/**
 * Live API validation tests for Treasury adapter
 * 
 * These tests make REAL API calls to validate the adapter works with the live Treasury API.
 * They run in CI but are skipped in local development to avoid rate limits.
 * 
 * Run manually with: pnpm test:live
 */

import { describe, it, expect } from 'vitest';
import { TreasuryAdapter } from './adapter';

// Only run if ENABLE_LIVE_TESTS=true in CI
const runLiveTests = process.env.ENABLE_LIVE_TESTS === 'true';
const describeIf = runLiveTests ? describe : describe.skip;

describeIf('TreasuryAdapter - Live API', () => {
  let adapter: TreasuryAdapter;

  beforeEach(() => {
    adapter = new TreasuryAdapter();
  });

  describe('healthCheck', () => {
    it('should successfully connect to Treasury API', async () => {
      const health = await adapter.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.message).toBe('Treasury API is accessible');
      expect(health.timestamp).toBeInstanceOf(Date);
    }, 10000); // 10s timeout for network call
  });

  describe('getYieldCurve', () => {
    it('should fetch real yield curve data', async () => {
      const curve = await adapter.getYieldCurve();

      // Validate structure
      expect(curve.date).toBeInstanceOf(Date);
      expect(curve.source).toBe('treasury.gov');
      expect(curve.rates).toBeInstanceOf(Array);
      expect(curve.rates.length).toBeGreaterThan(0);

      // Validate rates
      curve.rates.forEach(rate => {
        expect(rate.maturity).toBeDefined();
        expect(typeof rate.yield).toBe('number');
        expect(rate.yield).toBeGreaterThan(0);
        expect(rate.yield).toBeLessThan(20); // Sanity check (< 20%)
        expect(rate.date).toBeInstanceOf(Date);
      });

      // Should have multiple maturities
      expect(curve.rates.length).toBeGreaterThanOrEqual(3);
      
      console.log('✅ Fetched yield curve with', curve.rates.length, 'maturities');
      console.log('   10-Year yield:', curve.rates.find(r => r.maturity === '10_YEAR')?.yield || 'N/A');
    }, 10000);

    it('should fetch yield curve for recent historical date', async () => {
      // Get data from 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const curve = await adapter.getYieldCurve(sevenDaysAgo);

      expect(curve.date).toBeInstanceOf(Date);
      expect(curve.rates).toBeInstanceOf(Array);
      expect(curve.rates.length).toBeGreaterThan(0);

      console.log('✅ Fetched historical yield curve for', sevenDaysAgo.toISOString().split('T')[0]);
    }, 10000);
  });

  describe('getHistoricalYields', () => {
    it('should fetch historical yield curves for date range', async () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 5); // Last 5 days

      const curves = await adapter.getHistoricalYields(from, to);

      expect(curves).toBeInstanceOf(Array);
      expect(curves.length).toBeGreaterThan(0);
      expect(curves.length).toBeLessThanOrEqual(7); // At most 7 days (excluding weekends)

      // Validate each curve
      curves.forEach(curve => {
        expect(curve.date).toBeInstanceOf(Date);
        expect(curve.source).toBe('treasury.gov');
        expect(curve.rates).toBeInstanceOf(Array);
        expect(curve.rates.length).toBeGreaterThan(0);
      });

      // Curves should be in descending date order (newest first)
      for (let i = 1; i < curves.length; i++) {
        expect(curves[i - 1].date.getTime()).toBeGreaterThanOrEqual(
          curves[i].date.getTime()
        );
      }

      console.log('✅ Fetched', curves.length, 'historical yield curves');
    }, 15000);
  });

  describe('caching', () => {
    it('should cache and reuse yield curve data', async () => {
      const start1 = Date.now();
      await adapter.getYieldCurve();
      const duration1 = Date.now() - start1;

      // Second call should be much faster (cached)
      const start2 = Date.now();
      await adapter.getYieldCurve();
      const duration2 = Date.now() - start2;

      expect(duration2).toBeLessThan(duration1 / 2); // At least 2x faster
      console.log('✅ Cache working: first call', duration1 + 'ms, cached call', duration2 + 'ms');
    }, 15000);
  });

  describe('error handling', () => {
    it('should handle invalid date gracefully', async () => {
      // Try to get data from year 3000 (should fail)
      const futureDate = new Date('3000-01-01');

      await expect(adapter.getYieldCurve(futureDate)).rejects.toThrow();
    }, 10000);
  });
});
