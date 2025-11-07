# Open Financial Terminal

> An open-source, web-based financial analysis terminal approximating Bloomberg Terminal functionality using 100% free, no-account-required data sources by default.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io/)

## 🎯 Project Goals

- **100% Free Data**: Use only free, no-account-required data sources by default
- **Open Source**: MIT licensed, community-driven development
- **Bloomberg-Like UX**: Terminal-style interface with command palette, function codes, keyboard-first navigation
- **Extensible**: Plugin system for data adapters and custom analytics
- **Compliant**: Respect all ToS, rate limits, and robots.txt
- **Accessible**: WCAG 2.1 AA compliant, keyboard navigable
- **Production-Grade**: TypeScript-first, comprehensive testing, CI/CD

## 🏗️ Architecture

This is a TypeScript-first Turborepo monorepo using pnpm workspaces:

```
open-fin-terminal/
├── apps/
│   ├── web/              # Next.js 14 App Router SPA (static export for GitHub Pages)
│   └── server/           # Optional Node.js server for self-hosting
├── packages/
│   ├── adapters/         # Adapter interface definitions & shared utilities
│   ├── adapters-oss/     # Default no-account data adapters
│   ├── adapters-opt/     # Optional credentialed adapters (stubs)
│   ├── analytics/        # Function engine (technicals, options, portfolio, etc.)
│   ├── shared/           # Domain types, schemas, time/calendar utilities
│   ├── ui/               # Shared UI components, accessibility primitives
│   ├── workers/          # Web workers for analytics and parsing
│   └── docs/             # Documentation site content (MDX)
└── scripts/              # Build and deployment scripts
```

## 🚀 Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm 9+

# Install dependencies
pnpm install

# Start development servers
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

## 📊 Data Sources (Default Free Sources)

### Equities & ETFs
- **OHLCV (Delayed)**: Stooq CSV endpoints
- **Listings**: NASDAQ Trader symbol directories
- **Fundamentals**: SEC EDGAR (company facts JSON, XBRL)

### Fixed Income
- **Sovereign Curves**: U.S. Treasury yield curve APIs
- **Auctions**: U.S. Treasury auction data

### Macroeconomic
- **Time Series**: ECB SDW, IMF, World Bank, OECD
- **Calendars**: Central bank release calendars

### Foreign Exchange
- **Rates**: Frankfurter.app (ECB reference rates)

### Cryptocurrency
- **Spot/Trades**: Binance, Coinbase, Kraken public WebSockets

### News & Filings
- **Filings**: SEC EDGAR RSS feeds
- **News**: Public RSS feeds (where permitted)

### Optional (User-Provided Credentials)
- IEX Cloud, Polygon, Alpha Vantage, FRED, Trading Economics
- See `packages/adapters-opt` for stubs

## 🎨 Terminal Features

- **Command Palette**: Function codes with GO semantics (e.g., `AAPL <GO>`, `DES <GO>`)
- **Multi-Panel Workspaces**: Customizable layouts, saved to IndexedDB
- **Watchlists**: Track symbols across asset classes
- **Charts**: High-performance canvas/WebGL with 50+ technical indicators
- **Analytics**: Options pricing (Black-Scholes), portfolio metrics (VaR, factor exposures), screeners
- **Keyboard-First**: All features accessible via keyboard
- **Dark Theme**: Default dark theme, high contrast mode
- **Offline Support**: Service Worker caching, IndexedDB storage

## 🔌 Plugin System

Extend functionality with plugins:
- **Data Adapters**: Add new data sources
- **Analytics**: Custom studies and indicators
- **Sandboxed**: Runs in Web Workers with limited permissions

## 🧪 Testing

- **Unit Tests**: Vitest with ts-vitest
- **Integration Tests**: Playwright
- **Coverage**: ≥85% target
- **E2E**: Critical user flows
- **A11y**: axe/pa11y checks in CI
- **Performance**: Lighthouse CI budgets

## 📦 Deployment

### Static (GitHub Pages)
- Automatic deployment from `main` branch
- Client-only OSS data sources
- No server required

### Self-Hosted (Docker Compose)
- Optional Node.js server for:
  - Additional adapters
  - Caching layer (Redis)
  - Rate limit resilience
  - Optional authenticated providers

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📚 Documentation

- [Architecture](./packages/docs/architecture.md)
- [Feature Coverage Matrix](./packages/docs/feature-coverage-matrix.md)
- [Gap Analysis](./packages/docs/gap-analysis.md)
- [Data Source Catalog](./packages/docs/data-source-catalog.md)
- [Legal & Compliance](./packages/docs/legal-compliance.md)
- [Terminal Workflows](./packages/docs/terminal-workflows.md)

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## ⚖️ Legal & Compliance

- **No Proprietary Data**: Uses only publicly available data sources
- **ToS Compliant**: Respects all terms of service, rate limits, robots.txt
- **No Scraping**: Uses only official APIs and permitted access methods
- **Privacy**: No user tracking, no data collection
- **Security**: Strict CSP, no eval, encrypted credential storage

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## 📞 Support

See [SUPPORT.md](./SUPPORT.md) for community resources.

## 🗺️ Roadmap

- [ ] Phase 1: Core terminal UI and command system
- [ ] Phase 2: Default OSS data adapters
- [ ] Phase 3: Basic analytics engine
- [ ] Phase 4: Charts and visualizations
- [ ] Phase 5: Advanced analytics (options, portfolio)
- [ ] Phase 6: Plugin system
- [ ] Phase 7: Self-hosted server option
- [ ] Phase 8: Mobile responsive design

## 🙏 Acknowledgments

This project would not be possible without:
- SEC EDGAR for financial statements and filings
- ECB, IMF, World Bank, OECD for macroeconomic data
- NASDAQ Trader for symbol directories
- Frankfurter.app for FX data
- Stooq for historical price data
- All open-source contributors

---

**Note**: This is an independent project and is not affiliated with, endorsed by, or sponsored by Bloomberg L.P. or any of its affiliates. Bloomberg Terminal® is a registered trademark of Bloomberg Finance L.P.
