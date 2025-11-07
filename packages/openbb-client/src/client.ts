/**
 * OpenBB Platform REST API Client
 */

import { z } from 'zod';
import { OpenBBError } from './errors';
import type {
  OpenBBClientConfig,
  OpenBBResponse,
  HistoricalPrice,
  Quote,
  CompanyProfile,
  FinancialStatement,
  OptionsChain,
  EconomicData,
  NewsArticle,
  ProviderInfo,
} from './types';
import {
  OpenBBResponseSchema,
  HistoricalPriceArraySchema,
  QuoteSchema,
  CompanyProfileSchema,
  FinancialStatementArraySchema,
  OptionsChainArraySchema,
  EconomicDataArraySchema,
  NewsArticleArraySchema,
  ProviderInfoSchema,
} from './schemas';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<OpenBBClientConfig> = {
  baseUrl: 'http://127.0.0.1:6900',
  apiKey: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cache: true,
  cacheTtl: 300000,
};

/**
 * Simple in-memory cache
 */
class SimpleCache {
  private cache = new Map<string, { data: unknown; expires: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Main OpenBB Platform client
 */
export class OpenBBClient {
  private config: Required<OpenBBClientConfig>;
  private cache: SimpleCache;

  constructor(config: OpenBBClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new SimpleCache();
  }

  /**
   * Make authenticated request to OpenBB Platform API
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
    schema: z.ZodTypeAny
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;

    // Check cache
    if (this.config.cache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return cached;
    }

    // Build URL with query parameters
    const url = new URL(endpoint, this.config.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    // Execute request with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
          },
          signal: AbortSignal.timeout(this.config.timeout),
        });

        if (!response.ok) {
          throw OpenBBError.fromResponse(response, endpoint);
        }

        const json = await response.json();

        // Validate response
        let validated: T;
        try {
          validated = schema.parse(json) as T;
        } catch (validationError) {
          throw OpenBBError.validationError(endpoint, validationError);
        }

        // Cache successful response
        if (this.config.cache) {
          this.cache.set(cacheKey, validated, this.config.cacheTtl);
        }

        return validated;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on validation errors or 4xx errors
        if (
          error instanceof OpenBBError &&
          (error.status ? error.status >= 400 && error.status < 500 : false)
        ) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError || OpenBBError.networkError(endpoint, 'Unknown error');
  }

  /**
   * Get available providers
   */
  async getProviders(): Promise<Record<string, ProviderInfo>> {
    const schema = z.record(ProviderInfoSchema);
    return this.request('/providers', {}, schema);
  }

  /**
   * Equity endpoints
   */
  equity = {
    price: {
      /**
       * Get historical price data
       */
      historical: async (params: {
        symbol: string;
        start_date?: string;
        end_date?: string;
        provider?: string;
      }): Promise<OpenBBResponse<HistoricalPrice[]>> => {
        const schema = OpenBBResponseSchema(HistoricalPriceArraySchema);
        return this.request('/equity/price/historical', params, schema);
      },

      /**
       * Get real-time quote
       */
      quote: async (params: {
        symbol: string;
        provider?: string;
      }): Promise<OpenBBResponse<Quote>> => {
        const schema = OpenBBResponseSchema(QuoteSchema);
        return this.request('/equity/price/quote', params, schema);
      },
    },

    profile: {
      /**
       * Get company profile/description
       */
      get: async (params: {
        symbol: string;
        provider?: string;
      }): Promise<OpenBBResponse<CompanyProfile>> => {
        const schema = OpenBBResponseSchema(CompanyProfileSchema);
        return this.request('/equity/profile', params, schema);
      },
    },

    fundamental: {
      /**
       * Get income statement
       */
      income: async (params: {
        symbol: string;
        period?: 'annual' | 'quarter';
        limit?: number;
        provider?: string;
      }): Promise<OpenBBResponse<FinancialStatement[]>> => {
        const schema = OpenBBResponseSchema(FinancialStatementArraySchema);
        return this.request('/equity/fundamental/income', params, schema);
      },

      /**
       * Get balance sheet
       */
      balance: async (params: {
        symbol: string;
        period?: 'annual' | 'quarter';
        limit?: number;
        provider?: string;
      }): Promise<OpenBBResponse<FinancialStatement[]>> => {
        const schema = OpenBBResponseSchema(FinancialStatementArraySchema);
        return this.request('/equity/fundamental/balance', params, schema);
      },

      /**
       * Get cash flow statement
       */
      cash: async (params: {
        symbol: string;
        period?: 'annual' | 'quarter';
        limit?: number;
        provider?: string;
      }): Promise<OpenBBResponse<FinancialStatement[]>> => {
        const schema = OpenBBResponseSchema(FinancialStatementArraySchema);
        return this.request('/equity/fundamental/cash', params, schema);
      },
    },
  };

  /**
   * Options endpoints
   */
  options = {
    /**
     * Get options chains
     */
    chains: async (params: {
      symbol: string;
      date?: string;
      provider?: string;
    }): Promise<OpenBBResponse<OptionsChain[]>> => {
      const schema = OpenBBResponseSchema(OptionsChainArraySchema);
      return this.request('/options/chains', params, schema);
    },
  };

  /**
   * Economy endpoints
   */
  economy = {
    /**
     * Get economic indicator data (e.g., GDP, CPI, unemployment)
     */
    data: async (params: {
      symbol: string;
      start_date?: string;
      end_date?: string;
      provider?: string;
    }): Promise<OpenBBResponse<EconomicData[]>> => {
      const schema = OpenBBResponseSchema(EconomicDataArraySchema);
      return this.request('/economy/data', params, schema);
    },
  };

  /**
   * News endpoints
   */
  news = {
    /**
     * Get company news
     */
    company: async (params: {
      symbol: string;
      limit?: number;
      provider?: string;
    }): Promise<OpenBBResponse<NewsArticle[]>> => {
      const schema = OpenBBResponseSchema(NewsArticleArraySchema);
      return this.request('/news/company', params, schema);
    },
  };

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
