/**
 * Stooq CSV data adapter.
 * 
 * Provides historical price data from Stooq CSV files.
 * Used as fallback when Yahoo Finance is unavailable.
 */

import type {
  DataAdapter,
  AdapterCapabilities,
  HealthCheck,
  QuoteParams,
  HistoricalPriceParams,
  FundamentalsParams,
} from '@open-fin-terminal/adapters';
import { AdapterError } from '@open-fin-terminal/adapters';
import type { Quote, HistoricalPrice, Fundamentals } from '@open-fin-terminal/shared';
import type { StooqCSVRow } from './types';

const STOOQ_CSV_BASE = 'https://stooq.com/q/d/l';
const USER_AGENT = 'Open Financial Terminal (https://github.com/borealBytes/open-fin-terminal)';
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * Stooq adapter for CSV historical data.
 * 
 * Provides fallback when Yahoo Finance is unavailable.
 */
export class StooqAdapter implements DataAdapter {
  readonly name = 'stooq';
  readonly type = 'built-in' as const;
  readonly requiresSetup = false;

  private lastHealthCheck: HealthCheck | null = null;

  /**
   * Health check for Stooq CSV endpoint.
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      // Test with a well-known symbol
      const response = await fetch(
        `${STOOQ_CSV_BASE}/?s=aapl.us&i=d`,
        {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      const latency = Date.now() - startTime;

      this.lastHealthCheck = {
        adapter: this.name,
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        successRate: response.ok ? 1 : 0,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };

      return this.lastHealthCheck;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.lastHealthCheck = {
        adapter: this.name,
        status: 'unavailable',
        latency,
        successRate: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return this.lastHealthCheck;
    }
  }

  /**
   * Get adapter capabilities.
   */
  getCapabilities(): AdapterCapabilities {
    return {
      quotes: false,
      historical: true,
      fundamentals: false,
      options: false,
      economic: false,
      forex: false,
      crypto: false,
      news: false,
      realtime: false,
    };
  }

  /**
   * Not supported - Stooq only provides historical data.
   */
  async getQuote(_params: QuoteParams): Promise<Quote> {
    throw new AdapterError(
      'Stooq adapter does not support real-time quotes',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  /**
   * Get historical price data from Stooq CSV.
   */
  async getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]> {
    const { symbol, from, to } = params;

    try {
      // Stooq uses .us suffix for US stocks
      const stooqSymbol = symbol.toLowerCase() + '.us';

      // Format dates as YYYYMMDD
      const fromDate = new Date(from).toISOString().split('T')[0].replace(/-/g, '');
      const toDate = new Date(to).toISOString().split('T')[0].replace(/-/g, '');

      const response = await fetch(
        `${STOOQ_CSV_BASE}/?s=${stooqSymbol}&d1=${fromDate}&d2=${toDate}&i=d`,
        {
          headers: { 'User-Agent': USER_AGENT },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      
      // Parse CSV
      const prices = this.parseCSV(csvText, symbol);

      return prices;
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(
        `Failed to fetch historical prices for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'UNKNOWN',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Not supported - Stooq doesn't provide fundamentals.
   */
  async getFundamentals(_params: FundamentalsParams): Promise<Fundamentals> {
    throw new AdapterError(
      'Stooq adapter does not support fundamentals',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  /**
   * Parse Stooq CSV format.
   */
  private parseCSV(csvText: string, symbol: string): HistoricalPrice[] {
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
      return [];
    }

    // Skip header row
    const dataLines = lines.slice(1);
    const prices: HistoricalPrice[] = [];

    for (const line of dataLines) {
      const parts = line.split(',');
      
      if (parts.length < 6) {
        continue; // Skip invalid rows
      }

      const [date, open, high, low, close, volume] = parts;

      // Skip rows with invalid data
      if (!date || !open || !high || !low || !close || !volume) {
        continue;
      }

      prices.push({
        symbol,
        timestamp: new Date(date),
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseInt(volume, 10),
      });
    }

    return prices;
  }
}
