import { describe, it, expect } from 'vitest'
import { StooqAdapter } from './stooq.adapter'
const LIVE = process.env.LIVE_TESTS === 'true'

const maybeDescribe = LIVE ? describe : describe.skip

maybeDescribe('[LIVE] StooqAdapter', () => {
  it('[LIVE] getHistoricalPrices: returns array with valid shape', async () => {
    const adapter = new StooqAdapter()
    const start = Date.now()
    let result, pass=false, httpStatus
    try {
      result = await adapter.getHistoricalPrices({ symbol: 'AAPL', from: new Date(Date.now() - 14 * 24 * 3600 * 1000), to: new Date() })
      httpStatus = 200
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('ohlcv')
      pass = true
      console.log(`[LIVE] stooq.getHistoricalPrices: PASS (${Date.now() - start}ms, status: ${httpStatus}, n=${result.length})`)
    } catch (err) {
      const msg = err && typeof err === 'object' ? (err.message || String(err)) : String(err)
      console.log(`[LIVE] stooq.getHistoricalPrices: FAIL (${Date.now() - start}ms, status: ${httpStatus || 'n/a'}, error=${msg})`)
      throw err
    }
  }, 10000)
})

describe('StooqAdapter (Mocked)', () => {
  it('should instantiate without error', () => {
    const adapter = new StooqAdapter()
    expect(adapter).toBeDefined()
    expect(typeof adapter.getHistoricalPrices).toBe('function')
  })
})
