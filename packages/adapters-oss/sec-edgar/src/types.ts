/**
 * Types for SEC EDGAR data adapter.
 */

import { z } from 'zod';

/**
 * CIK (Central Index Key) - SEC's unique identifier for companies
 * Format: 10 digits with leading zeros (e.g., "0000320193" for Apple)
 */
export type CIK = string;

/**
 * Company Facts API response structure from SEC EDGAR
 * https://data.sec.gov/api/xbrl/companyfacts/CIK{CIK}.json
 */
export interface CompanyFactsResponse {
  cik: string;
  entityName: string;
  facts: {
    'us-gaap'?: Record<string, FactSet>;
    'dei'?: Record<string, FactSet>;
    [key: string]: Record<string, FactSet> | undefined;
  };
}

/**
 * Fact set for a specific XBRL tag
 */
export interface FactSet {
  label: string;
  description: string;
  units: Record<string, UnitFact[]>;
}

/**
 * Individual fact value with context
 */
export interface UnitFact {
  end: string; // YYYY-MM-DD
  val: number;
  accn?: string; // Accession number
  fy?: number; // Fiscal year
  fp?: string; // Fiscal period (e.g., "FY", "Q1", "Q2", "Q3", "Q4")
  form?: string; // Form type (e.g., "10-K", "10-Q")
  filed?: string; // Filing date
  frame?: string; // Reporting frame (e.g., "CY2023Q4")
}

/**
 * Ticker to CIK mapping entry
 */
export interface TickerCIKMapping {
  ticker: string;
  cik: CIK;
  title: string;
  exchange?: string;
}

/**
 * Parsed fundamental data from SEC EDGAR
 */
export interface SECFundamentals {
  /** Company CIK */
  cik: CIK;
  /** Company name */
  entityName: string;
  /** Most recent annual revenue */
  revenue?: number;
  /** Most recent annual net income */
  netIncome?: number;
  /** Most recent total assets */
  totalAssets?: number;
  /** Most recent total liabilities */
  totalLiabilities?: number;
  /** Most recent shareholders equity */
  shareholdersEquity?: number;
  /** Most recent operating cash flow */
  operatingCashFlow?: number;
  /** Fiscal year end date */
  fiscalYearEnd?: string;
  /** Last updated timestamp */
  lastUpdated: Date;
}

/**
 * Zod schema for CompanyFactsResponse validation
 */
export const CompanyFactsResponseSchema = z.object({
  cik: z.string(),
  entityName: z.string(),
  facts: z.record(z.record(z.any())),
});

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp in ms
}
