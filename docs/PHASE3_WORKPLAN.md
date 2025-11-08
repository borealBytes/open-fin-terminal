# Phase 3 Implementation Workplan

## Overview

**Phase 3** implements built-in free data adapters to provide actual financial data to the terminal. This phase follows Phase 2 (infrastructure) and unblocks Phases 4-5 (UI and analytics).

**Timeline**: 3-4 weeks (3 coordinated PRs)
**Target Merge Date**: Mid-November 2025

## Architecture

Phase 3 adapters follow this pattern:

```
┌─────────────────────────────────────────────┐
│          AdapterRegistry (Phase 2)          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ SEC EDGAR    │  │ Yahoo Finance│ ...    │
│  │ (Primary)    │  │ (Fallback 1) │        │
│  └──────────────┘  └──────────────┘        │
│                                             │
│  Each adapter implements DataAdapter intf  │
│  All share: types, validation, rate limit  │
└─────────────────────────────────────────────┘
```

## Adapter Implementation Pattern

### Directory Structure

```
packages/adapters-oss/sec-edgar/
├── src/
│   ├── index.ts                 # Public exports
│   ├── types.ts                 # Domain types
│   ├── sec-edgar.adapter.ts     # Main adapter implementation
│   ├── cik-lookup.ts            # Ticker→CIK conversion
│   ├── rate-limiter.ts          # Rate limiting
│   ├── cache.ts                 # Caching layer
│   ├── validators.ts            # Zod schemas
│   └── __tests__/
│       ├── sec-edgar.adapter.test.ts
│       ├── cik-lookup.test.ts
│       └── fixtures/
│           ├── company-facts-aapl.json
│           ├── quarterly-10-q.json
│           └── ...
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Implementation Checklist per Adapter

1. **Package Setup** (15 min)
   - [ ] `package.json` with dependencies
   - [ ] `tsconfig.json` (extends root)
   - [ ] `vitest.config.ts` with 85% coverage threshold
   - [ ] README with compliance docs

2. **Core Types** (30 min)
   - [ ] Domain types (e.g., `CompanyFacts`, `OHLCVData`)
   - [ ] Zod schemas for validation
   - [ ] Error types

3. **Data Fetcher** (1-2 hours)
   - [ ] HTTP client wrapper (fetch with User-Agent)
   - [ ] Implement specific API endpoints
   - [ ] Parse responses into typed objects

4. **Rate Limiting** (30 min)
   - [ ] Implement token bucket or queue
   - [ ] Exponential backoff logic
   - [ ] 429 handling

5. **Caching** (30 min)
   - [ ] Cache layer (simple Map or persistent)
   - [ ] TTL logic
   - [ ] Key generation

6. **DataAdapter Interface Implementation** (1 hour)
   - [ ] `getHealth()` - check API availability
   - [ ] `getCapabilities()` - declare supported data types
   - [ ] Data retrieval methods (quotes, historical, fundamentals)
   - [ ] Error handling and validation

7. **Testing** (2-3 hours)
   - [ ] Record fixtures from real API responses
   - [ ] Unit tests for each module
   - [ ] Integration tests with fixture data
   - [ ] Error scenarios
   - [ ] Rate limit scenarios
   - [ ] Achieve ≥85% coverage

8. **Documentation** (30 min)
   - [ ] API reference in README
   - [ ] ToS/compliance checklist
   - [ ] Usage examples
   - [ ] Browser/environment compatibility

## Phase 3 PR Structure

### PR 1: Equity Adapters (SEC EDGAR, Yahoo Finance, Stooq)

**Scope**:
- SEC EDGAR adapter (company facts, fundamentals)
- Yahoo Finance adapter (OHLCV quotes, historical)
- Stooq adapter (historical CSV data, fallback)
- Shared utilities (rate limiter, cache, validators)
- AdapterRegistry updates

**Files**: ~3,000 LOC
**Tests**: ~80+ unit tests
**Coverage**: >85%
**Time**: ~5-7 days

**Deliverables**:
- [ ] 3 functional adapters
- [ ] Registry integration
- [ ] Fallback chaining working
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Feature coverage 60% → 70%

### PR 2: Macro Adapters (Treasury, ECB, IMF, World Bank, OECD)

**Scope**:
- U.S. Treasury yields adapter
- ECB SDW economic data
- IMF macroeconomic indicators
- World Bank data
- OECD indicators

**Files**: ~2,000 LOC
**Tests**: ~50+ unit tests
**Coverage**: >85%
**Time**: ~4-5 days

**Deliverables**:
- [ ] 5 macro data adapters
- [ ] Registry integration
- [ ] Fallback logic verified
- [ ] Tests passing
- [ ] Feature coverage 70% → 80%

### PR 3: Crypto + Registry Integration

**Scope**:
- Binance crypto adapter (spot prices)
- Fallback to Coinbase/Kraken
- Full AdapterRegistry integration
- Feature coverage matrix update
- Data source catalog completion
- Final testing/QA

**Files**: ~1,000 LOC
**Tests**: ~30+ unit tests
**Coverage**: >85%
**Time**: ~3-4 days

**Deliverables**:
- [ ] Crypto adapter
- [ ] Full registry integration
- [ ] End-to-end adapter chaining
- [ ] Feature matrix updated
- [ ] Data source catalog complete
- [ ] Final coverage ~85%
- [ ] CI green
- [ ] Ready for Phase 4

## Shared Utilities

These should be extracted to `packages/adapters-oss/shared` or `packages/shared` in PR 1:

### Rate Limiter

```typescript
interface RateLimiter {
  waitFor(tokens: number): Promise<void>;
  isReady(): boolean;
}

