/**
 * U.S. Treasury Data Adapter
 * 
 * Provides yield curve data from the U.S. Department of Treasury.
 * Data source: https://fiscaldata.treasury.gov/
 * 
 * Features:
 * - Daily Treasury yield curve rates (1M, 3M, 6M, 1Y, 2Y, 5Y, 10Y, 30Y)
 * - Historical yield data
 * - Rate limiting (10 req/sec)
 * - 24-hour caching
 * - Full ToS compliance
 */

export { TreasuryAdapter } from './adapter';
export { TreasuryYieldCurve, TreasuryRate, TreasuryMaturity } from './types';
