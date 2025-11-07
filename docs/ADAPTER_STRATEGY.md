# Data Adapter Strategy

This document outlines the Open Financial Terminal's data adapter architecture and strategy for maintaining the "100% free, no-account-required" principle while supporting optional enhancements.

## Core Principles

### 1. Free First, Always

The terminal must **always work** with zero setup beyond:
- Node.js/npm installed
- Running `pnpm install`
- Opening a web browser

No Python, no API keys, no server installations, no accounts required for basic functionality.

### 2. Static Deployment Viable

The terminal must be deployable as a static site (GitHub Pages, Netlify, etc.) with full core functionality. Enhanced features requiring servers are optional add-ons.

### 3. Graceful Degradation

When optional enhancements are unavailable:
- Terminal continues to function normally
- Users see helpful messages about optional features
- No errors or broken functionality

### 4. Progressive Enhancement

Users can choose to add capabilities:
- Install OpenBB Platform for 100+ providers
- Add API keys for premium data sources
- Run optional Node.js caching server

Each enhancement is clearly documented and opt-in.

## Architecture Overview

```typescript
// Adapter interface (packages/adapters/)
export interface DataAdapter {
  readonly name: string;
  readonly type: 'built-in' | 'optional';
  readonly requiresSetup: boolean;
  
  healthCheck(): Promise<boolean>;
  getCapabilities(): AdapterCapabilities;
  
  // Data methods
  getHistoricalPrices(params: HistoricalPriceParams): Promise<HistoricalPrice[]>;
  getQuote(symbol: string): Promise<Quote>;
  getFundamentals(symbol: string): Promise<Fundamentals>;
  // ... more methods
}

// Adapter registry with fallback logic
export class AdapterRegistry {
  private adapters: Map<string, DataAdapter>;
  private fallbackChain: string[];
  
  async getAdapter(preferredType?: string): Promise<DataAdapter> {
    // Try preferred adapter
    if (preferredType) {
      const adapter = this.adapters.get(preferredType);
      if (adapter && await adapter.healthCheck()) {
        return adapter;
      }
    }
    
    // Fall back through chain
    for (const name of this.fallbackChain) {
      const adapter = this.adapters.get(name);
      if (adapter && await adapter.healthCheck()) {
        return adapter;
      }
    }
    
    throw new Error('No data adapters available');
  }
}
```

## Implementation Phases

### Phase 2: Infrastructure (Current)

**Goal**: Establish adapter interfaces and optional enhancement pattern

- [x] Define `DataAdapter` interface
- [x] Create adapter registry with fallback logic
- [x] Implement OpenBB client as optional enhancement example
- [ ] Add adapter health check system
- [ ] Create adapter capability discovery

**Status**: `@open-fin-terminal/openbb-client` demonstrates the optional adapter pattern

### Phase 3: Built-in Free Adapters (Next Priority)

**Goal**: Implement zero-setup data adapters in TypeScript

**Planned Adapters** (packages/adapters-oss/):

#### 1. SEC EDGAR Adapter
- **Data**: Company fundamentals, filings, financial statements
- **Access**: Direct HTTPS API (no auth required)
- **Endpoint**: `https://data.sec.gov/api/xbrl/companyfacts/`
- **Requirements**:
  - User-Agent header: `open-fin-terminal contact@example.com`
  - Rate limit: 10 requests/second
  - Respect robots.txt
- **Coverage**: DES (Description), FA (Financial Analysis), 10-K/10-Q filings

