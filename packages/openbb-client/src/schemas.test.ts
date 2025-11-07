import { describe, it, expect } from 'vitest';
import {
  HistoricalPriceSchema,
  QuoteSchema,
  CompanyProfileSchema,
  FinancialStatementSchema,
  OptionsChainSchema,
  EconomicDataSchema,
  NewsArticleSchema,
} from './schemas';

describe('Schemas', () => {
  describe('HistoricalPriceSchema', () => {
    it('should validate valid historical price data', () => {
      const data = {
        date: '2024-01-01',
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1000000,
      };
      expect(() => HistoricalPriceSchema.parse(data)).not.toThrow();
    });

    it('should accept optional adj_close', () => {
      const data = {
        date: '2024-01-01',
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1000000,
        adj_close: 102,
      };
      expect(() => HistoricalPriceSchema.parse(data)).not.toThrow();
    });
  });

  describe('QuoteSchema', () => {
    it('should validate valid quote data', () => {
      const data = {
        symbol: 'AAPL',
        last_price: 150.25,
        change: 2.5,
        change_percent: 1.69,
        volume: 50000000,
        timestamp: '2024-01-01T12:00:00Z',
      };
      expect(() => QuoteSchema.parse(data)).not.toThrow();
    });
  });

  describe('CompanyProfileSchema', () => {
    it('should validate valid company profile', () => {
      const data = {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        industry: 'Consumer Electronics',
      };
      expect(() => CompanyProfileSchema.parse(data)).not.toThrow();
    });
  });

  describe('FinancialStatementSchema', () => {
    it('should validate valid financial statement', () => {
      const data = {
        symbol: 'AAPL',
        period: 'annual' as const,
        fiscal_year: 2023,
        calendar_date: '2023-09-30',
        report_date: '2023-11-02',
      };
      expect(() => FinancialStatementSchema.parse(data)).not.toThrow();
    });
  });

  describe('OptionsChainSchema', () => {
    it('should validate valid options chain data', () => {
      const data = {
        contract_symbol: 'AAPL240119C00150000',
        symbol: 'AAPL',
        expiration: '2024-01-19',
        strike: 150,
        option_type: 'call' as const,
      };
      expect(() => OptionsChainSchema.parse(data)).not.toThrow();
    });
  });

  describe('EconomicDataSchema', () => {
    it('should validate valid economic data', () => {
      const data = {
        date: '2024-01-01',
        value: 2.5,
        symbol: 'GDP',
      };
      expect(() => EconomicDataSchema.parse(data)).not.toThrow();
    });
  });

  describe('NewsArticleSchema', () => {
    it('should validate valid news article', () => {
      const data = {
        date: '2024-01-01',
        title: 'Apple releases new product',
        symbols: ['AAPL'],
      };
      expect(() => NewsArticleSchema.parse(data)).not.toThrow();
    });
  });
});
