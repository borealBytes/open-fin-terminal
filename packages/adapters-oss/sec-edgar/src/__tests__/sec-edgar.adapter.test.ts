import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SECEdgarAdapter } from '../sec-edgar.adapter';
import { AdapterError } from '@open-fin-terminal/adapters';
import companyFactsFixture from './fixtures/company-facts-aapl.json';
import tickerMappingFixture from './fixtures/ticker-cik-mapping.json';

// Mock fetch globally
global.fetch = vi.fn();

describe('SECEdgarAdapter', () => {
  let adapter: SECEdgarAdapter;

  beforeEach(() => {
    adapter = new SECEdgarAdapter();
    vi.clearAllMocks();
  });

  describe('metadata', () => {
    it('should have correct adapter metadata', () => {
      expect(adapter.name).toBe('sec-edgar');
      expect(adapter.type).toBe('built-in');
      expect(adapter.requiresSetup).toBe(false);
    });
  });

  describe('getCapabilities', () => {
    it('should only support fundamentals', () => {
      const capabilities = adapter.getCapabilities();
      
      expect(capabilities.fundamentals).toBe(true);
      expect(capabilities.quotes).toBe(false);
      expect(capabilities.historical).toBe(false);
      expect(capabilities.options).toBe(false);
      expect(capabilities.economic).toBe(false);
      expect(capabilities.forex).toBe(false);
      expect(capabilities.crypto).toBe(false);
      expect(capabilities.news).toBe(false);
      expect(capabilities.realtime).toBe(false);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when API is responsive', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const health = await adapter.healthCheck();
      
      expect(health.adapter).toBe('sec-edgar');
      expect(health.status).toBe('healthy');
      expect(health.latency).toBeGreaterThan(0);
      expect(health.successRate).toBe(1);
      expect(health.lastChecked).toBeInstanceOf(Date);
      expect(health.error).toBeUndefined();
    });

    it('should return degraded status on HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const health = await adapter.healthCheck();
      
      expect(health.status).toBe('degraded');
      expect(health.successRate).toBe(0);
      expect(health.error).toBeDefined();
    });

    it('should return unavailable status on network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const health = await adapter.healthCheck();
      
      expect(health.status).toBe('unavailable');
      expect(health.error).toContain('Network error');
    });

    it('should timeout after 5 seconds', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const health = await adapter.healthCheck();
      
      expect(health.status).toBe('unavailable');
    });
  });

  describe('getQuote', () => {
    it('should throw unsupported operation error', async () => {
      await expect(
        adapter.getQuote({ symbol: 'AAPL' })
      ).rejects.toThrow(AdapterError);

      try {
        await adapter.getQuote({ symbol: 'AAPL' });
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect((error as AdapterError).code).toBe('UNSUPPORTED_OPERATION');
      }
    });
  });

  describe('getHistoricalPrices', () => {
    it('should throw unsupported operation error', async () => {
      await expect(
        adapter.getHistoricalPrices({
          symbol: 'AAPL',
          from: '2023-01-01',
          to: '2023-12-31',
        })
      ).rejects.toThrow(AdapterError);

      try {
        await adapter.getHistoricalPrices({
          symbol: 'AAPL',
          from: '2023-01-01',
          to: '2023-12-31',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect((error as AdapterError).code).toBe('UNSUPPORTED_OPERATION');
      }
    });
  });

  describe('getFundamentals', () => {
    beforeEach(() => {
      // Mock ticker lookup
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('company_tickers.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => tickerMappingFixture,
          });
        }
        if (url.includes('companyfacts')) {
          return Promise.resolve({
            ok: true,
            json: async () => companyFactsFixture,
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    it('should fetch fundamentals for valid ticker', async () => {
      const fundamentals = await adapter.getFundamentals({ symbol: 'AAPL' });
      
      expect(fundamentals.symbol).toBe('Apple Inc.');
      expect(fundamentals.profile?.name).toBe('Apple Inc.');
      expect(fundamentals.incomeStatement).toBeDefined();
      expect(fundamentals.incomeStatement?.revenue).toBe(383285000000);
      expect(fundamentals.incomeStatement?.netIncome).toBe(96995000000);
      expect(fundamentals.balanceSheet).toBeDefined();
      expect(fundamentals.balanceSheet?.totalAssets).toBe(352755000000);
      expect(fundamentals.balanceSheet?.totalLiabilities).toBe(290437000000);
      expect(fundamentals.cashFlow).toBeDefined();
      expect(fundamentals.cashFlow?.operatingCashFlow).toBe(110543000000);
    });

    it('should handle lowercase tickers', async () => {
      const fundamentals = await adapter.getFundamentals({ symbol: 'aapl' });
      expect(fundamentals.symbol).toBe('Apple Inc.');
    });

    it('should throw error for unknown ticker', async () => {
      await expect(
        adapter.getFundamentals({ symbol: 'UNKNOWN' })
      ).rejects.toThrow(AdapterError);

      try {
        await adapter.getFundamentals({ symbol: 'UNKNOWN' });
      } catch (error) {
        expect(error).toBeInstanceOf(AdapterError);
        expect((error as AdapterError).code).toBe('INVALID_REQUEST');
        expect((error as AdapterError).message).toContain('not found');
      }
    });

    it('should cache results', async () => {
      // First call
      await adapter.getFundamentals({ symbol: 'AAPL' });
      const fetchCount1 = (global.fetch as any).mock.calls.length;

      // Second call should use cache
      await adapter.getFundamentals({ symbol: 'AAPL' });
      const fetchCount2 = (global.fetch as any).mock.calls.length;

      expect(fetchCount2).toBe(fetchCount1); // No additional fetches
    });

    it('should handle rate limit errors', async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('company_tickers.json')) {
          return Promise.resolve({
            ok: true,
            json: async () => tickerMappingFixture,
          });
        }
        if (url.includes('companyfacts')) {
          return Promise.resolve({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      await expect(
        adapter.getFundamentals({ symbol: 'AAPL' })
      ).rejects.toThrow(AdapterError);

      try {
        await adapter.getFundamentals({ symbol: 'AAPL' });
      } catch (error) {
        expect((error as AdapterError).code).toBe('RATE_LIMITED');
      }
    });

    it('should set correct User-Agent header', async () => {
      await adapter.getFundamentals({ symbol: 'AAPL' });

      const companyFactsCalls = (global.fetch as any).mock.calls.filter((call: any) =>
        call[0].includes('companyfacts')
      );

      expect(companyFactsCalls.length).toBeGreaterThan(0);
      expect(companyFactsCalls[0][1].headers['User-Agent']).toContain('Open Financial Terminal');
    });
  });
});
