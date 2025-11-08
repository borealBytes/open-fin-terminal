/**
 * Ticker to CIK (Central Index Key) lookup for SEC EDGAR.
 */

import type { CIK, TickerCIKMapping } from './types';
import { MemoryCache } from './cache';

const SEC_TICKER_JSON_URL = 'https://www.sec.gov/files/company_tickers.json';
const USER_AGENT = 'Open Financial Terminal (https://github.com/borealBytes/open-fin-terminal)';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Manages ticker to CIK lookups with caching.
 */
export class CIKLookup {
  private cache = new MemoryCache();
  private mappingCache: Map<string, TickerCIKMapping> | null = null;

  /**
   * Look up CIK by ticker symbol.
   * 
   * @param ticker - Stock ticker (e.g., "AAPL")
   * @returns CIK with leading zeros, or null if not found
   */
  async getCIK(ticker: string): Promise<CIK | null> {
    const normalizedTicker = ticker.toUpperCase().trim();

    // Check cache first
    const cached = this.cache.get<CIK>(`cik:${normalizedTicker}`);
    if (cached) {
      return cached;
    }

    // Load ticker mappings if not already loaded
    if (!this.mappingCache) {
      await this.loadTickerMappings();
    }

    const mapping = this.mappingCache?.get(normalizedTicker);
    if (!mapping) {
      return null;
    }

    // Cache the result
    this.cache.set(`cik:${normalizedTicker}`, mapping.cik, CACHE_TTL_MS);
    return mapping.cik;
  }

  /**
   * Format CIK with leading zeros (10 digits).
   * 
   * @param cik - CIK number (with or without leading zeros)
   * @returns Formatted CIK string
   */
  formatCIK(cik: string | number): CIK {
    const cikStr = typeof cik === 'number' ? cik.toString() : cik;
    return cikStr.padStart(10, '0');
  }

  /**
   * Load ticker to CIK mappings from SEC.
   */
  private async loadTickerMappings(): Promise<void> {
    try {
      const response = await fetch(SEC_TICKER_JSON_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SEC ticker lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as Record<string, {
        cik_str: number;
        ticker: string;
        title: string;
      }>;

      this.mappingCache = new Map();

      // Convert to map for O(1) lookups
      for (const entry of Object.values(data)) {
        const cik = this.formatCIK(entry.cik_str);
        const ticker = entry.ticker.toUpperCase();
        
        this.mappingCache.set(ticker, {
          ticker,
          cik,
          title: entry.title,
        });
      }
    } catch (error) {
      console.error('Failed to load SEC ticker mappings:', error);
      throw error;
    }
  }

  /**
   * Clear all cached CIK lookups.
   */
  clearCache(): void {
    this.cache.clear();
    this.mappingCache = null;
  }
}