```typescript
export class SecEdgarAdapter implements DataAdapter {
  readonly name = 'sec-edgar';
  readonly type = 'built-in';
  readonly requiresSetup = false;
  
  async getFundamentals(symbol: string): Promise<Fundamentals> {
    const cik = await this.lookupCik(symbol);
    const response = await fetch(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`,
      { headers: { 'User-Agent': 'open-fin-terminal contact@example.com' } }
    );
    return this.parseEdgarData(await response.json());
  }
}
```

#### 2. Yahoo Finance Adapter
- **Data**: Historical prices, quotes, dividends, splits
- **Access**: Public CSV/JSON endpoints (delayed 15min)
- **Endpoints**: `query1.finance.yahoo.com`, `query2.finance.yahoo.com`
- **Requirements**:
  - No API key required
  - Rate limit: ~2000 requests/hour
  - User-Agent recommended
- **Coverage**: GP (Graph Price), SPLC (Splits), DVD (Dividends)

#### 3. US Treasury Adapter
- **Data**: Yield curves, auction data, bond prices
- **Access**: Treasury.gov APIs
- **Endpoint**: `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/`
- **Requirements**: None (public data)
- **Coverage**: YAS (Yield Analysis), government bond functions

#### 4. ECB SDW Adapter
- **Data**: Economic indicators, FX rates, monetary policy data
- **Access**: ECB Statistical Data Warehouse API
- **Endpoint**: `https://sdw-wsrest.ecb.europa.eu/service/`
- **Requirements**: None (public data)
- **Coverage**: ECO (Economy), FX rates, central bank data

#### 5. Frankfurter Adapter
- **Data**: Foreign exchange rates (ECB-sourced)
- **Access**: Free API, no authentication
- **Endpoint**: `https://api.frankfurter.app/`
- **Requirements**: None
- **Coverage**: FX (Foreign Exchange), currency conversion

#### 6. Cryptocurrency Public APIs
- **Data**: Spot prices, trades, order books
- **Access**: Public WebSocket and REST endpoints
- **Providers**: Binance, Coinbase, Kraken (public data only)
- **Requirements**: None (no API keys for public data)
- **Coverage**: Crypto price functions

**Implementation Priority**:
1. Yahoo Finance (most comprehensive for equities)
2. SEC EDGAR (fundamentals and filings)
3. US Treasury (fixed income)
4. ECB SDW (economic data)
5. Frankfurter (FX)
6. Crypto APIs (cryptocurrency)

### Phase 8: Optional Authenticated Adapters

**Goal**: Provide direct TypeScript adapters for premium providers

**Planned Adapters** (packages/adapters-opt/):

#### IEX Cloud Adapter
- Requires: IEX Cloud API key (free tier available)
- Provides: Real-time US equity data
- Setup: `EXPORT IEX_API_KEY=pk_xxx`

#### Polygon.io Adapter  
- Requires: Polygon.io API key (paid)
- Provides: Real-time market data, options, forex
- Setup: `EXPORT POLYGON_API_KEY=xxx`

#### Alpha Vantage Adapter
- Requires: Alpha Vantage API key (free tier available)
- Provides: Global equity data, forex, crypto
- Setup: `EXPORT ALPHA_VANTAGE_API_KEY=xxx`

#### FRED Adapter
- Requires: FRED API key (free)
- Provides: Federal Reserve economic data
- Setup: `EXPORT FRED_API_KEY=xxx`

#### OpenBB Platform Adapter
- Requires: Python + OpenBB Platform + running server
- Provides: 100+ providers through unified interface
- Setup: `pip install openbb && openbb-api`
- **Status**: Client SDK implemented in Phase 2

## Adapter Selection Logic

### Startup Sequence

```typescript
// 1. Initialize adapter registry
const registry = new AdapterRegistry();

// 2. Register built-in adapters (always available)
registry.register(new YahooFinanceAdapter());
registry.register(new SecEdgarAdapter());
registry.register(new TreasuryAdapter());
registry.register(new EcbSdwAdapter());
registry.register(new FrankfurterAdapter());

// 3. Conditionally register optional adapters
if (process.env.OPENBB_API_URL) {
  try {
    const openbb = new OpenBBAdapter();
    if (await openbb.healthCheck()) {
      registry.register(openbb);
      console.log('✅ OpenBB Platform available');
    }
  } catch (error) {
    console.log('⚠️  OpenBB Platform unavailable, using built-in adapters');
  }
}

if (process.env.IEX_API_KEY) {
  registry.register(new IexCloudAdapter());
  console.log('✅ IEX Cloud available');
}

// 4. Set fallback chain
registry.setFallbackChain([
  'openbb',        // Try OpenBB first if available
  'iex-cloud',     // Then premium providers
  'polygon',
  'yahoo-finance', // Fall back to free built-ins
  'sec-edgar',
  'treasury',
]);
```

