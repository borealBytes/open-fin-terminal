# @open-fin-terminal/openbb-client

TypeScript SDK for integrating with the OpenBB Platform API.

## Overview

This package provides a type-safe client for interacting with OpenBB Platform's FastAPI backend, enabling access to 100+ financial data providers through a unified interface.

## Architecture

The OpenBB Platform operates as a data router that:
- Identifies the appropriate provider for each request
- Sends requests to the provider
- Returns data in well-defined models

This client wraps those capabilities in a TypeScript-first SDK with:
- Zod schema validation for all responses
- Retry logic with exponential backoff
- Rate limiting and caching support
- WebSocket client for real-time data
- Type-safe API methods

## Installation

```bash
pnpm add @open-fin-terminal/openbb-client
```

## Prerequisites

You need a running OpenBB Platform instance:

```bash
# Install OpenBB Platform
pip install openbb

# Start the API server
openbb-api

# Server runs at http://127.0.0.1:6900
```

## Usage

### Basic Client Setup

```typescript
import { OpenBBClient } from '@open-fin-terminal/openbb-client';

// Create client instance
const client = new OpenBBClient({
  baseUrl: 'http://127.0.0.1:6900',
  apiKey: process.env.OPENBB_API_KEY, // Optional
});

// Fetch equity price data
const priceData = await client.equity.price.historical({
  symbol: 'AAPL',
  provider: 'yfinance', // Optional: defaults to best available
});

// Access as DataFrame-compatible structure
const df = priceData.to_dataframe();
console.log(df);
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
// Use specific provider
const data = await client.equity.price.historical({
  symbol: 'AAPL',
  provider: 'polygon', // Requires API key
});

// Let OpenBB choose (uses free providers first)
const data = await client.equity.price.historical({
  symbol: 'AAPL',
  // No provider specified
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

## API Reference

See the [OpenBB Platform API Documentation](https://docs.openbb.co/platform/reference) for complete endpoint reference.

## License

MIT
