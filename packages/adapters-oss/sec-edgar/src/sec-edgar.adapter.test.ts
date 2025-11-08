import { describe, it, expect } from 'vitest'
import { SECEdgarAdapter } from './sec-edgar.adapter'
const LIVE = process.env.LIVE_TESTS === 'true'

const maybeDescribe = LIVE ? describe : describe.skip

maybeDescribe('[LIVE] SECEdgarAdapter', () => {
  it('[LIVE] getFundamentals: returns minimal, valid company fact result', async () => {
    const adapter = new SECEdgarAdapter()
    const start = Date.now()
    let fundamentals, pass=false, httpStatus
    try {
      fundamentals = await adapter.getFundamentals({ symbol: 'AAPL' })
      httpStatus = 200
      expect(fundamentals.symbol).toBeDefined()
      expect(typeof fundamentals).toBe('object')
      expect(fundamentals.balanceSheet).toBeDefined()
      pass = true
      console.log(`[LIVE] sec-edgar.getFundamentals: PASS (${Date.now() - start}ms, status: ${httpStatus}, keys=${Object.keys(fundamentals).length})`)
    } catch (err) {
      const msg = err && typeof err === 'object' ? (err.message || String(err)) : String(err)
      console.log(`[LIVE] sec-edgar.getFundamentals: FAIL (${Date.now() - start}ms, status: ${httpStatus || 'n/a'}, error=${msg})`)
      throw err
    }
  }, 10000)
})

describe('SECEdgarAdapter (Mocked)', () => {
  it('should instantiate without error', () => {
    const adapter = new SECEdgarAdapter()
    expect(adapter).toBeDefined()
    expect(typeof adapter.getFundamentals).toBe('function')
  })
})
