# @open-fin-terminal/adapters-sec-edgar

SEC EDGAR financial data adapter for Open Financial Terminal. Fetches company fundamentals (revenue, net income, assets, liabilities) from SEC EDGAR filings.

## Features

- **Company Fundamentals**: Quarterly and annual financial statements
- **Fast Lookup**: Ticker to CIK conversion (cached)
- **Public Data**: No API key required
- **ToS Compliant**: Respects SEC EDGAR rate limits and robots.txt
- **Typed**: Full TypeScript support with Zod validation
- **Tested**: >85% unit test coverage

## Installation

```bash
pnpm add @open-fin-terminal/adapters-sec-edgar
```

## Usage

```typescript
import { SECEdgarAdapter } from '@open-fin-terminal/adapters-sec-edgar';

const adapter = new SECEdgarAdapter();

// Get company facts
const facts = await adapter.getCompanyFacts('AAPL');
console.log(facts.revenue, facts.netIncome, facts.totalAssets);

// Get quarterly data
const quarterly = await adapter.getQuarterlyData('AAPL', 2024);

// Get annual data
const annual = await adapter.getAnnualData('AAPL', 2023);
```

## Data Sources

### SEC EDGAR Company Facts API

- **Endpoint**: `https://data.sec.gov/submissions/CIK{0000000000}.json`
- **Access**: Public (no auth required)
- **Rate Limit**: 10 requests/second
- **Response Format**: JSON
- **Data Freshness**: Updated after each SEC filing (varies by company)

### Ticker to CIK Mapping

- **Source**: SEC EDGAR Submissions Index
- **Cache**: 24-hour TTL
- **Fallback**: Manual lookup if not in cache

## Terms of Service & Compliance

### SEC EDGAR ToS

- ✅ Free public data
- ✅ No authentication required
- ✅ Programmatic access permitted
- ✅ Rate limits: 10 requests/second
- ⚠️ User-Agent header required (descriptive)
- ✅ Caching encouraged

### robots.txt Compliance

SEC EDGAR permits automated access for data retrieval:
```
User-agent: *
Disallow: /private/
Allow: /submissions/
Allow: /data/
```

This adapter respects these rules.

## Implementation Details

### Ticker to CIK Conversion

1. Fetch ticker-to-CIK mapping from SEC EDGAR
2. Cache locally (IndexedDB in browser, filesystem in Node)
3. Format CIK with leading zeros (10 digits)
4. Use formatted CIK in API calls

### Rate Limiting

- Enforces 10 requests/second maximum
- Implements exponential backoff with jitter
- Respects HTTP 429 (Too Many Requests) responses
- Queues requests when rate limit approached

### Caching Strategy

- **Company Facts**: 30-day TTL (SEC files quarterly)
- **Ticker→CIK**: 24-hour TTL (relatively static)
- **Cache Key**: `{type}:{ticker}:{period}` (e.g., `facts:AAPL:2024-Q1`)

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

### Test Fixtures

All tests use recorded JSON fixtures from real SEC EDGAR responses:
- `fixtures/company-facts-aapl.json`
- `fixtures/ticker-cik-mapping.json`
- `fixtures/quarterly-10-q.json`
- `fixtures/annual-10-k.json`

No live API calls in tests.

## API Reference

### `SECEdgarAdapter`

```typescript
interface SECEdgarAdapter extends DataAdapter {
  getCompanyFacts(ticker: string): Promise<CompanyFacts>;
  getQuarterlyData(ticker: string, year: number): Promise<QuarterlyData[]>;
  getAnnualData(ticker: string, year: number): Promise<AnnualData>;
  getHealth(): Promise<AdapterHealth>;
  getCapabilities(): AdapterCapabilities;
}
```

## Performance

- **First request**: ~500-1000ms (CIK lookup + facts fetch)
- **Cached request**: ~50-100ms
- **Batch requests**: ~5-10 seconds for 10 companies (respects rate limits)

## Error Handling

- **Invalid ticker**: Returns null
- **Rate limit exceeded**: Automatically retries with backoff
- **Network error**: Throws `AdapterError` with context
- **Invalid data**: Throws `ValidationError` (Zod validation)

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 114+
- Safari 15+

## License

MIT
