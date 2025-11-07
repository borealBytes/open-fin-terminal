import { describe, it, expect } from 'vitest'
import { SymbolSchema, OHLCVSchema } from './types'

describe('SymbolSchema', () => {
  it('should validate a valid symbol', () => {
    const symbol = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      assetType: 'equity' as const,
      currency: 'USD',
    }
    expect(() => SymbolSchema.parse(symbol)).not.toThrow()
  })

  it('should reject invalid asset type', () => {
    const symbol = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      assetType: 'invalid',
    }
    expect(() => SymbolSchema.parse(symbol)).toThrow()
  })
})

describe('OHLCVSchema', () => {
  it('should validate valid OHLCV', () => {
    const ohlcv = {
      open: 150.0,
      high: 152.5,
      low: 149.0,
      close: 151.0,
      volume: 1000000,
    }
    expect(() => OHLCVSchema.parse(ohlcv)).not.toThrow()
  })

  it('should reject missing fields', () => {
    const ohlcv = {
      open: 150.0,
      high: 152.5,
    }
    expect(() => OHLCVSchema.parse(ohlcv)).toThrow()
  })
})
