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

/**
 * Real-time or delayed quote for a security
 */
export interface Quote {
  /** Symbol ticker */
  symbol: string
  /** Current price */
  price: number
  /** Bid price */
  bid?: number
  /** Ask price */
  ask?: number
  /** Bid size */
  bidSize?: number
  /** Ask size */
  askSize?: number
  /** Last trade size */
  lastSize?: number
  /** Trading volume */
  volume: number
  /** Previous close price */
  previousClose?: number
  /** Open price */
  open?: number
  /** Day high */
  high?: number
  /** Day low */
  low?: number
  /** 52-week high */
  high52Week?: number
  /** 52-week low */
  low52Week?: number
  /** Market cap */
  marketCap?: number
  /** P/E ratio */
  peRatio?: number
  /** Timestamp of quote */
  timestamp: Date
  /** Whether quote is real-time or delayed */
  realtime: boolean
}

/**
 * Zod schema for Quote
 */
export const QuoteSchema = z.object({
  symbol: z.string(),
  price: z.number(),
  bid: z.number().optional(),
  ask: z.number().optional(),
  bidSize: z.number().optional(),
  askSize: z.number().optional(),
  lastSize: z.number().optional(),
  volume: z.number(),
  previousClose: z.number().optional(),
  open: z.number().optional(),
  high: z.number().optional(),
  low: z.number().optional(),
  high52Week: z.number().optional(),
  low52Week: z.number().optional(),
  marketCap: z.number().optional(),
  peRatio: z.number().optional(),
  timestamp: z.date(),
  realtime: z.boolean(),
})

/**
 * Historical price data point
 */
export interface HistoricalPrice {
  /** Timestamp */
  date: Date
  /** OHLCV data */
  ohlcv: OHLCV
  /** Adjusted close (for splits/dividends) */
  adjustedClose?: number
}

/**
 * Zod schema for HistoricalPrice
 */
export const HistoricalPriceSchema = z.object({
  date: z.date(),
  ohlcv: OHLCVSchema,
  adjustedClose: z.number().optional(),
})

/**
 * Company profile information
 */
export interface CompanyProfile {
  /** Company name */
  name: string
  /** Industry */
  industry?: string
  /** Sector */
  sector?: string
  /** Number of employees */
  employees?: number
  /** Company description */
  description?: string
  /** Website URL */
  website?: string
  /** Headquarters location */
  headquarters?: string
  /** Founded year */
  founded?: number
  /** CEO name */
  ceo?: string
}

/**
 * Financial statement period
 */
export type Period = 'annual' | 'quarterly'

/**
 * Income statement data
 */
export interface IncomeStatement {
  /** Period end date */
  date: Date
  /** Period type */
  period: Period
  /** Total revenue */
  revenue: number
  /** Cost of revenue */
  costOfRevenue?: number
  /** Gross profit */
  grossProfit?: number
  /** Operating expenses */
  operatingExpenses?: number
  /** Operating income */
  operatingIncome?: number
  /** Net income */
  netIncome: number
  /** Earnings per share */
  eps?: number
  /** Diluted earnings per share */
  epsDiluted?: number
}

/**
 * Balance sheet data
 */
export interface BalanceSheet {
  /** Period end date */
  date: Date
  /** Period type */
  period: Period
  /** Total assets */
  totalAssets: number
  /** Current assets */
  currentAssets?: number
  /** Total liabilities */
  totalLiabilities: number
  /** Current liabilities */
  currentLiabilities?: number
  /** Shareholders equity */
  shareholdersEquity: number
  /** Total debt */
  totalDebt?: number
  /** Cash and equivalents */
  cash?: number
}

/**
 * Cash flow statement data
 */
export interface CashFlowStatement {
  /** Period end date */
  date: Date
  /** Period type */
  period: Period
  /** Operating cash flow */
  operatingCashFlow: number
  /** Investing cash flow */
  investingCashFlow?: number
  /** Financing cash flow */
  financingCashFlow?: number
  /** Free cash flow */
  freeCashFlow?: number
  /** Capital expenditures */
  capitalExpenditures?: number
}

/**
 * Comprehensive fundamental data
 */
export interface Fundamentals {
  /** Symbol */
  symbol: string
  /** Company profile */
  profile?: CompanyProfile
  /** Latest income statement */
  incomeStatement?: IncomeStatement
  /** Latest balance sheet */
  balanceSheet?: BalanceSheet
  /** Latest cash flow statement */
  cashFlow?: CashFlowStatement
  /** Historical income statements */
  incomeStatements?: IncomeStatement[]
  /** Historical balance sheets */
  balanceSheets?: BalanceSheet[]
  /** Historical cash flow statements */
  cashFlows?: CashFlowStatement[]
}

/**
 * Zod schema for Fundamentals
 */
export const FundamentalsSchema = z.object({
  symbol: z.string(),
  profile: z.object({
    name: z.string(),
    industry: z.string().optional(),
    sector: z.string().optional(),
    employees: z.number().optional(),
    description: z.string().optional(),
    website: z.string().optional(),
    headquarters: z.string().optional(),
    founded: z.number().optional(),
    ceo: z.string().optional(),
  }).optional(),
  incomeStatement: z.object({
    date: z.date(),
    period: z.enum(['annual', 'quarterly']),
    revenue: z.number(),
    costOfRevenue: z.number().optional(),
    grossProfit: z.number().optional(),
    operatingExpenses: z.number().optional(),
    operatingIncome: z.number().optional(),
    netIncome: z.number(),
    eps: z.number().optional(),
    epsDiluted: z.number().optional(),
  }).optional(),
  balanceSheet: z.object({
    date: z.date(),
    period: z.enum(['annual', 'quarterly']),
    totalAssets: z.number(),
    currentAssets: z.number().optional(),
    totalLiabilities: z.number(),
    currentLiabilities: z.number().optional(),
    shareholdersEquity: z.number(),
    totalDebt: z.number().optional(),
    cash: z.number().optional(),
  }).optional(),
  cashFlow: z.object({
    date: z.date(),
    period: z.enum(['annual', 'quarterly']),
    operatingCashFlow: z.number(),
    investingCashFlow: z.number().optional(),
    financingCashFlow: z.number().optional(),
    freeCashFlow: z.number().optional(),
    capitalExpenditures: z.number().optional(),
  }).optional(),
  incomeStatements: z.array(z.any()).optional(),
  balanceSheets: z.array(z.any()).optional(),
  cashFlows: z.array(z.any()).optional(),
})
