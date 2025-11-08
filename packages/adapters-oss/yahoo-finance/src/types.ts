/**
 * Types for Yahoo Finance data adapter.
 */

import { z } from 'zod';

/**
 * Yahoo Finance quote response
 */
export interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string;
      regularMarketPrice: number;
      regularMarketChange: number;
      regularMarketChangePercent: number;
      regularMarketPreviousClose: number;
      regularMarketOpen: number;
      regularMarketDayHigh: number;
      regularMarketDayLow: number;
      regularMarketVolume: number;
      fiftyTwoWeekHigh?: number;
      fiftyTwoWeekLow?: number;
      marketCap?: number;
      currency?: string;
    }>;
    error: null | { code: string; description: string };
  };
}

/**
 * Yahoo Finance chart (historical) response
 */
export interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        currency: string;
        regularMarketPrice: number;
        dataGranularity: string;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

/**
 * Zod schema for quote response validation
 */
export const YahooQuoteResponseSchema = z.object({
  quoteResponse: z.object({
    result: z.array(z.any()),
    error: z.nullable(z.any()),
  }),
});

/**
 * Zod schema for chart response validation
 */
export const YahooChartResponseSchema = z.object({
  chart: z.object({
    result: z.array(z.any()),
    error: z.nullable(z.any()),
  }),
});
