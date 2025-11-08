/**
 * Yahoo Finance data adapter.
 * 
 * Provides quotes and historical price data (delayed 15-20 minutes for free tier).
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
import type { YahooQuoteResponse, YahooChartResponse } from './types';
import { YahooQuoteResponseSchema, YahooChartResponseSchema } from './types';

const YAHOO_API_BASE = 'https://query1.finance.yahoo.com';
const USER_AGENT = 'Open Financial Terminal (https://github.com/borealBytes/open-fin-terminal)';
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * Yahoo Finance adapter for quotes and historical prices.
 * 
 * Note: Data is delayed 15-20 minutes on free tier.
 */
export class YahooFinanceAdapter implements DataAdapter {
  readonly name = 'yahoo-finance';
  readonly type = 'built-in' as const;
  readonly requiresSetup = false;

  private lastHealthCheck: HealthCheck | null = null;

  /**
   * Health check for Yahoo Finance API.
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      // Test with a well-known symbol
      const response = await fetch(
        `${YAHOO_API_BASE}/v7/finance/quote?symbols=AAPL`,
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
      quotes: true,
      historical: true,
      fundamentals: false,
      options: false,
      economic: false,
      forex: false,
      crypto: false,
      news: false,
      realtime: false, // Data is delayed 15-20 minutes
    };
  }

  /**
   * Get quote data for a symbol.
   */
  async getQuote(params: QuoteParams): Promise<Quote> {
    const { symbol } = params;

    try {
      const response = await fetch(
        `${YAHOO_API_BASE}/v7/finance/quote?symbols=${symbol}`,
        {
          headers: { 'User-Agent': USER_AGENT },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as YahooQuoteResponse;
      
      // Validate response structure
      YahooQuoteResponseSchema.parse(data);

      if (data.quoteResponse.error) {
        throw new AdapterError(
          `Yahoo Finance error: ${data.quoteResponse.error.description}`,
          this.name,
          'INVALID_REQUEST'
        );
      }

      const quote = data.quoteResponse.result[0];
      if (!quote) {
        throw new AdapterError(
          `No quote data found for symbol ${symbol}`,
          this.name,
          'INVALID_REQUEST'
        );
      }

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(
        `Failed to fetch quote for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'UNKNOWN',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get historical price data.
   */
  async getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]> {
    const { symbol, from, to, interval = '1d' } = params;

    try {
      // Convert dates to Unix timestamps
      const period1 = Math.floor(new Date(from).getTime() / 1000);
      const period2 = Math.floor(new Date(to).getTime() / 1000);

      const response = await fetch(
        `${YAHOO_API_BASE}/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`,
        {
          headers: { 'User-Agent': USER_AGENT },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as YahooChartResponse;
      
      // Validate response structure
      YahooChartResponseSchema.parse(data);

      if (data.chart.error) {
        throw new AdapterError(
          `Yahoo Finance error: ${data.chart.error.description}`,
          this.name,
          'INVALID_REQUEST'
        );
      }

      const result = data.chart.result[0];
      if (!result) {
        return [];
      }

      const { timestamp, indicators } = result;
      const quotes = indicators.quote[0];

      if (!quotes) {
        return [];
      }

      // Transform to HistoricalPrice format
      const prices: HistoricalPrice[] = [];
      for (let i = 0; i < timestamp.length; i++) {
        // Skip null entries
        if (
          quotes.open[i] === null ||
          quotes.high[i] === null ||
          quotes.low[i] === null ||
          quotes.close[i] === null ||
          quotes.volume[i] === null
        ) {
          continue;
        }

        prices.push({
          symbol,
          timestamp: new Date(timestamp[i] * 1000),
          open: quotes.open[i]!,
          high: quotes.high[i]!,
          low: quotes.low[i]!,
          close: quotes.close[i]!,
          volume: quotes.volume[i]!,
        });
      }

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
   * Not supported - Yahoo Finance adapter doesn't provide fundamentals.
   */
  async getFundamentals(_params: FundamentalsParams): Promise<Fundamentals> {
    throw new AdapterError(
      'Yahoo Finance adapter does not support fundamentals (use SEC EDGAR adapter)',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }
}
