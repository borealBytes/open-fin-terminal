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

**🚧 Active Development** - Currently implementing Phase 2:
- Core package structures
- Data adapter interfaces
- UI component library
- Analytics engine foundation
- Optional enhanced adapter support (OpenBB Platform)

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
│   ├── adapters/         # 🚧 Adapter interface definitions (Phase 2)
│   ├── adapters-oss/     # 🚧 Default no-account data adapters (Phase 3)
│   ├── adapters-opt/     # 🚧 Optional credentialed adapters (Phase 8)
│   ├── openbb-client/    # ✅ Optional OpenBB Platform integration (Phase 2)
│   ├── analytics/        # 🚧 Function engine (Phase 5)
│   ├── ui/               # 🚧 Shared UI components (Phase 2)
│   ├── workers/          # 🚧 Web workers for analytics (Phase 2)
│   └── docs/             # ✅ Documentation content
└── .github/workflows/  # ✅ CI/CD automation

✅ = Implemented  🚧 = Planned
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
| **Overall** | **43+ functions** | **~60%** | **~85%** |

See [feature-coverage-matrix.csv](./packages/docs/feature-coverage-matrix.csv) for detailed mapping.

## 📊 Data Sources

### 🆓 Built-in Free Sources (No Setup Required)

These adapters work out-of-the-box with no additional software, accounts, or API keys required:

**Equities & ETFs**
- OHLCV (Delayed): Stooq CSV endpoints, Yahoo Finance
- Listings: NASDAQ Trader symbol directories
- Fundamentals: SEC EDGAR (company facts JSON, XBRL)

**Fixed Income**
- Sovereign Curves: U.S. Treasury yield curve APIs
- Auctions: U.S. Treasury auction data

**Macroeconomic**
- Time Series: ECB SDW, IMF, World Bank, OECD
- Calendars: Central bank release calendars

**Foreign Exchange**
- Rates: Frankfurter.app (ECB reference rates)

**Cryptocurrency**
- Spot/Trades: Binance, Coinbase, Kraken public WebSockets

**News & Filings**
- Filings: SEC EDGAR RSS feeds
- News: Public RSS feeds (where permitted)

> **Status**: Phase 3 implementation planned. See `packages/adapters-oss/` for TypeScript implementations.

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

- [Architecture Details](./packages/docs/architecture.md) (Coming in Phase 2)
- [Feature Coverage Matrix](./packages/docs/feature-coverage-matrix.csv) ✅
- [Gap Analysis](./packages/docs/gap-analysis.md) ✅
- [Data Source Catalog](./packages/docs/data-source-catalog.md) (Coming in Phase 3)
- [OpenBB Integration Guide](./packages/openbb-client/README.md) ✅
- [Contributing Guide](./CONTRIBUTING.md) ✅
- [Security Policy](./SECURITY.md) ✅
- [Support Resources](./SUPPORT.md) ✅

## 🗺️ Roadmap

- [x] **Phase 1**: Core terminal UI foundation and repository infrastructure ✅
- [ ] **Phase 2**: Core packages (adapters interface, UI components, workers, optional OpenBB client)
- [ ] **Phase 3**: Default OSS data adapters (SEC EDGAR, Stooq, Treasury, etc.) - TypeScript implementations
- [ ] **Phase 4**: Web application enhancement (command palette, workspaces)
- [ ] **Phase 5**: Analytics engine (technicals, options, portfolio)
- [ ] **Phase 6**: Charts and visualizations (uPlot, indicators)
- [ ] **Phase 7**: Testing and quality assurance (coverage, E2E, a11y)
- [ ] **Phase 8**: Optional authenticated data adapters (direct TypeScript implementations)
- [ ] **Phase 9**: Self-hosted server option with Redis caching

See [PR #1](https://github.com/borealBytes/open-fin-terminal/pull/1) for detailed Phase 1 completion.

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
