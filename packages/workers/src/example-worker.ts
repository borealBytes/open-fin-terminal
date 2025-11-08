/**
 * Example analytics worker demonstrating Comlink usage.
 * 
 * This worker performs heavy computations off the main thread.
 */

import { expose } from 'comlink';

/**
 * Simple Moving Average calculation
 */
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Relative Strength Index calculation
 */
function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate RSI
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(NaN);
      continue;
    }
    
    let avgGain = 0;
    let avgLoss = 0;
    
    for (let j = 0; j < period; j++) {
      avgGain += gains[i - j];
      avgLoss += losses[i - j];
    }
    
    avgGain /= period;
    avgLoss /= period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  // Add NaN for first element to align with price array
  return [NaN, ...rsi];
}

/**
 * Worker API exposed via Comlink
 */
const api = {
  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices: number[], period: number): number[] {
    return calculateSMA(prices, period);
  },
  
  /**
   * Calculate Relative Strength Index
   */
  calculateRSI(prices: number[], period?: number): number[] {
    return calculateRSI(prices, period);
  },
  
  /**
   * Calculate multiple indicators at once
   */
  calculateIndicators(prices: number[]) {
    return {
      sma20: calculateSMA(prices, 20),
      sma50: calculateSMA(prices, 50),
      rsi14: calculateRSI(prices, 14),
    };
  },
};

// Expose API to main thread
expose(api);

// Export type for use in main thread
export type AnalyticsWorkerAPI = typeof api;
