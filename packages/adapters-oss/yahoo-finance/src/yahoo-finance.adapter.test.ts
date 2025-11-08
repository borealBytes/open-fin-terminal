import { describe, it, expect } from 'vitest'
import { YahooFinanceAdapter } from './yahoo-finance.adapter'

describe('YahooFinanceAdapter', () => {
  it('should instantiate without error', () => {
    const adapter = new YahooFinanceAdapter()
    expect(adapter).toBeDefined()
    expect(typeof adapter.healthCheck).toBe('function')
  })
})