// Token bucket: 10 req/sec for SEC EDGAR
const limiter = new TokenBucketLimiter(10);
await limiter.waitFor(1);
```

### Cache

```typescript
interface CacheAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  clear(): void;
}

// Implementations: MemoryCache, LocalStorageCache, IndexedDBCache
```

### Validators

```typescript
const OHLCVSchema = z.object({
  timestamp: z.number(),
  open: z.number().positive(),
  high: z.number().positive(),
  low: z.number().positive(),
  close: z.number().positive(),
  volume: z.number().nonnegative(),
});
```

## Testing Strategy

### Fixture-Based Testing

1. **Record Phase**: Make one real API call, save JSON response
2. **Fixture Storage**: Commit fixture to repo
3. **Test Phase**: All tests use fixture data
4. **CI**: No API calls, fast tests

**Example**:
```typescript
// fixtures/sec-edgar-aapl-facts.json
{
  "cik": "0000320193",
  "facts": {
    "revenue": 383285000000,
    "netIncome": 96995000000,
    "totalAssets": 352755000000
  }
}

// sec-edgar.adapter.test.ts
import fixture from './fixtures/sec-edgar-aapl-facts.json';

it('should parse company facts', () => {
  const facts = parseCompanyFacts(fixture);
  expect(facts.revenue).toBe(383285000000);
});
```

### Coverage Requirements

- **Lines**: ≥85%
- **Functions**: ≥85%
- **Branches**: ≥85% (test error paths)
- **Statements**: ≥85%

### Test Categories

1. **Happy Path**: Valid input → Expected output
2. **Error Paths**: Invalid input, network errors, 429 responses
3. **Edge Cases**: Empty results, null values, rate limit edge cases
4. **Integration**: Multiple adapters in registry, fallback chaining

## Phase 3 Success Criteria

- [ ] **Feature Coverage**: Free tier 60% → 85%, Overall 60% → 90%
- [ ] **Adapters Working**: All 6+ adapters functional and tested
- [ ] **Registry Integration**: Fallback chaining works correctly
- [ ] **Data Quality**: Real financial data flowing through adapters
- [ ] **Performance**: Adapter response < 1s (cached), < 2s (fresh)
- [ ] **Test Coverage**: ≥85% across all adapters
- [ ] **Documentation**: Complete data source catalog
- [ ] **CI/CD**: All tests pass, no regressions
- [ ] **ToS Compliance**: All data sources legally compliant
- [ ] **Ready for Phase 4**: Clean main branch, no blockers

## Known Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SEC API rate limits | Low | Medium | Implement queue, exponential backoff, test thoroughly |
| Ticker→CIK lookup issues | Medium | Low | Pre-cache common tickers, fallback to search |
| Data format changes | Low | Medium | Version API responses, add schema validation |
| Network timeouts | Medium | Low | Implement retry logic, timeouts, cache fallback |
| Test fixtures stale | Medium | Low | Document fixture update process, CI alert if >30 days old |

## Dependencies & Blockers

**Depends On**:
- ✅ Phase 1 (merged)
- ✅ Phase 2 Part 1 (merged)
- ✅ Phase 2 Part 2 (merged PR #5)

**Blocks**:
- ⏳ Phase 4: Web Application Enhancement (needs real data)
- ⏳ Phase 5: Analytics Engine (needs prices for calculations)

## References

- Phase 2 architecture: `docs/architecture.md`
- Adapter strategy: `docs/ADAPTER_STRATEGY.md`
- Feature matrix: `docs/feature-coverage-matrix.csv`
- Data compliance: `CONTRIBUTING.md#data-source-compliance`
- Project roadmap: `README.md#-roadmap`

## Next Steps

1. ✅ Create Phase 3 planning issue (#6)
2. ✅ Set up branch: `feat/phase-3-equity-adapters-20251108`
3. ✅ Create adapter-oss package structure
4. ⏳ Implement SEC EDGAR adapter
5. ⏳ Implement Yahoo Finance adapter
6. ⏳ Implement Stooq adapter
7. ⏳ Add shared utilities
8. ⏳ PR #6: Equity adapters → main
9. ⏳ PR #7: Macro adapters → main
10. ⏳ PR #8: Crypto + integration → main
11. ⏳ Update README, roadmap
12. ⏳ Begin Phase 4
