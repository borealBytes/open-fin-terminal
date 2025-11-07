# Architecture

## Overview

Open Financial Terminal is built as a TypeScript-first monorepo using modern web technologies to create a Bloomberg Terminal-like experience with 100% free, open-source data.

## System Design Principles

### Core Tenets

1. **TypeScript-First**: Strict typing throughout, runtime validation at boundaries
2. **Data Source Agnostic**: Pluggable adapter system with capability discovery
3. **Compliant by Default**: Never circumvent ToS, rate limits, or access controls
4. **Offline-Capable**: Service Worker caching, IndexedDB storage
5. **Accessible**: WCAG 2.1 AA compliant, keyboard-navigable
6. **Performant**: Web Workers for analytics, efficient caching

## Architecture Layers

```
┌────────────────────────────────────────┐
│          Presentation Layer                  │
│    (Next.js, React, UI Components)          │
└────────────────────────────────────────┘
                    │
┌────────────────────────────────────────┐
│        Application Layer                    │
│  (State Management, Command System)        │
└────────────────────────────────────────┘
                    │
┌────────────────────────────────────────┐
│         Analytics Layer                     │
│  (Web Workers, Compute Engine)             │
└────────────────────────────────────────┘
                    │
┌────────────────────────────────────────┐
│          Data Layer                        │
│  (Adapters, Transport, Caching)            │
└────────────────────────────────────────┘
                    │
┌────────────────────────────────────────┐
│       External Data Sources                 │
│  (SEC, ECB, Stooq, Crypto Exchanges)       │
└────────────────────────────────────────┘
```

## Monorepo Structure

### Apps

- **apps/web**: Next.js 14 App Router SPA
  - Static export for GitHub Pages
  - Terminal UI components
  - Command palette and routing
  - Service Worker for offline

- **apps/server** (Optional): Node.js server
  - Adapter runtime for server-side sources
  - Redis caching layer
  - Rate limit pooling
  - WebSocket proxy

### Packages

#### Core Packages

- **packages/shared**: Domain types, schemas, utilities
  - Symbol model (CIK, ticker, ISIN, etc.)
  - Time/calendar utilities
  - Trading calendars
  - Zod schemas for validation
  - Corporate action types

- **packages/ui**: Shared UI components
  - Accessibility primitives
  - Keyboard navigation hooks
  - Command palette
  - Chart components
  - Data tables
  - Dark theme system

#### Data Packages

- **packages/adapters**: Adapter interface
  - Base Adapter interface
  - Capability discovery system
  - Transport abstractions
  - Domain-specific sub-interfaces

- **packages/adapters-oss**: Free adapters
  - SEC EDGAR (XBRL, company facts)
  - Stooq (historical OHLCV)
  - ECB SDW (macro data)
  - Frankfurter (FX rates)
  - U.S. Treasury (yield curves)
  - Binance/Coinbase/Kraken (crypto)
  - NASDAQ Trader (symbol directories)

- **packages/adapters-opt**: Optional adapters (stubs)
  - IEX Cloud
  - Polygon
  - Alpha Vantage
  - FRED
  - Requires user credentials

#### Analytics Packages

- **packages/analytics**: Function engine
  - Technical indicators (50+)
  - Options pricing (Black-Scholes, binomial)
  - Portfolio analytics (VaR, attribution, factor)
  - Yield curve construction
  - Backtesting framework
  - Statistical functions

- **packages/workers**: Web Worker runtime
  - Analytics worker pool
  - Parsing workers (XBRL, CSV)
  - Plugin sandbox
  - Comlink integration

#### Documentation

- **packages/docs**: Documentation site
  - MDX content
  - Feature matrix
  - Data source catalog
  - API references

## Data Flow

### Request Flow

