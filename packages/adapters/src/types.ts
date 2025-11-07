/**
 * Core types for data adapters in Open Financial Terminal.
 *
 * This module defines the standard interface that all data adapters must
 * implement, enabling a plugin-style architecture with fallback support.
 *
 * @packageDocumentation
 */

import type { Quote, HistoricalPrice, Fundamentals, OHLCV } from '@open-fin-terminal/shared';

/**
 * Adapter type classification.
 *
 * - `built-in`: Free, no-account-required adapters (always available)
 * - `optional`: Requires setup (API keys, local servers, etc.)
 */
export type AdapterType = 'built-in' | 'optional';

/**
 * Health status of an adapter.
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unavailable';

/**
 * Capabilities that an adapter may support.
 */
export interface AdapterCapabilities {
  /** Supports real-time quotes */
  quotes: boolean;
  /** Supports historical price data */
  historical: boolean;
  /** Supports fundamental data (financials, company info) */
  fundamentals: boolean;
  /** Supports options data */
  options: boolean;
  /** Supports economic indicators */
  economic: boolean;
  /** Supports foreign exchange rates */
  forex: boolean;
  /** Supports cryptocurrency data */
  crypto: boolean;
  /** Supports news and filings */
  news: boolean;
  /** Real-time data (vs delayed) */
  realtime: boolean;
}

/**
 * Health check result.
 */
export interface HealthCheck {
  /** Adapter name */
  adapter: string;
  /** Current health status */
  status: HealthStatus;
  /** Average response time in milliseconds */
  latency: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Last check timestamp */
  lastChecked: Date;
  /** Optional error message if unhealthy */
  error?: string;
}

/**
 * Parameters for historical price requests.
 */
export interface HistoricalPriceParams {
  /** Stock symbol or ticker */
  symbol: string;
  /** Start date (ISO 8601) */
  from: string;
  /** End date (ISO 8601) */
  to: string;
  /** Time interval (e.g., '1d', '1h', '5m') */
  interval?: string;
}

/**
 * Parameters for quote requests.
 */
export interface QuoteParams {
  /** Stock symbol or ticker */
  symbol: string;
}

/**
 * Parameters for fundamentals requests.
 */
export interface FundamentalsParams {
  /** Stock symbol or ticker */
  symbol: string;
}

/**
 * Base interface that all data adapters must implement.
 *
 * Adapters provide access to financial data from various sources
 * (free APIs, premium providers, etc.). The registry manages multiple
 * adapters and implements fallback logic when primary sources fail.
 *
 * @example
 * ```typescript
 * class YahooFinanceAdapter implements DataAdapter {
 *   readonly name = 'yahoo-finance';
 *   readonly type = 'built-in';
 *   readonly requiresSetup = false;
 *
 *   async healthCheck(): Promise<HealthCheck> {
 *     // Check if Yahoo Finance API is responsive
 *   }
 *
 *   getCapabilities(): AdapterCapabilities {
 *     return {
 *       quotes: true,
 *       historical: true,
 *       fundamentals: true,
 *       options: false,
 *       // ...
 *     };
 *   }
 *
 *   async getQuote(params: QuoteParams): Promise<Quote> {
 *     // Fetch from Yahoo Finance
 *   }
 * }
 * ```
 */
export interface DataAdapter {
  /** Unique adapter name (e.g., 'yahoo-finance', 'sec-edgar') */
  readonly name: string;

  /** Adapter type: built-in (free) or optional (requires setup) */
  readonly type: AdapterType;

  /** Whether this adapter requires setup (API keys, local server, etc.) */
  readonly requiresSetup: boolean;

  /**
   * Check if adapter is healthy and responsive.
   *
   * This method is called periodically to monitor adapter health
   * and inform fallback decisions.
   *
   * @returns Health check result
   */
  healthCheck(): Promise<HealthCheck>;

  /**
   * Get adapter capabilities.
   *
   * Indicates which data types this adapter can provide.
   *
   * @returns Capability flags
   */
  getCapabilities(): AdapterCapabilities;

  /**
   * Get real-time or delayed quote for a symbol.
   *
   * @param params - Quote parameters
   * @returns Quote data
   * @throws {AdapterError} If adapter doesn't support quotes or request fails
   */
  getQuote(params: QuoteParams): Promise<Quote>;

  /**
   * Get historical price data for a symbol.
   *
   * @param params - Historical price parameters
   * @returns Array of historical prices
   * @throws {AdapterError} If adapter doesn't support historical data or request fails
   */
  getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]>;

  /**
   * Get fundamental data for a symbol.
   *
   * @param params - Fundamentals parameters
   * @returns Fundamental data
   * @throws {AdapterError} If adapter doesn't support fundamentals or request fails
   */
  getFundamentals(params: FundamentalsParams): Promise<Fundamentals>;
}

/**
 * Error thrown by adapters.
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly adapter: string,
    public readonly code:
      | 'UNSUPPORTED_OPERATION'
      | 'RATE_LIMITED'
      | 'UNAVAILABLE'
      | 'INVALID_REQUEST'
      | 'UNKNOWN',
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}