### Per-Request Selection

```typescript
// Example: Get historical prices
async function getHistoricalPrices(symbol: string) {
  const adapter = await registry.getAdapter('historical-prices');
  
  try {
    return await adapter.getHistoricalPrices({ symbol });
  } catch (error) {
    // If preferred adapter fails, try fallback
    const fallback = await registry.getAdapter();
    return await fallback.getHistoricalPrices({ symbol });
  }
}
```

## User Experience

### Zero Setup (Default)

User opens terminal, everything works:
```
✅ Data sources initialized
✅ Using: Yahoo Finance, SEC EDGAR, US Treasury
✅ Terminal ready
```

### With OpenBB (Optional)

User who has OpenBB running:
```
✅ Data sources initialized  
✅ Using: OpenBB Platform (100+ providers available)
✅ Fallback: Yahoo Finance, SEC EDGAR, US Treasury
✅ Terminal ready
```

### With OpenBB Unavailable

User had OpenBB but server stopped:
```
⚠️  OpenBB Platform unavailable (is the server running?)
✅ Using: Yahoo Finance, SEC EDGAR, US Treasury
✅ Terminal ready
```

### Setup Instructions

For users who want enhanced data:

```markdown
## Optional: Add Enhanced Data Sources

### OpenBB Platform (100+ Providers)

1. Install Python 3.8+
2. Install OpenBB: `pip install openbb`
3. Start server: `openbb-api`
4. Restart terminal - OpenBB will be detected automatically

### IEX Cloud (Real-time US Equities)

1. Sign up at https://iexcloud.io (free tier available)
2. Get API key
3. Set environment variable: `EXPORT IEX_API_KEY=pk_xxx`
4. Restart terminal
```

## Testing Strategy

### Built-in Adapters
- Unit tests with recorded fixtures (no live API calls)
- Integration tests with rate limiting
- Compliance verification (ToS, robots.txt, rate limits)

### Optional Adapters
- Unit tests with mocks
- Integration tests only with user-provided credentials
- Health check tests for graceful degradation

### Adapter Registry
- Test fallback logic
- Test adapter selection
- Test health checks
- Test capability discovery

## Compliance Requirements

### All Adapters Must:
1. ✅ Use only official APIs (no scraping)
2. ✅ Respect rate limits
3. ✅ Set appropriate User-Agent
4. ✅ Honor robots.txt
5. ✅ Implement exponential backoff
6. ✅ Cache responses appropriately
7. ✅ Document ToS compliance

### Built-in Adapters Additionally Must:
1. ✅ Work without authentication
2. ✅ Work in browser environment
3. ✅ Handle CORS appropriately
4. ✅ Be deployable to static hosting

## Monitoring and Observability

```typescript
// Adapter health monitoring
export interface AdapterHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  latency: number;
  successRate: number;
  lastChecked: Date;
}

// UI displays adapter status
function AdapterStatusPanel() {
  const adapters = useAdapterHealth();
  
  return (
    <div>
      {adapters.map(adapter => (
        <div key={adapter.name}>
          <StatusIcon status={adapter.status} />
          {adapter.name}
          {adapter.status === 'degraded' && (
            <Tooltip>Experiencing issues, using fallback</Tooltip>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Summary

The adapter strategy ensures:
- ✅ Terminal always works with zero setup
- ✅ Static deployment remains viable
- ✅ Optional enhancements are clearly marked
- ✅ Graceful degradation when enhancements unavailable
- ✅ Users can progressively add capabilities
- ✅ All adapters follow compliance requirements

This maintains the "100% free, no-account-required" promise while providing a clear path for users who want enhanced functionality.