```
User Input
  ↓
Command System (parse, validate)
  ↓
State Manager (Zustand)
  ↓
Data Orchestrator
  │
  ├──> Cache Check (IndexedDB)
  │     │
  │     ├─> Hit: Return cached data
  │     └─> Miss: Continue
  │
  ├──> Capability Discovery (which adapters?)
  │
  ├──> Adapter Selection (fallback chain)
  │
  └──> Transport Layer
        │
        ├─> REST (with retry/backoff)
        ├─> WebSocket (with reconnect)
        └─> CSV Download
              │
              └─> External API
                    │
                    └─> Response
                          │
                          ├─> Validation (zod)
                          │
                          ├─> Transform
                          │
                          ├─> Cache (IndexedDB + Service Worker)
                          │
                          └─> Update UI
```

### Analytics Flow

```
Data Ready
  ↓
Analytics Request
  ↓
Worker Pool Manager
  ↓
Web Worker (via Comlink)
  │
  ├─> Load data
  ├─> Run function
  ├─> Return result
  │
  └─> Main Thread
        └─> Update UI
```

## Adapter System

### Adapter Interface

```typescript
interface Adapter {
  // Metadata
  id: string
  name: string
  description: string
  requiresAuth: boolean
  
  // Capabilities
  capabilities: Capabilities
  
  // Lifecycle
  initialize(): Promise<void>
  destroy(): Promise<void>
  
  // Health
  isHealthy(): boolean
  getStats(): AdapterStats
}

interface Capabilities {
  equities?: EquitiesCapability
  options?: OptionsCapability
  fixedIncome?: FixedIncomeCapability
  fx?: FXCapability
  crypto?: CryptoCapability
  macro?: MacroCapability
  news?: NewsCapability
}
```

### Capability Discovery

At runtime, the system:
1. Queries all adapters for capabilities
2. Builds capability graph per domain
3. UI shows/hides features based on available capabilities
4. Displays source badges (e.g., "Data: SEC EDGAR")

### Fallback Chain

For each domain:
1. Primary adapter (usually OSS)
2. Secondary adapters (if available)
3. Tertiary (optional auth adapters)
4. Graceful degradation (show "N/A" if unavailable)

## Transport Layer

### REST Transport

```typescript
interface RESTTransport {
  request<T>(config: RequestConfig): Promise<T>
}

// Features:
// - Retry with exponential backoff + jitter
// - Respect 429 Retry-After headers
// - ETag / If-Modified-Since support
// - Timeout handling
// - User-Agent injection
// - Response validation (zod)
```

### WebSocket Transport

```typescript
interface WSTransport {
  connect(url: string): Promise<void>
  subscribe(channel: string): void
  unsubscribe(channel: string): void
  on(event: string, handler: Function): void
}

// Features:
// - Auto-reconnect with backoff
// - Heartbeat/ping-pong
// - Subscription management
// - Message validation
// - Rate limit throttling
```

## Data Model

### Symbol Model

```typescript
interface Symbol {
  // Identifiers
  ticker: string
  cik?: string          // SEC CIK
  isin?: string         // User-provided
  cusip?: string        // User-provided
  
  // Metadata
  name: string
  assetType: 'equity' | 'etf' | 'option' | 'bond' | 'fx' | 'crypto' | 'future'
  exchange: string
  currency: string
  
  // Classification
  sector?: string
  industry?: string
  sic?: string
  naics?: string
}
```

### Time Series

```typescript
interface TimeSeries<T> {
  symbol: Symbol
  data: TimeSeriesPoint<T>[]
  frequency: 'tick' | '1m' | '5m' | '1h' | '1d' | '1w' | '1mo'
  timezone: string
  adjustedFor: ('splits' | 'dividends')[]
}

interface TimeSeriesPoint<T> {
  timestamp: Date
  value: T
}
```

### OHLCV

```typescript
interface OHLCV {
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number  // Split/dividend adjusted
}
```

## Analytics Engine

### Function Registry

```typescript
interface FunctionRegistry {
  register(fn: AnalyticsFunction): void
  get(name: string): AnalyticsFunction | undefined
  list(): AnalyticsFunction[]
}

interface AnalyticsFunction {
  name: string
  description: string
  inputs: InputSchema
  output: OutputSchema
  execute(inputs: any): Promise<any>
  workerCompatible: boolean
}
```

### Technical Indicators

