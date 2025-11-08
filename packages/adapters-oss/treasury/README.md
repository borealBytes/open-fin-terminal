# @open-fin-terminal/treasury-adapter

U.S. Treasury yield curve data adapter for the Open Financial Terminal.

## Features

- ✅ Daily Treasury yield curve rates (10 maturities)
- ✅ Historical yield data with date ranges
- ✅ Rate limiting (10 req/sec)
- ✅ 24-hour caching (yields don't change intraday)
- ✅ Full ToS compliance
- ✅ TypeScript with Zod validation
- ✅ Comprehensive test coverage

## Data Source

**U.S. Department of Treasury - Fiscal Data API**
- URL: https://fiscaldata.treasury.gov/
- Endpoint: `/v2/accounting/od/avg_interest_rates`
- License: Public domain
- Attribution: Required
- Rate Limit: No published limit (using conservative 10/sec)
- Update Frequency: Daily

## Supported Maturities

- 1 Month
- 3 Month
- 6 Month
- 1 Year
- 2 Year
- 5 Year
- 7 Year
- 10 Year
- 20 Year
- 30 Year

## Usage

```typescript
import { TreasuryAdapter } from '@open-fin-terminal/treasury-adapter';

const adapter = new TreasuryAdapter();

// Get latest yield curve
const curve = await adapter.getYieldCurve();
console.log(curve.rates);
// [
//   { maturity: '1_MONTH', yield: 5.25, date: 2025-11-08 },
//   { maturity: '3_MONTH', yield: 5.30, date: 2025-11-08 },
//   { maturity: '10_YEAR', yield: 4.25, date: 2025-11-08 },
//   ...
// ]

// Get historical yields
const from = new Date('2025-01-01');
const to = new Date('2025-11-08');
const historical = await adapter.getHistoricalYields(from, to);
```

## ToS Compliance

✅ **Public Data**: U.S. Treasury data is in the public domain  
✅ **No Authentication**: No API key required  
✅ **Attribution**: Required (included in User-Agent header)  
✅ **Rate Limiting**: Conservative 10 req/sec to be respectful  
✅ **Caching**: 24-hour TTL reduces API load  
✅ **User-Agent**: Identifies our application

## Development

```bash
# Install
pnpm install

# Build
pnpm build

# Test
pnpm test

# Test with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

## License

MIT
