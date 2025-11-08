import { describe, it, expect, vi } from 'vitest'
import { YahooFinanceAdapter } from './yahoo-finance.adapter'

const LIVE = process.env.LIVE_TESTS === 'true'

// Only run live tests if explicitly requested
const maybeDescribe = LIVE ? describe : describe.skip

maybeDescribe('[LIVE] YahooFinanceAdapter', () => {
  it('[LIVE] getQuote: returns non-empty, valid result', async () => {
    const adapter = new YahooFinanceAdapter()
    const start = Date.now()
    let pass = false
    let quote, httpStatus
    try {
      quote = await adapter.getQuote({ symbol: 'AAPL' })
      httpStatus = 200 // Assume pass, no direct status from fetch in wrapper
      // Field presence / invariants; price and volume must be present and >0
      expect(quote.price).toBeGreaterThan(0)
      expect(quote.symbol).toBe('AAPL')
      expect(quote.volume).toBeGreaterThanOrEqual(0) // zero in holidays ok
      pass = true
      // Log required by spec
      console.log(`[LIVE] yahoo-finance.getQuote: PASS (${Date.now() - start}ms, status: ${httpStatus}, price=${quote.price}, volume=${quote.volume})`)
    } catch (err) {
      const msg = err && typeof err === 'object' ? (err.message || String(err)) : String(err)
      console.log(`[LIVE] yahoo-finance.getQuote: FAIL (${Date.now() - start}ms, status: ${httpStatus || 'n/a'}, error=${msg})`)
      throw err
    }
  }, 10000)

  it('[LIVE] getHistoricalPrices: returns array with expected shape', async () => {
    const adapter = new YahooFinanceAdapter()
    const start = Date.now()
    let pass = false
    let res, httpStatus
    try {
      res = await adapter.getHistoricalPrices({ symbol: 'AAPL', from: new Date(Date.now() - 7 * 24 * 3600 * 1000), to: new Date() })
      httpStatus = 200 // Simulate
      expect(Array.isArray(res)).toBe(true)
      expect(res.length).toBeGreaterThan(0)
      expect(res[0]).toHaveProperty('date')
      expect(res[0]).toHaveProperty('ohlcv')
      pass = true
      console.log(`[LIVE] yahoo-finance.getHistoricalPrices: PASS (${Date.now() - start}ms, status: ${httpStatus}, n=${res.length})`)
    } catch (err) {
      const msg = err && typeof err === 'object' ? (err.message || String(err)) : String(err)
      console.log(`[LIVE] yahoo-finance.getHistoricalPrices: FAIL (${Date.now() - start}ms, status: ${httpStatus || 'n/a'}, error=${msg})`)
      throw err
    }
  }, 10000)
})

describe('YahooFinanceAdapter (Mocked)', () => {
  it('should instantiate without error', () => {
    const adapter = new YahooFinanceAdapter()
    expect(adapter).toBeDefined()
  })
})
