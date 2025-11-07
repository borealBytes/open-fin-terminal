# @open-fin-terminal/shared

Shared types, utilities, and constants for Open Financial Terminal.

## Usage

```typescript
import { Symbol, OHLCV, SymbolSchema } from '@open-fin-terminal/shared'

// Define a symbol
const symbol: Symbol = {
  ticker: 'AAPL',
  name: 'Apple Inc.',
  exchange: 'NASDAQ',
  assetType: 'equity',
  currency: 'USD',
}

// Validate with zod
const validated = SymbolSchema.parse(symbol)
```

## Contents

- **types.ts**: Core domain types (Symbol, OHLCV, etc.) with zod schemas
- **constants.ts**: Application-wide constants
- **utils** (coming soon): Shared utility functions

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Test
pnpm test

# Type check
pnpm typecheck
```
