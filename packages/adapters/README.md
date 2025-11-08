# @open-fin-terminal/adapters

Core data adapter interfaces and registry for Open Financial Terminal.

## Overview

This package defines the `DataAdapter` interface that all data sources must implement, along with the `AdapterRegistry` that manages multiple adapters with intelligent fallback logic.

## Installation

```bash
pnpm add @open-fin-terminal/adapters
```

## Usage

### Implementing an Adapter

```typescript
import { DataAdapter, AdapterCapabilities, HealthCheck } from '@open-fin-terminal/adapters';
import type { Quote, HistoricalPrice, Fundamentals } from '@open-fin-terminal/shared';

class YahooFinanceAdapter implements DataAdapter {
  readonly name = 'yahoo-finance';
  readonly type = 'built-in';
  readonly requiresSetup = false;

  async healthCheck(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Test connectivity
      await fetch('https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d');
      return {
        adapter: this.name,
        status: 'healthy',
        latency: Date.now() - start,
        successRate: 1.0,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        adapter: this.name,
        status: 'unavailable',
        latency: Date.now() - start,
        successRate: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getCapabilities(): AdapterCapabilities {
    return {
      quotes: true,
      historical: true,
      fundamentals: true,
      options: false,
      economic: false,
      forex: true,
      crypto: true,
      news: false,
      realtime: false, // 15-minute delay
    };
  }

  async getQuote(params: QuoteParams): Promise<Quote> {
    // Implementation
  }

  async getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]> {
    // Implementation
  }

  async getFundamentals(params: FundamentalsParams): Promise<Fundamentals> {
    // Implementation
  }
}
```

### Using the Registry

```typescript
import { AdapterRegistry } from '@open-fin-terminal/adapters';

// Create registry
const registry = new AdapterRegistry({
  healthCheckInterval: 60000, // Check every minute
  autoHealthCheck: true,
});

// Register built-in adapters
registry.register(new YahooFinanceAdapter());
registry.register(new SecEdgarAdapter());

// Register optional adapter if available
if (process.env.OPENBB_API_URL) {
  registry.register(new OpenBBAdapter());
}

// Set fallback chain (tries in order)
registry.setFallbackChain([
  'openbb',         // Try premium first if available
  'yahoo-finance',  // Fall back to free
  'sec-edgar',      // Final fallback
]);

// Get healthy adapter (automatically selects from chain)
const adapter = await registry.getAdapter();

// Use adapter
const quote = await adapter.getQuote({ symbol: 'AAPL' });
console.log(quote);

// Or prefer specific adapter
const yahooAdapter = await registry.getAdapter('yahoo-finance');
```

### Health Monitoring

```typescript
// Get health status for all adapters
const healthStatus = registry.getHealthStatus();

for (const [name, health] of healthStatus) {
  console.log(`${name}: ${health.status} (latency: ${health.latency}ms)`);
}

// Check specific adapter
const health = await registry.checkHealth('yahoo-finance');
if (health?.status === 'healthy') {
  console.log('Yahoo Finance is healthy');
}
```

### Finding Adapters by Capability

```typescript
// Get all adapters that support options data
const optionsAdapters = registry.getAdaptersWithCapability('options');

// Get all adapters that support real-time data
const realtimeAdapters = registry.getAdaptersWithCapability('realtime');
```

## Architecture

### Adapter Types

**Built-in Adapters** (`type: 'built-in'`)
- Free, no-account-required data sources
- Work with zero setup
- Examples: Yahoo Finance, SEC EDGAR, US Treasury

**Optional Adapters** (`type: 'optional'`)
- Require setup (API keys, local servers, etc.)
- Provide enhanced functionality
- Examples: OpenBB Platform, IEX Cloud, Polygon

### Fallback Logic

The registry implements intelligent fallback:

1. Try preferred adapter (if specified)
2. If unavailable, try next adapter in fallback chain
3. Continue until healthy adapter found
4. Throw error if no adapters available

Adapters are selected based on:
- Health status (healthy/degraded/unavailable)
- Position in fallback chain
- Capabilities (if filtering by capability)

### Health Monitoring

The registry automatically monitors adapter health:
- Periodic health checks (configurable interval)
- Caches results to avoid excessive checks
- Updates status based on health check responses
- Gracefully degrades when adapters fail

## API Reference

See [TypeScript types](./src/types.ts) for complete API documentation.

### Key Interfaces

- **`DataAdapter`**: Interface all adapters must implement
- **`AdapterRegistry`**: Manages adapters with fallback logic
- **`AdapterCapabilities`**: Describes adapter capabilities
- **`HealthCheck`**: Health status information
- **`AdapterError`**: Adapter-specific errors

## Testing

Adapters should include comprehensive tests:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('YahooFinanceAdapter', () => {
  it('should perform health check', async () => {
    const adapter = new YahooFinanceAdapter();
    const health = await adapter.healthCheck();
    
    expect(health.adapter).toBe('yahoo-finance');
    expect(health.status).toBeDefined();
    expect(health.latency).toBeGreaterThan(0);
  });

  it('should return capabilities', () => {
    const adapter = new YahooFinanceAdapter();
    const caps = adapter.getCapabilities();
    
    expect(caps.quotes).toBe(true);
    expect(caps.historical).toBe(true);
  });
});
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT - see [LICENSE](../../LICENSE)
