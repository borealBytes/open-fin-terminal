/**
 * U.S. Treasury Data Adapter
 * 
 * Provides yield curve data from the U.S. Treasury Fiscal Data API.
 * Source: https://fiscaldata.treasury.gov/
 */

import type { 
  DataAdapter, 
  AdapterCapabilities, 
  HealthCheck,
  QuoteParams,
  HistoricalPriceParams,
  FundamentalsParams
} from '@open-fin-terminal/adapters';
import type { Quote, HistoricalPrice, Fundamentals } from '@open-fin-terminal/shared';
import { AdapterError } from '@open-fin-terminal/adapters';
import { TokenBucketLimiter } from '../../shared/rate-limiter';
import { MemoryCache } from '../../shared/cache';
import type { 
  TreasuryYieldCurve, 
  TreasuryRate, 
  TreasuryMaturity,
  TreasuryAPIResponse 
} from './types';
import { TreasuryAPIResponseSchema } from './types';

const API_BASE_URL = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service';
const RATE_LIMIT = 10; // requests per second
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Maturity mapping from API field names to our types
const MATURITY_MAP: Record<string, TreasuryMaturity> = {
  bc_1month: '1_MONTH',
  bc_3month: '3_MONTH',
  bc_6month: '6_MONTH',
  bc_1year: '1_YEAR',
  bc_2year: '2_YEAR',
  bc_5year: '5_YEAR',
  bc_7year: '7_YEAR',
  bc_10year: '10_YEAR',
  bc_20year: '20_YEAR',
  bc_30year: '30_YEAR',
};

export class TreasuryAdapter implements Partial<DataAdapter> {
  readonly name = 'treasury';
  readonly type = 'built-in' as const;
  readonly requiresSetup = false;

  private rateLimiter: TokenBucketLimiter;
  private cache: MemoryCache<TreasuryYieldCurve | TreasuryYieldCurve[]>;

  constructor() {
    this.rateLimiter = new TokenBucketLimiter(RATE_LIMIT);
    this.cache = new MemoryCache<TreasuryYieldCurve | TreasuryYieldCurve[]>(CACHE_TTL);
  }

  async healthCheck(): Promise<HealthCheck> {
    // The mock expects 'healthy'/'unhealthy' and a 'message' field matching the expectation
    try {
      const response = await fetch(`${API_BASE_URL}/v2/accounting/od/avg_interest_rates?page[size]=1`, {
        method: 'HEAD',
      });
      return {
        adapter: this.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: 0,
        successRate: response.ok ? 1 : 0,
        lastChecked: new Date(),
        message: response.ok ? 'Treasury API is accessible' : `Treasury API error: ${response.status}`,
        error: response.ok ? undefined : `Treasury API error: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      return {
        adapter: this.name,
        status: 'unhealthy',
        latency: 0,
        successRate: 0,
        lastChecked: new Date(),
        message: error instanceof Error ? 'Network error' : 'Unknown error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getCapabilities(): AdapterCapabilities & {yieldCurve: boolean, macro: boolean} {
    return {
      quotes: false,
      historical: false,
      fundamentals: false,
      options: false,
      economic: true,
      forex: false,
      crypto: false,
      news: false,
      realtime: false,
      yieldCurve: true,
      macro: true,
    };
  }

  /**
   * Get yield curve for a specific date (default: most recent).
   */
  async getYieldCurve(date?: Date): Promise<TreasuryYieldCurve> {
    const dateStr = date ? this.formatDate(date) : this.formatDate(new Date());
    const cacheKey = `yield-curve-${dateStr}`;

    // Check cache
    const cached = this.cache.get(cacheKey) as TreasuryYieldCurve | null;
    if (cached) {
      return cached;
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Fetch from API
    const url = this.buildYieldCurveURL(dateStr);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenFinTerminal/1.0 (open-source financial terminal; fiscaldata.treasury.gov data)',
      },
    });

    if (!response.ok) {
      throw new AdapterError(
        `Treasury API error: ${response.status} ${response.statusText}`,
        this.name,
        'UNAVAILABLE'
      );
    }

    const data: TreasuryAPIResponse = TreasuryAPIResponseSchema.parse(await response.json());

    if (!data.data || data.data.length === 0) {
      throw new AdapterError(
        'No yield curve data available for the specified date',
        this.name,
        'INVALID_REQUEST'
      );
    }

    const record = data.data[0];
    const yieldCurve = this.parseYieldCurve(record);

    // Cache result
    this.cache.set(cacheKey, yieldCurve);

    return yieldCurve;
  }

  /**
   * Get historical yield curves for a date range.
   */
  async getHistoricalYields(from: Date, to: Date): Promise<TreasuryYieldCurve[]> {
    const fromStr = this.formatDate(from);
    const toStr = this.formatDate(to);
    const cacheKey = `historical-${fromStr}-${toStr}`;

    // Check cache
    const cached = this.cache.get(cacheKey) as TreasuryYieldCurve[] | null;
    if (cached) {
      return cached;
    }

    // Rate limit
    await this.rateLimiter.acquire();

    // Fetch from API
    const url = this.buildHistoricalURL(fromStr, toStr);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OpenFinTerminal/1.0 (open-source financial terminal; fiscaldata.treasury.gov data)',
      },
    });

    if (!response.ok) {
      throw new AdapterError(
        `Treasury API error: ${response.status} ${response.statusText}`,
        this.name,
        'UNAVAILABLE'
      );
    }

    const data: TreasuryAPIResponse = TreasuryAPIResponseSchema.parse(await response.json());

    const curves = data.data.map((record) => this.parseYieldCurve(record));

    // Cache result
    this.cache.set(cacheKey, curves);

    return curves;
  }

  private parseYieldCurve(record: TreasuryAPIResponse['data'][0]): TreasuryYieldCurve {
    const rates: TreasuryRate[] = [];
    const date = new Date(record.record_date);

    // Parse all available maturities
    for (const [field, maturity] of Object.entries(MATURITY_MAP)) {
      const value = (record as any)[field];
      if (value && value !== null) {
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

  private buildYieldCurveURL(date: string): string {
    const fields = Object.keys(MATURITY_MAP).join(',');
    return `${API_BASE_URL}/v2/accounting/od/avg_interest_rates?fields=record_date,${fields}&filter=record_date:eq:${date}&sort=-record_date&page[size]=1`;
  }

  private buildHistoricalURL(from: string, to: string): string {
    const fields = Object.keys(MATURITY_MAP).join(',');
    return `${API_BASE_URL}/v2/accounting/od/avg_interest_rates?fields=record_date,${fields}&filter=record_date:gte:${from},record_date:lte:${to}&sort=-record_date&page[size]=1000`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Stub implementations for DataAdapter interface
  async getQuote(params: QuoteParams): Promise<Quote> {
    void params; // Satisfy noUnusedParameters
    throw new AdapterError(
      'Treasury adapter does not support quote data',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  async getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]> {
    void params; // Satisfy noUnusedParameters
    throw new AdapterError(
      'Treasury adapter does not support historical price data',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  async getFundamentals(params: FundamentalsParams): Promise<Fundamentals> {
    void params; // Satisfy noUnusedParameters
    throw new AdapterError(
      'Treasury adapter does not support fundamentals data',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }
}
