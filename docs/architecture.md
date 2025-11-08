# Open Financial Terminal - Architecture

This document describes the system architecture, design principles, and technical implementation of the Open Financial Terminal.

## Table of Contents

- [Overview](#overview)
- [Design Principles](#design-principles)
- [System Architecture](#system-architecture)
- [Package Structure](#package-structure)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Deployment Models](#deployment-models)

## Overview

Open Financial Terminal is a web-based financial analysis platform approximating Bloomberg Terminal functionality using free, no-account-required data sources. The system is built as a TypeScript monorepo using modern web technologies with a focus on accessibility, performance, and extensibility.

### Key Goals

- **100% Free Data**: Default to free, public data sources
- **Open Source**: MIT licensed, community-driven
- **Bloomberg-Like UX**: Terminal-style interface with command palette
- **Extensible**: Plugin system for adapters and analytics
- **Accessible**: WCAG 2.1 AA compliant
- **Production-Grade**: TypeScript-first, comprehensive testing

## Design Principles

### 1. Separation of Concerns

- **Adapters**: Data source abstraction
- **Analytics**: Business logic in Web Workers
- **UI**: Presentation layer with React
- **Shared**: Common types and utilities

### 2. Type Safety

- Strict TypeScript everywhere
- Runtime validation with Zod at I/O boundaries
- No implicit any
- Discriminated unions for variants

### 3. Progressive Enhancement

- Core functionality works without optional features
- Graceful degradation for unsupported browsers
- Optional data sources enhance but don't block

### 4. Performance

- Heavy computation in Web Workers
- Lazy loading of components
- Efficient caching strategies
- Static site generation for fast initial load

### 5. Accessibility

- Keyboard-first navigation
- ARIA labels and roles
- Screen reader support
- High contrast themes

## System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph Browser[" Browser Environment"]
        subgraph NextApp["Next.js Application"]
            UI["UI Layer<br/>Command Palette<br/>Workspaces<br/>Charts"]
            Components["UI Components<br/>Button, Input<br/>Card, Spinner"]
            Registry["Adapter Registry<br/>SEC EDGAR<br/>Yahoo Finance<br/>Crypto Exchanges"]
        end
        
        subgraph Workers["Web Workers"]
            Analytics["Analytics<br/>Technical Indicators<br/>Options Pricing<br/>Portfolio Metrics"]
        end
        
        Storage[("IndexedDB<br/>Watchlists<br/>Workspaces<br/>Settings<br/>Cache")]
    end
    
    DataSources["External Data Sources<br/>SEC EDGAR<br/>Yahoo Finance<br/>Crypto Exchanges<br/>U.S. Treasury<br/>ECB, IMF, World Bank"]
    
    UI --> Components
    UI --> Registry
    UI --> Workers
    Registry -->|HTTPS| DataSources
    UI --> Storage
    Workers --> Storage
    
    style Browser fill:#1a1a1a,stroke:#666,color:#e0e0e0
    style NextApp fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style Workers fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style UI fill:#0066cc,stroke:#004499,color:#fff
    style Components fill:#0066cc,stroke:#004499,color:#fff
    style Registry fill:#0066cc,stroke:#004499,color:#fff
    style Analytics fill:#0066cc,stroke:#004499,color:#fff
    style Storage fill:#4a4a4a,stroke:#666,color:#e0e0e0
    style DataSources fill:#4a4a4a,stroke:#666,color:#e0e0e0
```

### Component Interaction Flow

```mermaid
flowchart LR
    User[" User"] -->|Input| UI[UI Layer]
    UI -->|Request| Adapters[Adapters]
    Adapters -->|Fetch| Data[Data Sources]
    Data -->|Response| Adapters
    Adapters -->|Data| Workers[Workers]
    Workers -->|Results| Charts[Charts]
    Charts -->|Update| UI
    
    style User fill:#0066cc,stroke:#004499,color:#fff
    style UI fill:#0066cc,stroke:#004499,color:#fff
    style Adapters fill:#0066cc,stroke:#004499,color:#fff
    style Data fill:#4a4a4a,stroke:#666,color:#e0e0e0
    style Workers fill:#0066cc,stroke:#004499,color:#fff
    style Charts fill:#0066cc,stroke:#004499,color:#fff
```

## Package Structure

### Monorepo Organization

```mermaid
graph TD
    Root["<b>open-fin-terminal/</b>"]
    
    Apps["<b>apps/</b>"]
    Web["web/<br/><i>Next.js App</i>"]
    Server["server/<br/><i>Optional Node.js</i>"]
    
    Packages["<b>packages/</b>"]
    Shared["shared/<br/><i>Types & Utils</i>"]
    Adapters["adapters/<br/><i>Interfaces</i>"]
    AdaptersOSS["adapters-oss/<br/><i>Free Adapters</i>"]
    AdaptersOpt["adapters-opt/<br/><i>Optional</i>"]
    OpenBB["openbb-client/<br/><i>OpenBB</i>"]
    Analytics["analytics/<br/><i>Functions</i>"]
    UI["ui/<br/><i>Components</i>"]
    Workers["workers/<br/><i>Web Workers</i>"]
    Docs["docs/<br/><i>Documentation</i>"]
    
    Root --> Apps
    Root --> Packages
    
    Apps --> Web
    Apps --> Server
    
    Packages --> Shared
    Packages --> Adapters
    Packages --> AdaptersOSS
    Packages --> AdaptersOpt
    Packages --> OpenBB
    Packages --> Analytics
    Packages --> UI
    Packages --> Workers
    Packages --> Docs
    
    style Root fill:#0066cc,stroke:#004499,color:#fff
    style Apps fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style Packages fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style Web fill:#0066cc,stroke:#004499,color:#fff
    style UI fill:#0066cc,stroke:#004499,color:#fff
    style Workers fill:#0066cc,stroke:#004499,color:#fff
    style Adapters fill:#0066cc,stroke:#004499,color:#fff
    style Shared fill:#0066cc,stroke:#004499,color:#fff
```

### Package Descriptions

#### @open-fin-terminal/shared

**Purpose**: Common types, schemas, and utilities used across packages.

**Responsibilities**:
- Type definitions (Symbol, OHLCV, Quote, Fundamentals)
- Zod validation schemas
- Common constants
- Utility functions

**Dependencies**: zod

#### @open-fin-terminal/adapters

**Purpose**: Data adapter interface and registry for managing multiple data sources.

**Responsibilities**:
- DataAdapter interface definition
- AdapterRegistry with fallback logic
- Health checking and capability discovery
- Metadata tracking

**Dependencies**: @open-fin-terminal/shared, zod

#### @open-fin-terminal/ui

**Purpose**: Accessible, keyboard-navigable UI component library.

**Responsibilities**:
- Base components (Button, Input, Card, Spinner)
- Dark theme styling
- ARIA attributes and accessibility
- TypeScript prop types

**Dependencies**: react, react-dom

#### @open-fin-terminal/workers

**Purpose**: Web Worker runtime for offloading heavy computations.

**Responsibilities**:
- WorkerManager for lifecycle management
- WorkerPool for parallel task execution
- Comlink integration for type-safe messaging
- Example analytics workers

**Dependencies**: comlink

#### @open-fin-terminal/openbb-client

**Purpose**: Optional OpenBB Platform integration (requires local server).

**Responsibilities**:
- TypeScript SDK for OpenBB Platform REST API
- Retry logic and error handling
- WebSocket client for real-time data
- Bloomberg function mapping

**Dependencies**: zod
**Optional**: Requires Python + OpenBB Platform

#### apps/web

**Purpose**: Main Next.js application with static export.

**Responsibilities**:
- Terminal UI shell
- Command palette
- Multi-panel workspaces
- Routing and navigation
- GitHub Pages deployment

**Dependencies**: Next.js 14, React 18, all @open-fin-terminal packages

## Data Flow

### 1. User Interaction Flow

```mermaid
sequenceDiagram
    actor User
    participant CP as Command Palette
    participant AR as Adapter Registry
    participant DS as Data Source
    participant W as Web Worker
    participant Chart as Chart Component
    
    User->>CP: Enter Command<br/>(e.g., AAPL GP)
    CP->>AR: Request Quote
    AR->>DS: GET /api/quote?symbol=AAPL
    DS-->>AR: Quote Data (JSON)
    AR->>AR: Validate with Zod
    AR->>W: Calculate Indicators
    W->>W: Process Data<br/>(SMA, RSI, etc.)
    W-->>Chart: Results
    Chart->>User: Render Chart
```

### 2. Data Adapter Flow with Fallback

```mermaid
flowchart TD
    Start([Request Quote]) --> Registry[Adapter Registry]
    Registry --> Primary[Primary Adapter<br/>Yahoo Finance]
    Primary -->|Success| Validate[Validate with Zod]
    Primary -->|Error| Fallback1[Fallback Adapter 1<br/>SEC EDGAR]
    Fallback1 -->|Success| Validate
    Fallback1 -->|Error| Fallback2[Fallback Adapter 2<br/>Stooq]
    Fallback2 -->|Success| Validate
    Fallback2 -->|Error| Fail([Return Error])
    Validate --> Success([Return Data])
    
    style Start fill:#0066cc,stroke:#004499,color:#fff
    style Registry fill:#0066cc,stroke:#004499,color:#fff
    style Primary fill:#0066cc,stroke:#004499,color:#fff
    style Fallback1 fill:#0066cc,stroke:#004499,color:#fff
    style Fallback2 fill:#0066cc,stroke:#004499,color:#fff
    style Validate fill:#0066cc,stroke:#004499,color:#fff
    style Success fill:#00aa00,stroke:#007700,color:#fff
    style Fail fill:#cc0000,stroke:#990000,color:#fff
```

### 3. Analytics Worker Flow

```mermaid
sequenceDiagram
    participant MT as Main Thread
    participant WM as WorkerManager
    participant WP as WorkerPool
    participant W1 as Worker 1
    participant W2 as Worker 2
    
    MT->>WP: execute(calculateSMA)
    WP->>WM: getAvailableWorker()
    WM-->>WP: Worker 1 (idle)
    WP->>W1: postMessage(task, data)
    
    MT->>WP: execute(calculateRSI)
    WP->>WM: getAvailableWorker()
    WM-->>WP: Worker 2 (idle)
    WP->>W2: postMessage(task, data)
    
    Note over W1,W2: Heavy computation<br/>in parallel
    
    W1-->>WP: Results (SMA)
    WP-->>MT: Return SMA
    
    W2-->>WP: Results (RSI)
    WP-->>MT: Return RSI
    
    WP->>WM: markIdle(Worker 1)
    WP->>WM: markIdle(Worker 2)
```

## Technology Stack

### Core

- **Language**: TypeScript 5.6 (strict mode)
- **Monorepo**: Turborepo v2 + pnpm workspaces
- **Runtime Validation**: Zod
- **Build**: Next.js (apps), tsc (packages)

### Frontend

- **Framework**: Next.js 14 (App Router, static export)
- **UI Library**: React 18
- **State Management**: TanStack Query v5, Zustand (planned)
- **Forms**: React Hook Form + Zod (planned)
- **Charts**: uPlot (planned)
- **Storage**: IndexedDB (Dexie), Service Worker (Workbox)

### Backend (Optional Self-Hosted)

- **Runtime**: Node.js 20+
- **HTTP**: Native fetch with retry/backoff
- **WebSocket**: Native WebSocket with reconnect
- **Caching**: Redis (optional)
- **Container**: Docker + Docker Compose

### Testing

- **Unit Tests**: Vitest
- **React Testing**: @testing-library/react
- **E2E Tests**: Playwright
- **Coverage**: v8
- **A11y Tests**: axe-core, pa11y

### CI/CD

- **Pipeline**: GitHub Actions
- **Deployment**: GitHub Pages (static)
- **Coverage**: Codecov (planned)
- **Performance**: Lighthouse CI (planned)

## Deployment Models

### Static Deployment (GitHub Pages)

**Current**: ✅ Implemented

```mermaid
flowchart TB
    Browser[" Browser"]
    GHP[" GitHub Pages<br/>(Static HTML/JS/CSS)"]
    APIs[" Public APIs<br/>(CORS-enabled)"]
    
    Browser -->|HTTPS| GHP
    Browser -->|HTTPS<br/>Direct calls| APIs
    
    style Browser fill:#0066cc,stroke:#004499,color:#fff
    style GHP fill:#0066cc,stroke:#004499,color:#fff
    style APIs fill:#4a4a4a,stroke:#666,color:#e0e0e0
```

**Pros**:
- Zero hosting cost
- Automatic CI/CD
- Fast CDN delivery
- Simple deployment

**Cons**:
- CORS limitations
- No server-side logic
- Rate limit per IP

### Self-Hosted (Docker Compose)

**Planned**: Phase 9

```mermaid
flowchart TB
    Browser[" Browser"]
    
    subgraph Docker[" Docker Compose Host"]
        NextJS["Next.js<br/>(SSR)"]
        Redis[("Redis<br/>(Cache)")]
    end
    
    APIs1[" Public APIs"]
    APIs2[" Optional<br/>Auth Sources"]
    
    Browser -->|HTTPS| NextJS
    NextJS <-->|Cache| Redis
    NextJS -->|Proxy| APIs1
    NextJS -->|Proxy<br/>with Auth| APIs2
    
    style Browser fill:#0066cc,stroke:#004499,color:#fff
    style Docker fill:#2d2d2d,stroke:#666,color:#e0e0e0
    style NextJS fill:#0066cc,stroke:#004499,color:#fff
    style Redis fill:#4a4a4a,stroke:#666,color:#e0e0e0
    style APIs1 fill:#4a4a4a,stroke:#666,color:#e0e0e0
    style APIs2 fill:#4a4a4a,stroke:#666,color:#e0e0e0
```

**Pros**:
- No CORS issues
- Server-side caching
- Rate limit pooling
- Optional auth providers

**Cons**:
- Hosting cost
- Maintenance overhead
- Scaling complexity

## Security Considerations

### Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.example.com;
worker-src 'self' blob:;
```

### Data Privacy

- No user tracking
- No data collection
- Local-only storage (IndexedDB)
- No cookies (except essential)

### API Security

- Rate limiting (client-side)
- Exponential backoff
- No API keys in client code
- Optional credentials encrypted in IndexedDB

## Performance Targets

### Lighthouse Scores

- Performance: ≥80
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

### Core Web Vitals

- LCP (Largest Contentful Paint): <2.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1

### Bundle Size

- Initial JS: <200KB (gzipped)
- Per-route chunks: <50KB (gzipped)
- CSS: <20KB (gzipped)

## Future Enhancements

### Phase 3: Data Adapters
- SEC EDGAR adapter
- Yahoo Finance adapter
- Crypto exchange adapters
- Macro data adapters

### Phase 4: Terminal UI
- Command palette with function codes
- Multi-panel workspaces
- Drag-and-drop layout
- Watchlist management

### Phase 5: Analytics
- 50+ technical indicators
- Options pricing models
- Portfolio analytics
- Backtesting framework

### Phase 6: Charting
- uPlot integration
- Indicator overlays
- Drawing tools
- Multi-timeframe support

### Phase 7: Testing & Quality
- E2E test coverage
- Accessibility audit
- Performance optimization
- Lighthouse CI

### Phase 8: Optional Providers
- IEX Cloud adapter
- Polygon.io adapter
- Alpha Vantage adapter
- FRED API adapter

### Phase 9: Self-Hosting
- Node.js server
- Redis caching
- Docker Compose setup
- WebSocket proxy

---

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Comlink (Web Workers)](https://github.com/GoogleChromeLabs/comlink)
- [Zod Validation](https://zod.dev/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Mermaid Diagrams](https://mermaid.js.org/)
