import type { DataAdapter, HealthCheck, AdapterCapabilities } from '@open-fin-terminal/adapters';
import { TreasuryYieldCurve, TreasuryRate, TreasuryMaturity, TreasuryAPIResponseSchema } from './types';
import { TokenBucketLimiter } from '../shared/rate-limiter';
import { MemoryCache } from '../shared/cache';

/**
 * U.S. Treasury Data Adapter
 * 
 * Fetches yield curve data from the U.S. Department of Treasury.
 * 
 * Rate limits: Conservative 10 req/sec (no published limit)
 * Caching: 24 hours (yield curves don't change intraday)
 * ToS: Public data, attribution required
 */
export class TreasuryAdapter implements DataAdapter {
  readonly name = 'treasury';
  readonly type = 'built-in' as const;
  readonly requiresSetup = false;

  private readonly baseUrl = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
  private readonly rateLimiter: TokenBucketLimiter;
  private readonly cache: MemoryCache<TreasuryYieldCurve>;

  constructor() {
    // Conservative rate limit: 10 requests per second
    this.rateLimiter = new TokenBucketLimiter(10, 1000);
    
    // Cache for 24 hours (yield curves don't change intraday)
    this.cache = new MemoryCache<TreasuryYieldCurve>(24 * 60 * 60 * 1000);
  }

  async healthCheck(): Promise<HealthCheck> {
    try {
      // Ping the API with a minimal request
      const response = await fetch(
        `${this.baseUrl}/v2/accounting/od/avg_interest_rates?page[size]=1`,
        {
          headers: {
            'User-Agent': 'OpenFinTerminal/0.1.0 (https://github.com/borealBytes/open-fin-terminal)',
          },
        }
      );

      if (!response.ok) {
        return {
          status: 'unhealthy',
          message: `Treasury API returned ${response.status}`,
          timestamp: new Date(),
        };
      }

      return {
        status: 'healthy',
        message: 'Treasury API is accessible',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  getCapabilities(): AdapterCapabilities {
    return {
      quotes: false,
      historical: false,
      fundamentals: false,
      realtime: false,
      yieldCurve: true,
      macro: true,
    };
  }

  /**
   * Get the latest Treasury yield curve
   */
  async getYieldCurve(date?: Date): Promise<TreasuryYieldCurve> {
    const targetDate = date || new Date();
    const dateStr = this.formatDate(targetDate);
    const cacheKey = `yield-curve-${dateStr}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Fetch from API
    const url = this.buildYieldCurveUrl(targetDate);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenFinTerminal/0.1.0 (https://github.com/borealBytes/open-fin-terminal)',
        },
      });

      if (!response.ok) {
        throw new Error(`Treasury API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validated = TreasuryAPIResponseSchema.parse(data);

      if (validated.data.length === 0) {
        throw new Error(`No yield curve data available for ${dateStr}`);
      }

      // Parse the yield curve
      const yieldCurve = this.parseYieldCurve(validated.data[0]);
      
      // Cache the result
      this.cache.set(cacheKey, yieldCurve);

      return yieldCurve;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Treasury yield curve: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get historical yield curves for a date range
   */
  async getHistoricalYields(from: Date, to: Date): Promise<TreasuryYieldCurve[]> {
    const cacheKey = `historical-${this.formatDate(from)}-${this.formatDate(to)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return Array.isArray(cached) ? cached : [cached];
    }

    // Rate limit
    await this.rateLimiter.acquire();

    const url = this.buildHistoricalUrl(from, to);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenFinTerminal/0.1.0 (https://github.com/borealBytes/open-fin-terminal)',
        },
      });

      if (!response.ok) {
        throw new Error(`Treasury API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validated = TreasuryAPIResponseSchema.parse(data);

      const curves = validated.data.map(record => this.parseYieldCurve(record));
      
      // Cache the results (cast to any to satisfy cache type)
      this.cache.set(cacheKey, curves as any);

      return curves;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch historical yields: ${error.message}`);
      }
      throw error;
    }
  }

  private buildYieldCurveUrl(date: Date): string {
    const dateStr = this.formatDate(date);
    return `${this.baseUrl}/v2/accounting/od/avg_interest_rates` +
      `?filter=record_date:eq:${dateStr}` +
      `&page[size]=1` +
      `&sort=-record_date`;
  }

  private buildHistoricalUrl(from: Date, to: Date): string {
    const fromStr = this.formatDate(from);
    const toStr = this.formatDate(to);
    return `${this.baseUrl}/v2/accounting/od/avg_interest_rates` +
      `?filter=record_date:gte:${fromStr},record_date:lte:${toStr}` +
      `&page[size]=1000` +
      `&sort=-record_date`;
  }

  private parseYieldCurve(record: any): TreasuryYieldCurve {
    const date = new Date(record.record_date);
    const rates: TreasuryRate[] = [];

    const maturities: { field: string; maturity: TreasuryMaturity }[] = [
      { field: 'bc_1month', maturity: '1_MONTH' },
      { field: 'bc_3month', maturity: '3_MONTH' },
      { field: 'bc_6month', maturity: '6_MONTH' },
      { field: 'bc_1year', maturity: '1_YEAR' },
      { field: 'bc_2year', maturity: '2_YEAR' },
      { field: 'bc_5year', maturity: '5_YEAR' },
      { field: 'bc_7year', maturity: '7_YEAR' },
      { field: 'bc_10year', maturity: '10_YEAR' },
      { field: 'bc_20year', maturity: '20_YEAR' },
      { field: 'bc_30year', maturity: '30_YEAR' },
    ];

    for (const { field, maturity } of maturities) {
      const value = record[field];
      if (value !== null && value !== undefined && value !== '') {
        rates.push({
          maturity,
          yield: parseFloat(value),
          date,
        });
      }
    }

    return {
      date,
      rates,
      source: 'treasury.gov',
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
