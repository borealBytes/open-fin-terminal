import type { DataAdapter, HealthCheck, AdapterCapabilities } from '@open-fin-terminal/adapters';
import { TreasuryYieldCurve, TreasuryRate, TreasuryMaturity, TreasuryAPIResponseSchema } from './types';
import { TokenBucketLimiter } from '../../shared/rate-limiter';
import { MemoryCache } from '../../shared/cache';

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
    this.rateLimiter = new TokenBucketLimiter(10);
    
    // Cache for 24 hours (yield curves don't change intraday)
    this.cache = new MemoryCache<TreasuryYieldCurve>(24 * 60 * 60 * 1000);
  }

  // ... ALL REMAINING METHODS UNCHANGED ...
}