- SMA, EMA, WMA
- MACD, RSI, Stochastic
- Bollinger Bands, ATR
- Ichimoku Cloud
- Volume indicators
- Custom formulas

### Options Analytics

- Black-Scholes pricing
- Binomial tree
- Greeks (delta, gamma, theta, vega, rho)
- Implied volatility (Newton-Raphson)
- Volatility surface construction
- Payoff diagrams

### Portfolio Analytics

- Returns (simple, log, excess)
- Risk metrics (volatility, VaR, CVaR, max drawdown)
- Factor exposures (regression vs benchmarks)
- Performance attribution
- Correlation/covariance matrices
- Sharpe, Sortino, Calmar ratios

## UI Architecture

### Command System

```typescript
interface Command {
  code: string          // e.g., "DES", "GP"
  args: string[]        // e.g., ["AAPL"]
  execute(): void
}

// User types: AAPL DES <GO>
// Parsed to: { code: "DES", args: ["AAPL"] }
```

### Function Codes

Analogous to Bloomberg:
- `DES` - Description/Overview
- `GP` - Price Graph
- `FA` - Financials (fundamentals)
- `CN` - Company News
- `OMON` - Options Monitor
- `FX` - Foreign Exchange
- `WEI` - World Equity Indices
- `ECO` - Economic Calendar
- `PORT` - Portfolio Analytics

### Multi-Panel Workspace

- Drag-and-drop panels
- Save/load layouts (IndexedDB)
- Keyboard shortcuts for layout
- Per-panel history and state

### Accessibility

- Full keyboard navigation
- Screen reader support (ARIA)
- High contrast mode
- Focus management
- Skip links
- Semantic HTML

## Caching Strategy

### Three-Tier Cache

1. **Memory Cache** (Zustand)
   - Hot data (current symbols)
   - TTL: 1-5 minutes

2. **IndexedDB** (Dexie)
   - Time series
   - Fundamentals
   - TTL: 1 hour to 1 day

3. **Service Worker** (Workbox)
   - Static assets
   - API responses
   - Stale-while-revalidate

### Cache Invalidation

- TTL-based expiry
- ETag-based validation
- Manual refresh (user action)
- Smart invalidation (corporate actions)

## Security

### Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
connect-src 'self' data.sec.gov api.frankfurter.dev ...;
worker-src 'self' blob:;
img-src 'self' data: https:;
```

### Credential Storage

- **Browser**: Secure storage API (encrypted)
- **Server**: Encrypted vault (Redis/DB with encryption)
- Never log secrets
- Redact in errors and traces

## Deployment Modes

### Static (GitHub Pages)

- Next.js static export
- Client-side data fetching
- Service Worker caching
- No server required
- OSS data sources only (CORS-friendly)

### Self-Hosted (Docker Compose)

```yaml
services:
  web:
    image: open-fin-terminal-web
  server:
    image: open-fin-terminal-server
    environment:
      - REDIS_URL=redis://redis:6379
  redis:
    image: redis:7-alpine
```

Benefits:
- Optional authenticated adapters
- Server-side caching (Redis)
- Rate limit pooling
- WebSocket proxy

## Performance

### Optimization Strategies

- Code splitting per route
- Lazy loading of charts and analytics
- Virtual scrolling for large lists
- Web Workers for heavy compute
- OffscreenCanvas for charts
- Debounced inputs
- Request deduplication

### Targets

- Lighthouse Performance: ≥80
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Total Blocking Time: <300ms

## Testing Strategy

### Unit Tests (Vitest)

- All functions and utilities
- Component logic
- Coverage: ≥85%

### Integration Tests

- Adapter contracts
- Recorded fixtures
- No real API calls

### E2E Tests (Playwright)

- Critical user flows
- Command palette
- Chart interactions
- Data fetching

### Accessibility Tests

- axe-core in CI
- Keyboard nav
- Screen reader compat

## Future Considerations

- Mobile responsive design
- Collaborative workspaces
- Real-time collaboration
- Advanced ML/AI features
- Custom indicator marketplace
- Desktop app (Electron/Tauri)
