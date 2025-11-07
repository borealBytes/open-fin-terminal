/**
 * Core types for OpenBB Platform integration
 */

import { z } from 'zod';

/**
 * OpenBB Client configuration options
 */
export interface OpenBBClientConfig {
  /** Base URL of the OpenBB Platform API (default: http://127.0.0.1:6900) */
  baseUrl?: string;
  /** Optional API key for authenticated endpoints */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for failed requests (default: 3) */
  retries?: number;
  /** Delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Enable response caching (default: true) */
  cache?: boolean;
  /** Cache TTL in milliseconds (default: 300000 = 5 minutes) */
  cacheTtl?: number;
}

/**
 * Standard OpenBB API response wrapper
 */
export interface OpenBBResponse<T> {
  /** Response data */
  results: T;
  /** Provider used for this request */
  provider: string;
  /** Additional warnings from the API */
  warnings?: string[];
  /** Chart data if applicable */
  chart?: Record<string, unknown>;
  /** Extra metadata */
  extra?: Record<string, unknown>;
}

/**
 * OpenBB provider information
 */
export interface ProviderInfo {
  name: string;
  description: string;
  credentials?: string[];
  instructions?: string;
  website?: string;
}

/**
 * Historical price data point
 */
export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adj_close?: number;
}

/**
 * Real-time quote
 */
export interface Quote {
  symbol: string;
  last_price: number;
  change: number;
  change_percent: number;
  volume: number;
  bid?: number;
  ask?: number;
  bid_size?: number;
  ask_size?: number;
  timestamp: string;
}

/**
 * Company profile/description
 */
export interface CompanyProfile {
  symbol: string;
  name: string;
  cik?: string;
  exchange?: string;
  currency?: string;
  country?: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  employees?: number;
  market_cap?: number;
}

/**
 * Financial statement (income, balance sheet, cash flow)
 */
export interface FinancialStatement {
  symbol: string;
  cik?: string;
  period: 'annual' | 'quarter' | 'ttm';
  fiscal_year: number;
  fiscal_period?: string;
  calendar_date: string;
  report_date: string;
  [key: string]: string | number | null | undefined;
}

/**
 * Options chain data
 */
export interface OptionsChain {
  contract_symbol: string;
  symbol: string;
  expiration: string;
  strike: number;
  option_type: 'call' | 'put';
  last_price?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  open_interest?: number;
  implied_volatility?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
}

/**
 * Economic indicator data
 */
export interface EconomicData {
  date: string;
  value: number;
  symbol?: string;
  name?: string;
  country?: string;
}

/**
 * News article
 */
export interface NewsArticle {
  date: string;
  title: string;
  text?: string;
  url?: string;
  symbols?: string[];
  source?: string;
  author?: string;
}
