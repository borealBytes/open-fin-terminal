/**
 * SEC EDGAR data adapter for company fundamentals.
 * 
 * Fetches financial data from SEC EDGAR's Company Facts API.
 * 
 * @see https://www.sec.gov/edgar/sec-api-documentation
 */

import type {
  DataAdapter,
  AdapterCapabilities,
  HealthCheck,
  QuoteParams,
  HistoricalPriceParams,
  FundamentalsParams,
} from '@open-fin-terminal/adapters';
import { AdapterError } from '@open-fin-terminal/adapters';
import type { Quote, HistoricalPrice, Fundamentals, IncomeStatement, BalanceSheet, CashFlowStatement } from '@open-fin-terminal/shared';
import { CIKLookup } from './cik-lookup';
import { TokenBucketLimiter } from './rate-limiter';
import { MemoryCache } from './cache';
import type { CompanyFactsResponse, SECFundamentals, UnitFact } from './types';
import { CompanyFactsResponseSchema } from './types';

const SEC_API_BASE = 'https://data.sec.gov';
const USER_AGENT = 'Open Financial Terminal (https://github.com/borealBytes/open-fin-terminal)';
const FACTS_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

/**
 * SEC EDGAR adapter for fundamental data.
 * 
 * Provides access to company fundamentals from SEC filings.
 */
export class SECEdgarAdapter implements DataAdapter {
  readonly name = 'sec-edgar';
  readonly type = 'built-in' as const;
  readonly requiresSetup = false;

  private cikLookup = new CIKLookup();
  private rateLimiter = new TokenBucketLimiter({ tokensPerSecond: 10, capacity: 10 });
  private cache = new MemoryCache();
  private lastHealthCheck: HealthCheck | null = null;

  /**
   * Health check for SEC EDGAR API.
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test with Apple's CIK (well-known, always available)
      const testCIK = '0000320193';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

      const response = await fetch(
        `${SEC_API_BASE}/api/xbrl/companyfacts/CIK${testCIK}.json`,
        {
          headers: { 'User-Agent': USER_AGENT },
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);
      const latency = Date.now() - startTime;

      this.lastHealthCheck = {
        adapter: this.name,
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        successRate: response.ok ? 1 : 0,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };

      return this.lastHealthCheck;
    } catch (error) {
      const latency = Date.now() - startTime;
      this.lastHealthCheck = {
        adapter: this.name,
        status: 'unavailable',
        latency,
        successRate: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      return this.lastHealthCheck;
    }
  }

  /**
   * Get adapter capabilities.
   */
  getCapabilities(): AdapterCapabilities {
    return {
      quotes: false,
      historical: false,
      fundamentals: true,
      options: false,
      economic: false,
      forex: false,
      crypto: false,
      news: false,
      realtime: false,
    };
  }

