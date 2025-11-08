# Architectural Decision Log

This document captures key architectural and strategic decisions made during the development of the Open Financial Terminal project. Each decision includes context, the decision made, rationale, trade-offs, and current status.

---

## Table of Contents

1. [Monorepo with Turborepo](#decision-1-monorepo-with-turborepo)
2. [Static-First Deployment](#decision-2-static-first-deployment)
3. [Free Data First](#decision-3-free-data-first)
4. [Adapter Pattern with Registry](#decision-4-adapter-pattern-with-registry)
5. [Fixture-Based Testing](#decision-5-fixture-based-testing)
6. [Phase 3 Before Phase 4](#decision-6-phase-3-before-phase-4)

---

## Decision 1: Monorepo with Turborepo

**Date**: 2025-11-07 (Phase 1)

**Status**: ✅ Implemented and validated

### Context

The Open Financial Terminal project requires managing multiple packages:
- Web application (`apps/web`)
- Core packages (`packages/shared`, `packages/adapters`, `packages/ui`, `packages/workers`)
- Data adapter implementations (`packages/adapters-oss/*`, future `packages/adapters-opt/*`)
- Optional integrations (`packages/openbb-client`)
- Documentation (`packages/docs`)

Options considered:
1. Monorepo with Turborepo + pnpm workspaces
2. Polyrepo (separate repositories)
3. Monorepo with Nx
4. Monorepo with Lerna

### Decision

Use **Turborepo + pnpm workspaces** for monorepo management.

### Rationale

**Pros:**
- Excellent developer experience with fast, cached builds
- Native support for pnpm workspaces
- Simple configuration with `turbo.json`
- Parallel task execution
- Incremental builds save time
- Strong TypeScript project references support
- Growing community and Vercel backing

**Trade-offs:**
- Learning curve for developers unfamiliar with monorepos
- Additional tooling complexity vs. single package
- Requires discipline in defining package boundaries

**Alternatives considered:**
- **Polyrepo**: Rejected due to coordination overhead, dependency hell, and CI complexity
- **Nx**: More features but heavier and more opinionated
- **Lerna**: Less actively maintained, slower than Turborepo

### Outcome

Working excellently. Build times are fast, caching is effective, and DX is strong. No regrets on this decision.

---

## Decision 2: Static-First Deployment

**Date**: 2025-11-07 (Phase 1)

**Status**: ✅ Implemented and deployed to production

### Context

The application needs to be deployed and accessible to users. Deployment options:
1. Static site (GitHub Pages, Vercel, Netlify)
2. Server-side rendering with Node.js server
3. Hybrid (static + serverless functions)
4. Fully server-hosted application

### Decision

Primary deployment via **static export to GitHub Pages**, with optional self-hosted server in Phase 9.

### Rationale

**Pros:**
- **Free hosting**: GitHub Pages costs nothing
- **Simple CI/CD**: Automatic deployment from `main` branch
- **No server maintenance**: No infrastructure to manage
- **Fast CDN delivery**: GitHub's CDN is reliable and fast
- **Works with client-only adapters**: All default OSS adapters are client-side
- **Aligns with project goals**: Free, accessible, no account required

**Trade-offs:**
- Client-side only (no server-side rendering)
- Can't proxy requests to hide API keys (but we don't need this for default sources)
- Limited to static file hosting
- Can't implement rate-limit pooling server-side

**Alternatives considered:**
- **Server-side rendering**: Overkill for this use case, adds deployment complexity
- **Serverless functions**: Would require paid platform or self-hosting

### Outcome

Live site deployed at https://borealbytes.github.io/open-fin-terminal/. Works perfectly for Phase 1-3. Optional self-hosted Node.js server planned for Phase 9 to support:
- Additional data adapters requiring server-side execution
- Rate limit pooling
- Redis caching layer
- WebSocket proxy

---

## Decision 3: Free Data First

**Date**: 2025-11-07 (Phase 1)

**Status**: ✅ Implemented in Phases 1-3

### Context

Data source strategy is core to the project value proposition. Options:
1. Free, no-account data sources by default
2. Require API keys for all sources
3. Mix of free and paid sources
4. Depend entirely on OpenBB Platform

### Decision

Implement **100% free, no-account-required data sources by default**, with optional authenticated adapters in Phase 8.

### Rationale

**Pros:**
- **Accessibility**: Anyone can use immediately, no signup friction
- **Privacy**: No user data collection, no tracking
- **Differentiation**: Unique value proposition vs. competitors
- **Simplicity**: No key management, no auth flows
- **Deployment flexibility**: Works on static sites
- **Aligns with open-source ethos**: Free as in freedom and beer

**Trade-offs:**
- Limited to publicly accessible APIs
- May have rate limits (mitigated with caching and smart routing)
- Some data may be delayed (e.g., 15-20 min quotes)
- Coverage gaps in certain asset classes (options, exotic instruments)

**Target Coverage:**
- Free tier: ~85% Bloomberg Terminal parity
- With optional authenticated adapters (Phase 8): ~90% parity

**Alternative considered:**
- **Require API keys**: Rejected as friction barrier, antithetical to project goals

### Outcome

Working well. Phase 3 Part 1 achieved ~70% coverage with SEC EDGAR, Yahoo Finance, and Stooq. On track for ~85% with macro and crypto adapters.

Free sources identified:
- **Equities**: SEC EDGAR (fundamentals), Yahoo Finance (quotes, historical), Stooq (fallback)
- **Macro**: U.S. Treasury, ECB SDW, IMF, World Bank, OECD
- **Crypto**: Binance, Coinbase, Kraken (public APIs)
- **FX**: Frankfurter.app (ECB reference rates)

---

## Decision 4: Adapter Pattern with Registry

**Date**: 2025-11-08 (Phase 2)

**Status**: ✅ Implemented and validated in Phase 3 Part 1

### Context

The application needs a way to abstract data source access, support fallback logic, and enable pluggability. Options:
1. Direct API calls scattered throughout application code
2. Service layer with hardcoded data sources
3. Adapter pattern with interface and registry
4. Plugin system with dynamic loading

### Decision

Implement **DataAdapter interface with AdapterRegistry** for centralized adapter management.

### Rationale

**Pros:**
- **Abstraction**: Application code doesn't know about specific APIs
- **Testability**: Easy to mock adapters in tests
- **Fallback logic**: Registry can chain adapters (primary → fallback)
- **Health monitoring**: Registry can track adapter health
- **Capability discovery**: Adapters declare what they can do
- **Pluggability**: Easy to add new adapters without changing app code
- **Type safety**: Full TypeScript typing for all adapter methods

**Trade-offs:**
- Additional abstraction layer (but worth it)
- Registry adds some complexity
- Need to design interface carefully upfront

**Implementation details:**
- `DataAdapter` interface in `packages/adapters`
- `AdapterRegistry` with smart routing by asset class
- Each adapter implements: `healthCheck()`, `getCapabilities()`, `getQuote()`, `getHistoricalPrices()`, `getFundamentals()`
- Registry supports fallback chains: `Yahoo Finance → Stooq`

**Alternative considered:**
- **Direct API calls**: Rejected due to lack of abstraction, poor testability, coupling

### Outcome

Working excellently. Phase 3 Part 1 implemented SEC EDGAR, Yahoo Finance, and Stooq adapters using this pattern. Fallback logic validated. All adapters have ≥85% test coverage.

Registry demonstrated in integration tests:
```typescript
const adapter = await registry.getAdapter({ symbol: 'AAPL', capabilities: { quotes: true } });
const quote = await adapter.getQuote({ symbol: 'AAPL' });
```

---

## Decision 5: Fixture-Based Testing

**Date**: 2025-11-08 (Phase 3)

**Status**: ✅ Implemented in Phase 3 Part 1

### Context

Data adapter tests need to be:
- Fast (run in CI without delays)
- Reliable (no flaky network issues)
- Isolated (no live API dependencies)
- Compliant (respect API ToS and rate limits)

Options:
1. Live API calls in all tests
2. Fixture-based unit tests + separate live validation tests
3. Mock everything
4. Record-and-replay HTTP fixtures

### Decision

Use **fixture-based unit tests** with **separate live validation tests** (only in CI, not on every test run).

### Rationale

**Pros:**
- **Speed**: No network calls in unit tests
- **Reliability**: Tests never fail due to API downtime
- **No rate limit concerns**: Fixtures don't hit APIs
- **ToS compliant**: Dramatically reduces API requests
- **Deterministic**: Same fixture data every time
- **Works offline**: Developers can test without internet

**Trade-offs:**
- Fixtures can drift from real API responses (mitigated by live validation tests)
- Need to update fixtures when APIs change
- Slightly more test setup code

**Implementation:**
- Unit tests use JSON fixtures in `__fixtures__/` directories
- Live validation tests in separate files (`*.live.test.ts`)
- Live tests only run in CI (not locally)
- Comprehensive fixtures cover success, error, edge cases

**Example (SEC EDGAR):**
- 52 unit tests with fixtures
- Fixtures stored in `packages/adapters-oss/sec-edgar/src/__fixtures__/`
- Live API validation tests in separate CI job

**Alternative considered:**
- **Record-and-replay (nock, MSW)**: More complex, harder to maintain

### Outcome

Working great. Phase 3 Part 1 delivered 150+ tests across all adapters, all using fixtures. CI is fast (builds in ~2-3 min). Live validation tests catch API changes. Test coverage ≥85%.

---

## Decision 6: Phase 3 Before Phase 4

**Date**: 2025-11-08 (Current)

**Status**: 🔄 In progress (Phase 3 Part 1 complete, Parts 2-3 planned)

### Context

Project sequencing decision: should we implement data adapters (Phase 3) or Terminal UI (Phase 4) first?

Options:
1. Complete all data adapters (Phase 3), then build UI (Phase 4)
2. Build minimal UI first, add adapters incrementally
3. Parallel development (UI and adapters simultaneously)

### Decision

Complete **Phase 3 (all data adapters) before Phase 4 (Terminal UI)**.

### Rationale

**Pros:**
- **Solid data foundation**: UI can rely on stable, tested adapters
- **No UI churn**: Won't need to refactor UI as new adapters are added
- **Clear separation**: Data layer complete before presentation layer
- **Early validation**: Can verify feature coverage goals before UI work
- **Easier testing**: Can test adapters in isolation
- **Parallel work potential**: Different developers could work on UI while adapters finalize

**Trade-offs:**
- Users can't see progress until Phase 4
- No visual feedback until later
- Requires more up-front planning of adapter interfaces
- Could discover UI needs that affect adapter design (mitigated by thorough planning)

**Alternative considered:**
- **Minimal UI first**: Could have built command palette and one panel, then added adapters. Rejected because it would require multiple UI refactors as adapters evolved.

### Outcome

TBD - Phase 3 Part 1 complete (equity adapters). Parts 2-3 (macro and crypto) planned for next 2 weeks. This approach is working well so far:
- Adapter interfaces are stable
- Test patterns established
- No adapter rework needed
- On track for Phase 4 UI implementation

**Timeline:**
- Week 1 (Nov 8-15): Phase 3 Part 2 (macro adapters)
- Week 2 (Nov 15-22): Phase 3 Part 3 (crypto adapters + integration)
- Week 3-4 (Nov 22-Dec 6): Phase 4 (Terminal UI)
- Target MVP: Early December 2025

---

## Future Decisions

Decisions to be documented as they are made:

- [ ] **Charting library selection** (Phase 6): uPlot vs. Chart.js vs. D3 vs. Plotly
- [ ] **State management approach** (Phase 4): TanStack Query + Zustand vs. Redux vs. Jotai
- [ ] **Analytics engine architecture** (Phase 5): Web Workers vs. WASM vs. GPU.js
- [ ] **E2E testing framework** (Phase 7): Playwright (current) vs. Cypress
- [ ] **Optional adapter strategy** (Phase 8): Direct TypeScript clients vs. OpenBB only
- [ ] **Self-hosted deployment** (Phase 9): Docker Compose vs. Kubernetes vs. single binary

---

## Decision Template

Use this template for future decisions:

```markdown
## Decision N: [Title]

**Date**: YYYY-MM-DD

**Status**: 🔄 Under discussion / ✅ Implemented / ⚠️ Deprecated

### Context

[What is the problem or situation requiring a decision?]

[What options are available?]

### Decision

[What decision was made?]

### Rationale

**Pros:**
- [List advantages]

**Trade-offs:**
- [List disadvantages and accepted trade-offs]

**Alternatives considered:**
- [List alternatives and why they were rejected]

### Outcome

[What happened? Was the decision successful? Any lessons learned?]
```

---

**Last Updated**: 2025-11-08  
**Maintained By**: @borealBytes
