import { z } from 'zod'

/**
 * Symbol identifier
 */
export interface Symbol {
  ticker: string
  name: string
  exchange?: string
  assetType: 'equity' | 'etf' | 'option' | 'bond' | 'fx' | 'crypto' | 'future'
  currency?: string
}

/**
 * Zod schema for Symbol
 */
export const SymbolSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  exchange: z.string().optional(),
  assetType: z.enum(['equity', 'etf', 'option', 'bond', 'fx', 'crypto', 'future']),
  currency: z.string().optional(),
})

/**
 * Time series data point
 */
export interface TimeSeriesPoint<T = number> {
  timestamp: Date
  value: T
}

/**
 * OHLCV bar
 */
export interface OHLCV {
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Zod schema for OHLCV
 */
export const OHLCVSchema = z.object({
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
})