  /**
   * Not supported - SEC EDGAR only provides fundamentals.
   */
  async getQuote(_params: QuoteParams): Promise<Quote> {
    throw new AdapterError(
      'SEC EDGAR does not support real-time quotes',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  /**
   * Not supported - SEC EDGAR only provides fundamentals.
   */
  async getHistoricalPrices(_params: HistoricalPriceParams): Promise<HistoricalPrice[]> {
    throw new AdapterError(
      'SEC EDGAR does not support historical prices',
      this.name,
      'UNSUPPORTED_OPERATION'
    );
  }

  /**
   * Get fundamental data from SEC EDGAR.
   */
  async getFundamentals(params: FundamentalsParams): Promise<Fundamentals> {
    const { symbol } = params;

    // Check cache first
    const cacheKey = `fundamentals:${symbol.toUpperCase()}`;
    const cached = this.cache.get<Fundamentals>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Look up CIK
      const cik = await this.cikLookup.getCIK(symbol);
      if (!cik) {
        throw new AdapterError(
          `Ticker ${symbol} not found in SEC database`,
          this.name,
          'INVALID_REQUEST'
        );
      }

      // Fetch company facts
      const facts = await this.fetchCompanyFacts(cik);
      const fundamentals = this.parseCompanyFacts(facts);

      // Cache result
      this.cache.set(cacheKey, fundamentals, FACTS_CACHE_TTL);

      return fundamentals;
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new AdapterError(
        `Failed to fetch SEC EDGAR data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'UNKNOWN',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Fetch company facts from SEC EDGAR.
   */
  private async fetchCompanyFacts(cik: string): Promise<CompanyFactsResponse> {
    // Wait for rate limit
    await this.rateLimiter.waitFor(1);

    const url = `${SEC_API_BASE}/api/xbrl/companyfacts/CIK${cik}.json`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        throw new AdapterError(
          'SEC EDGAR rate limit exceeded',
          this.name,
          'RATE_LIMITED'
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      const validated = CompanyFactsResponseSchema.parse(data);
      return validated as CompanyFactsResponse;
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }
      throw new Error(`Failed to fetch from ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse company facts into Fundamentals format.
   */
  private parseCompanyFacts(facts: CompanyFactsResponse): Fundamentals {
    const usGaap = facts.facts['us-gaap'];
    if (!usGaap) {
      throw new AdapterError(
        'No US-GAAP data found in SEC filing',
        this.name,
        'INVALID_REQUEST'
      );
    }

    // Extract most recent annual values
    const revenue = this.getMostRecentAnnualValue(usGaap['Revenues'] || usGaap['RevenueFromContractWithCustomerExcludingAssessedTax']);
    const netIncome = this.getMostRecentAnnualValue(usGaap['NetIncomeLoss']);
    const totalAssets = this.getMostRecentAnnualValue(usGaap['Assets']);
    const totalLiabilities = this.getMostRecentAnnualValue(usGaap['Liabilities']);
    const shareholdersEquity = this.getMostRecentAnnualValue(usGaap['StockholdersEquity']);
    const operatingCashFlow = this.getMostRecentAnnualValue(usGaap['NetCashProvidedByUsedInOperatingActivities']);

    // Build income statement if we have data
    let incomeStatement: IncomeStatement | undefined;
    if (revenue || netIncome) {
      const latestDate = this.getLatestFiscalYearEnd(usGaap);
      incomeStatement = {
        date: latestDate,
        period: 'annual' as const,
        revenue: revenue?.val ?? 0,
        netIncome: netIncome?.val ?? 0,
      };
    }

    // Build balance sheet if we have data
    let balanceSheet: BalanceSheet | undefined;
    if (totalAssets || totalLiabilities || shareholdersEquity) {
      const latestDate = this.getLatestFiscalYearEnd(usGaap);
      balanceSheet = {
        date: latestDate,
        period: 'annual' as const,
        totalAssets: totalAssets?.val ?? 0,
        totalLiabilities: totalLiabilities?.val ?? 0,
        shareholdersEquity: shareholdersEquity?.val ?? 0,
      };
    }

    // Build cash flow statement if we have data
    let cashFlow: CashFlowStatement | undefined;
    if (operatingCashFlow) {
      const latestDate = this.getLatestFiscalYearEnd(usGaap);
      cashFlow = {
        date: latestDate,
        period: 'annual' as const,
        operatingCashFlow: operatingCashFlow.val,
      };
    }

    return {
      symbol: facts.entityName,
      profile: {
        name: facts.entityName,
      },
      incomeStatement,
      balanceSheet,
      cashFlow,
    };
  }

  /**
   * Get most recent annual value from a fact set.
   */
  private getMostRecentAnnualValue(factSet: any): UnitFact | null {
    if (!factSet?.units) return null;

    // SEC uses "USD" for currency values
    const usdFacts = factSet.units['USD'] || factSet.units['shares'];
    if (!usdFacts || !Array.isArray(usdFacts)) return null;

    // Filter to annual reports (10-K)
    const annualFacts = usdFacts.filter((f: UnitFact) => f.form === '10-K');
    if (annualFacts.length === 0) return null;

    // Sort by fiscal year (descending) and return most recent
    annualFacts.sort((a: UnitFact, b: UnitFact) => {
      const dateA = new Date(a.end).getTime();
      const dateB = new Date(b.end).getTime();
      return dateB - dateA;
    });

    return annualFacts[0] || null;
  }

  /**
   * Get latest fiscal year end date.
   */
  private getLatestFiscalYearEnd(usGaap: Record<string, any>): Date {
    // Try to find any annual data point to get the fiscal year end
    for (const factSet of Object.values(usGaap)) {
      const recent = this.getMostRecentAnnualValue(factSet);
      if (recent) {
        return new Date(recent.end);
      }
    }

    // Fallback to current date if no data found
    return new Date();
  }
}
