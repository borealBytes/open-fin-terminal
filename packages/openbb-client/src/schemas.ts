/**
 * Zod schemas for runtime validation of OpenBB Platform responses
 */

import { z } from 'zod';

/**
 * Base OpenBB response schema
 */
export const OpenBBResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    results: dataSchema,
    provider: z.string(),
    warnings: z.array(z.string()).optional(),
    chart: z.record(z.unknown()).optional(),
    extra: z.record(z.unknown()).optional(),
  });

/**
 * Historical price data schema
 */
export const HistoricalPriceSchema = z.object({
  date: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
  adj_close: z.number().optional(),
});

export const HistoricalPriceArraySchema = z.array(HistoricalPriceSchema);

/**
 * Quote schema
 */
export const QuoteSchema = z.object({
  symbol: z.string(),
  last_price: z.number(),
  change: z.number(),
  change_percent: z.number(),
  volume: z.number(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  bid_size: z.number().optional(),
  ask_size: z.number().optional(),
  timestamp: z.string(),
});

/**
 * Company profile schema
 */
export const CompanyProfileSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  cik: z.string().optional(),
  exchange: z.string().optional(),
  currency: z.string().optional(),
  country: z.string().optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  employees: z.number().optional(),
  market_cap: z.number().optional(),
});

/**
 * Financial statement schema (flexible for different statement types)
 */
export const FinancialStatementSchema = z.object({
  symbol: z.string(),
  cik: z.string().optional(),
  period: z.enum(['annual', 'quarter', 'ttm']),
  fiscal_year: z.number(),
  fiscal_period: z.string().optional(),
  calendar_date: z.string(),
  report_date: z.string(),
}).catchall(z.union([z.string(), z.number(), z.null()]));

export const FinancialStatementArraySchema = z.array(FinancialStatementSchema);

/**
 * Options chain schema
 */
export const OptionsChainSchema = z.object({
  contract_symbol: z.string(),
  symbol: z.string(),
  expiration: z.string(),
  strike: z.number(),
  option_type: z.enum(['call', 'put']),
  last_price: z.number().optional(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  volume: z.number().optional(),
  open_interest: z.number().optional(),
  implied_volatility: z.number().optional(),
  delta: z.number().optional(),
  gamma: z.number().optional(),
  theta: z.number().optional(),
  vega: z.number().optional(),
  rho: z.number().optional(),
});

export const OptionsChainArraySchema = z.array(OptionsChainSchema);

/**
 * Economic data schema
 */
export const EconomicDataSchema = z.object({
  date: z.string(),
  value: z.number(),
  symbol: z.string().optional(),
  name: z.string().optional(),
  country: z.string().optional(),
});

export const EconomicDataArraySchema = z.array(EconomicDataSchema);

/**
 * News article schema
 */
export const NewsArticleSchema = z.object({
  date: z.string(),
  title: z.string(),
  text: z.string().optional(),
  url: z.string().optional(),
  symbols: z.array(z.string()).optional(),
  source: z.string().optional(),
  author: z.string().optional(),
});

export const NewsArticleArraySchema = z.array(NewsArticleSchema);

/**
 * Provider info schema
 */
export const ProviderInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  credentials: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  website: z.string().optional(),
});
