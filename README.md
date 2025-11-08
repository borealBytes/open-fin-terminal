# Open Financial Terminal

> An open-source, web-based financial analysis terminal approximating Bloomberg Terminal functionality using 100% free, no-account-required data sources by default.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![CI](https://github.com/borealBytes/open-fin-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/borealBytes/open-fin-terminal/actions/workflows/ci.yml)

## 📰 Current Status

**✅ Phase 1 Complete** - Foundation established with:
- Monorepo infrastructure (Turborepo + pnpm)
- Next.js 14 web application with static export
- CI/CD with GitHub Actions and Pages
- Comprehensive documentation
- Example packages with TypeScript types
- **Live Preview**: https://borealbytes.github.io/open-fin-terminal/

**✅ Phase 2 Complete** - Core package infrastructure:
- ✅ Data adapter interface (`@open-fin-terminal/adapters`)
- ✅ Enhanced shared types (Quote, HistoricalPrice, Fundamentals)
- ✅ AdapterRegistry with fallback logic
- ✅ UI component library (Button, Input, Card, Spinner)
- ✅ Web Worker runtime (WorkerManager, WorkerPool)
- ✅ Optional OpenBB Platform client
- ✅ Comprehensive architecture documentation

**✅ Phase 3 Part 1 Complete** - Equity data adapters (PR #7 merged Nov 8, 2025):
- ✅ SEC EDGAR adapter (company fundamentals from 10-K/10-Q filings)
- ✅ Yahoo Finance adapter (delayed quotes 15-20 min, historical OHLCV)
- ✅ Stooq adapter (CSV fallback for historical data)
- ✅ Shared utilities (rate limiter, cache, validators)
- **Result**: 5,000+ LOC, 150+ tests, ≥85% coverage
- **Feature Coverage**: Increased from 60% → ~70% (free tier)

**🚧 Phase 3 Parts 2-3 Planned** - Macro and crypto adapters:
- 📋 PR #8: Macro adapters (Treasury, ECB, IMF, World Bank, OECD) - **Next Up**
- 📋 PR #9: Crypto adapters (Binance, Coinbase, Kraken) + integration
- **Target**: ~85% free tier feature coverage
- **Timeline**: 2-3 weeks (per [Phase 3 Workplan](./docs/PHASE3_WORKPLAN.md))

## 🎯 Project Goals

- **100% Free Data**: Use only free, no-account-required data sources by default
- **Open Source**: MIT licensed, community-driven development
- **Bloomberg-Like UX**: Terminal-style interface with command palette, function codes, keyboard-first navigation
- **Extensible**: Plugin system for data adapters and custom analytics
- **Compliant**: Respect all ToS, rate limits, and robots.txt
- **Accessible**: WCAG 2.1 AA compliant, keyboard navigable
- **Production-Grade**: TypeScript-first, comprehensive testing, CI/CD

## 🏛️ Architecture

This is a TypeScript-first Turborepo monorepo using pnpm workspaces:

```
open-fin-terminal/
├── apps/
│   ├── web/              # ✅ Next.js 14 App Router (static export for GitHub Pages)
│   └── server/           # 🚧 Optional Node.js server for self-hosting (Phase 9)
├── packages/
│   ├── shared/           # ✅ Domain types, schemas, utilities
│   ├── adapters/         # ✅ Adapter interface definitions (Phase 2 Complete)
│   ├── adapters-oss/     # 🚧 Default no-account data adapters (Phase 3 - Part 1 Complete)
│   ├── adapters-opt/     # 🚧 Optional credentialed adapters (Phase 8)
│   ├── openbb-client/    # ✅ Optional OpenBB Platform integration
│   ├── analytics/        # 🚧 Function engine (Phase 5)
│   ├── ui/               # ✅ Shared UI components (Phase 2 Complete)
│   ├── workers/          # ✅ Web workers for analytics (Phase 2 Complete)
│   └── docs/             # ✅ Documentation content
└── .github/workflows/  # ✅ CI/CD automation

✅ = Implemented  🚧 = Planned/In Progress
```

## 🚀 Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+

# Clone the repository
git clone https://github.com/borealBytes/open-fin-terminal.git
cd open-fin-terminal

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### Or View the Live Preview

No installation required: https://borealbytes.github.io/open-fin-terminal/

## 📊 Feature Coverage Summary

| Category | Bloomberg Functions | Free Parity | With Optional |
|----------|---------------------|-------------|---------------|
| **US Equities** | DES, GP, FA, CN, DVD, EQS, RV | 80% | 95% |
| **Options** | OMON, OVME, OVDV, SKEW | 30% | 80% |
| **Fixed Income** | YAS, BTMM, GC, DDIS | 50% | 70% |
| **FX** | FX, FXIP, FXFWD | 70% | 85% |
| **Crypto** | Spot, Volume, Trades | 90% | 95% |
| **Macro** | ECO, ECST, FED | 80% | 90% |
| **Portfolio** | PORT, PRTU, PMEN | 90% | 95% |
| **Charting** | GP, HS, Indicators | 70% | 90% |
| **News** | CN, TOP, N | 40% | 60% |
| **Overall** | **43+ functions** | **~70%** | **~85%** |

> **Current**: ~70% free tier coverage (Phase 3 Part 1 complete)  
> **Target**: ~85% free tier coverage (after Phase 3 Parts 2-3)

See [feature-coverage-matrix.csv](./packages/docs/feature-coverage-matrix.csv) for detailed mapping.

## 📊 Data Sources

### 🆓 Built-in Free Sources (No Setup Required)

These adapters work out-of-the-box with no additional software, accounts, or API keys required:

**Equities & ETFs**
- OHLCV (Delayed 15-20 min): Yahoo Finance
- Historical Data: Yahoo Finance, Stooq (CSV fallback)
- Fundamentals: SEC EDGAR (company facts JSON from 10-K/10-Q filings)

**Fixed Income** (Planned - Phase 3 Part 2)
- Sovereign Curves: U.S. Treasury yield curve APIs
- Auctions: U.S. Treasury auction data

**Macroeconomic** (Planned - Phase 3 Part 2)
- Time Series: ECB SDW, IMF, World Bank, OECD
- Calendars: Central bank release calendars

**Foreign Exchange** (Planned)
- Rates: Frankfurter.app (ECB reference rates)

**Cryptocurrency** (Planned - Phase 3 Part 3)
- Spot/Trades: Binance, Coinbase, Kraken public APIs

**News & Filings**
- Filings: SEC EDGAR RSS feeds
- News: Public RSS feeds (where permitted)

> **Status**: Phase 3 Part 1 **complete** (PR #7 merged Nov 8). Equity adapters (SEC EDGAR, Yahoo Finance, Stooq) are production-ready with 150+ tests and ≥85% coverage. See `packages/adapters-oss/` for implementations.

### 🔌 Optional Enhanced Adapters (Require Setup)

For advanced users who want enhanced data coverage and additional providers:

#### OpenBB Platform Integration

The `@open-fin-terminal/openbb-client` package provides optional integration with [OpenBB Platform](https://openbb.co/), enabling access to 100+ financial data providers through a unified TypeScript SDK.

**Benefits:**
- Access to premium providers (with your own API keys): Polygon, Alpha Vantage, IEX Cloud, FRED, and more
- Unified API for multiple data sources
- Advanced analytics and data transformations
- WebSocket support for real-time streaming

**Requirements:**
- Python 3.8+ installed locally
- OpenBB Platform: `pip install openbb`
- Running OpenBB API server: `openbb-api` (serves at http://127.0.0.1:6900)

**Usage:**

```typescript
import { OpenBBClient } from '@open-fin-terminal/openbb-client';

// Only works if OpenBB server is running
const client = new OpenBBClient({
  baseUrl: 'http://127.0.0.1:6900',
});

const data = await client.equity.price.historical({
  symbol: 'AAPL',
  provider: 'polygon', // Requires your Polygon API key configured in OpenBB
});
```

**Setup Documentation**: See [`packages/openbb-client/README.md`](./packages/openbb-client/README.md)

> **Note**: OpenBB integration is **completely optional**. The terminal will work perfectly with free built-in adapters. This is provided for power users who want to leverage existing OpenBB Platform setups.

#### Other Optional Adapters (Planned - Phase 8)
- IEX Cloud (direct TypeScript adapter)
- Alpha Vantage (direct TypeScript adapter)
- Polygon.io (direct TypeScript adapter)
- FRED (Federal Reserve data, requires free API key)
- Trading Economics

See `packages/adapters-opt/` for planned implementations.

## 🎨 Terminal Features (Planned)

- **Command Palette**: Function codes with GO semantics (e.g., `AAPL <GO>`, `DES <GO>`)
- **Multi-Panel Workspaces**: Customizable layouts, saved to IndexedDB
- **Watchlists**: Track symbols across asset classes
- **Charts**: High-performance canvas/WebGL with 50+ technical indicators
- **Analytics**: Options pricing (Black-Scholes), portfolio metrics (VaR, factor exposures)
- **Keyboard-First**: All features accessible via keyboard
- **Dark Theme**: Default dark theme, high contrast mode
- **Offline Support**: Service Worker caching, IndexedDB storage

## 🔌 Plugin System (Phase 6)

Extend functionality with plugins:
- **Data Adapters**: Add new data sources
- **Analytics**: Custom studies and indicators
- **Sandboxed**: Runs in Web Workers with limited permissions

## 🧪 Testing

- **Unit Tests**: Vitest with TypeScript
- **Integration Tests**: Playwright
- **Coverage Target**: ≥85%
- **E2E**: Critical user flows
- **A11y**: axe/pa11y checks in CI
- **Performance**: Lighthouse CI budgets

## 📦 Deployment

### Static (GitHub Pages) ✅
- Automatic deployment from `main` branch
- Client-only OSS data sources
- No server required
- **Live**: https://borealbytes.github.io/open-fin-terminal/

### Self-Hosted (Docker Compose) - Phase 9
- Optional Node.js server for:
  - Additional adapters
  - Caching layer (Redis)
  - Rate limit resilience
  - Optional authenticated providers

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development workflow
- Coding standards
- Testing requirements
- Data source compliance checklist
- Pull request process

## 📚 Documentation

- [Adapter Strategy](./docs/ADAPTER_STRATEGY.md) ✅
- [Architecture Details](./packages/docs/architecture.md) ✅
- [Phase 3 Workplan](./docs/PHASE3_WORKPLAN.md) ✅
- [Feature Coverage Matrix](./packages/docs/feature-coverage-matrix.csv) ✅
- [Gap Analysis](./packages/docs/gap-analysis.md) ✅
- [Architectural Decisions](./DECISIONS.md) ✅
- [Data Source Catalog](./packages/docs/data-source-catalog.md) (Planned - Phase 3 Part 3)
- [OpenBB Integration Guide](./packages/openbb-client/README.md) ✅
- [Contributing Guide](./CONTRIBUTING.md) ✅
- [Security Policy](./SECURITY.md) ✅
- [Support Resources](./SUPPORT.md) ✅

## 🗺️ Roadmap

- [x] **Phase 1**: Core terminal UI foundation and repository infrastructure ✅
- [x] **Phase 2**: Core packages (adapters interface, UI components, workers, OpenBB client) ✅
- [ ] **Phase 3**: Default OSS data adapters
  - [x] **Part 1**: Equity adapters (SEC EDGAR, Yahoo Finance, Stooq) ✅ **MERGED Nov 8, 2025**
  - [ ] **Part 2**: Macro adapters (Treasury, ECB, IMF, World Bank, OECD) 📋 **Next up**
  - [ ] **Part 3**: Crypto adapters (Binance, Coinbase, Kraken) + integration 📋
- [ ] **Phase 4**: Web application enhancement (command palette, workspaces)
- [ ] **Phase 5**: Analytics engine (technicals, options, portfolio)
- [ ] **Phase 6**: Charts and visualizations (uPlot, indicators)
- [ ] **Phase 7**: Testing and quality assurance (coverage, E2E, a11y)
- [ ] **Phase 8**: Optional authenticated data adapters (direct TypeScript implementations)
- [ ] **Phase 9**: Self-hosted server option with Redis caching

### Recent Updates

- [PR #1](https://github.com/borealBytes/open-fin-terminal/pull/1) - Phase 1 completion ✅
- [PR #2](https://github.com/borealBytes/open-fin-terminal/pull/2) - OpenBB client integration ✅
- [PR #4](https://github.com/borealBytes/open-fin-terminal/pull/4) - Phase 2 Part 1 (adapter interfaces) ✅
- [PR #5](https://github.com/borealBytes/open-fin-terminal/pull/5) - Phase 2 Part 2 (UI components, workers) ✅
- [PR #7](https://github.com/borealBytes/open-fin-terminal/pull/7) - Phase 3 Part 1 (equity adapters) ✅ **MERGED Nov 8, 2025**
- [PR #12](https://github.com/borealBytes/open-fin-terminal/pull/12) - Tracking infrastructure (in progress) 🚧
- [Issue #3](https://github.com/borealBytes/open-fin-terminal/issues/3) - Phase 2 tracking (CLOSED - Complete)
- [Issue #6](https://github.com/borealBytes/open-fin-terminal/issues/6) - Phase 3 tracking (Part 1 Complete)
- [Issue #11](https://github.com/borealBytes/open-fin-terminal/issues/11) - Project status and next steps ✅

## 📝 License

MIT License - see [LICENSE](./LICENSE) for details.

## ⚖️ Legal & Compliance

- **No Proprietary Data**: Uses only publicly available data sources
- **ToS Compliant**: Respects all terms of service, rate limits, robots.txt
- **No Scraping**: Uses only official APIs and permitted access methods
- **Privacy**: No user tracking, no data collection
- **Security**: Strict CSP, no eval, encrypted credential storage

See [gap-analysis.md](./packages/docs/gap-analysis.md) for detailed parity assessment.

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 📞 Support

See [SUPPORT.md](./SUPPORT.md) for community resources.

## 🙏 Acknowledgments

This project would not be possible without:
- SEC EDGAR for financial statements and filings
- ECB, IMF, World Bank, OECD for macroeconomic data
- NASDAQ Trader for symbol directories
- Frankfurter.app for FX data
- Stooq for historical price data
- OpenBB Platform for optional enhanced data access
- All open-source contributors

---

**Disclaimer**: This is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Bloomberg L.P., OpenBB, or any of its affiliates. Bloomberg Terminal® is a registered trademark of Bloomberg Finance L.P.
