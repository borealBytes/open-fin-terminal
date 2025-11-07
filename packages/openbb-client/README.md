# @open-fin-terminal/openbb-client

> **Optional Adapter**: This package provides enhanced data access through OpenBB Platform. It is **not required** for basic terminal functionality, which works perfectly with built-in free adapters.

TypeScript SDK for integrating with the OpenBB Platform API, enabling access to 100+ financial data providers through a unified interface.

## ⚠️ Prerequisites

**This adapter requires external software installation:**

1. **Python 3.8+** must be installed on your system
2. **OpenBB Platform** installed: `pip install openbb`
3. **OpenBB API server running**: `openbb-api` (serves at http://127.0.0.1:6900)

> **Not ready to install Python?** The Open Financial Terminal works perfectly with built-in free data adapters (SEC EDGAR, Yahoo Finance, etc.) that require no additional setup. See the [main README](../../README.md#-built-in-free-sources-no-setup-required) for details.

## Overview

This package provides a type-safe client for interacting with OpenBB Platform's FastAPI backend. OpenBB Platform operates as a data router that identifies the appropriate provider for each request and returns data in well-defined models.

This client wraps those capabilities in a TypeScript-first SDK with:
- Zod schema validation for all responses
- Retry logic with exponential backoff
- Rate limiting and caching support
- WebSocket client for real-time data
- Type-safe API methods

## When to Use This Adapter

Choose the OpenBB adapter if you:
- ✅ Already have OpenBB Platform installed and configured
- ✅ Want access to premium data providers (with your own API keys)
- ✅ Need unified access to 100+ data sources through one interface
- ✅ Are comfortable running a local Python server

Stick with built-in adapters if you:
- ❌ Want zero-setup, browser-only deployment (GitHub Pages)
- ❌ Prefer not to install Python or run local servers
- ❌ Only need basic equity, fundamental, and economic data

## Installation

### 1. Install OpenBB Platform

```bash
# Install OpenBB Platform (requires Python 3.8+)
pip install openbb

# Verify installation
python -c "import openbb; print(openbb.__version__)"
```

### 2. Configure Provider API Keys (Optional)

OpenBB has many free providers (like YFinance), but for premium providers you need API keys:

```bash
# Example: Configure Polygon API key
export POLYGON_API_KEY=your-key-here

# Example: Configure Alpha Vantage
export ALPHA_VANTAGE_API_KEY=your-key-here

# Example: Configure FRED (Federal Reserve data)
export FRED_API_KEY=your-key-here
```

See [OpenBB Platform documentation](https://docs.openbb.co/platform) for full provider setup.

### 3. Start OpenBB API Server

```bash
# Start the API server (runs at http://127.0.0.1:6900)
openbb-api

# Server will continue running until you stop it (Ctrl+C)
```

### 4. Install This Package

```bash
# From the monorepo root
pnpm install
```

## Usage

### Basic Client Setup

```typescript
import { OpenBBClient } from '@open-fin-terminal/openbb-client';

// Create client instance (assumes OpenBB server is running)
const client = new OpenBBClient({
  baseUrl: 'http://127.0.0.1:6900',
  apiKey: process.env.OPENBB_API_KEY, // Optional
});

// Fetch equity price data
const priceData = await client.equity.price.historical({
  symbol: 'AAPL',
  provider: 'yfinance', // Optional: defaults to best available
});

// Access results
console.log(priceData.results);
console.log('Data from provider:', priceData.provider);
```

### Graceful Fallback Pattern

In your adapter registry, implement graceful degradation:

```typescript
// Example: Adapter selection with fallback
let adapter;

if (process.env.OPENBB_API_URL) {
  try {
    adapter = new OpenBBAdapter();
    await adapter.healthCheck();
  } catch (error) {
    console.warn('OpenBB unavailable, falling back to YFinance');
    adapter = new YFinanceAdapter();
  }
} else {
  // Default to free built-in adapters
  adapter = new YFinanceAdapter();
}
```

### Available Endpoints

The client mirrors OpenBB Platform's API structure:

- **Equity**: `client.equity.*`
  - Price data (historical, quote, real-time)
  - Fundamentals (income, balance sheet, cash flow)
  - Ownership and insider data
  - Analyst estimates
  
- **Options**: `client.options.*`
  - Chains and snapshots
  - Unusual activity
  
- **Fixed Income**: `client.fixedincome.*`
  - Government bonds
  - Corporate bonds
  
- **Crypto**: `client.crypto.*`
  - Price data
  - Market data
  
- **Economy**: `client.economy.*`
  - Economic indicators (GDP, CPI, unemployment)
  - Central bank data (FRED)
  
- **ETF**: `client.etf.*`
  - Holdings and info
  - Price data

### Provider Selection

OpenBB Platform supports multiple providers per endpoint:

```typescript
// Use specific provider (requires API key configured in OpenBB)
const data = await client.equity.price.historical({
  symbol: 'AAPL',
  provider: 'polygon', // Requires Polygon API key
});

// Let OpenBB choose (uses free providers first)
const data = await client.equity.price.historical({
  symbol: 'AAPL',
  // No provider specified - OpenBB will use yfinance or other free sources
});
```

### Error Handling

```typescript
import { OpenBBError } from '@open-fin-terminal/openbb-client';

try {
  const data = await client.equity.price.historical({
    symbol: 'INVALID',
  });
} catch (error) {
  if (error instanceof OpenBBError) {
    console.error('OpenBB Error:', error.message);
    console.error('Status:', error.status);
    console.error('Provider:', error.provider);
    
    // Implement fallback to built-in adapter
    if (error.status === 503) {
      console.log('OpenBB server not available, using fallback adapter');
      // Use YFinanceAdapter or other built-in adapter
    }
  }
}
```

### WebSocket Streaming (Real-Time)

```typescript
import { OpenBBWebSocketClient } from '@open-fin-terminal/openbb-client';

const ws = new OpenBBWebSocketClient({
  baseUrl: 'ws://127.0.0.1:6900',
});

// Subscribe to real-time quotes
ws.subscribe('equity.price.quote', { symbol: 'AAPL' }, (data) => {
  console.log('New quote:', data);
});

// Unsubscribe
ws.unsubscribe('equity.price.quote', { symbol: 'AAPL' });
```

## Configuration

### Environment Variables

```bash
OPENBB_API_URL=http://127.0.0.1:6900
OPENBB_API_KEY=your-api-key-if-required

# Provider-specific keys (set in OpenBB Platform)
POLYGON_API_KEY=your-polygon-key
ALPHA_VANTAGE_API_KEY=your-av-key
FRED_API_KEY=your-fred-key
```

### Client Options

```typescript
const client = new OpenBBClient({
  baseUrl: 'http://127.0.0.1:6900',
  apiKey: 'optional-api-key',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  cache: true, // Enable response caching
  cacheTtl: 300000, // 5 minutes
});
```

## Data Models

All responses are validated against Zod schemas:

```typescript
import { z } from 'zod';
import { HistoricalPriceSchema } from '@open-fin-terminal/openbb-client';

// Type inference from schema
type HistoricalPrice = z.infer<typeof HistoricalPriceSchema>;

// Schema validation
const data = HistoricalPriceSchema.parse(response);
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Type check
pnpm typecheck
```

## Integration Example

Example adapter implementation that uses this client:

```typescript
import { OpenBBClient } from '@open-fin-terminal/openbb-client';
import type { Adapter, HistoricalPriceData } from '@open-fin-terminal/adapters';

export class OpenBBAdapter implements Adapter {
  private client: OpenBBClient;
  
  constructor(config?: { baseUrl?: string }) {
    this.client = new OpenBBClient({
      baseUrl: config?.baseUrl || process.env.OPENBB_API_URL || 'http://127.0.0.1:6900',
    });
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.getProviders();
      return true;
    } catch {
      return false;
    }
  }
  
  async getHistoricalPrices(symbol: string): Promise<HistoricalPriceData[]> {
    const response = await this.client.equity.price.historical({ symbol });
    return response.results.map(price => ({
      date: new Date(price.date),
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
    }));
  }
}
```

## Bloomberg Function Coverage

See [`src/bloomberg/functions.json`](../../src/bloomberg/functions.json) for a mapping of Bloomberg Terminal functions to OpenBB Platform endpoints.

Key supported functions:
- **DES** (Description): `equity.profile`
- **GP** (Graph Price): `equity.price.historical`
- **FA** (Financial Analysis): `equity.fundamental.*`
- **DVD** (Dividend History): `equity.fundamental.dividends`
- **SPLC** (Stock Splits): `equity.fundamental.splits`
- **EQS** (Equity Screener): `equity.screener`
- And many more...

## Troubleshooting

### "Connection refused" errors
- Ensure OpenBB API server is running: `openbb-api`
- Check that server is accessible at http://127.0.0.1:6900
- Verify firewall is not blocking the connection

### "Provider not found" errors
- Check that the provider is installed in OpenBB
- Verify API keys are configured for the provider
- Try using a free provider like `yfinance` first

### Performance issues
- Enable caching: `cache: true` in client config
- Increase `cacheTtl` for less frequently updated data
- Consider using the optional Node.js caching layer (Phase 9)

## API Reference

See the [OpenBB Platform API Documentation](https://docs.openbb.co/platform/reference) for complete endpoint reference.

## License

MIT

## Related Packages

- `@open-fin-terminal/adapters` - Core adapter interface definitions
- `@open-fin-terminal/adapters-oss` - Built-in free adapters (no setup required)
- `@open-fin-terminal/adapters-opt` - Other optional authenticated adapters
