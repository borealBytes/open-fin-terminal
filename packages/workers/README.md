# @open-fin-terminal/workers

Web Worker runtime and utilities for Open Financial Terminal. Provides type-safe worker communication using Comlink.

## Features

- **Type-Safe**: Comlink integration for type-safe worker communication
- **Worker Pools**: Efficient worker pool management for parallel processing
- **Lifecycle Management**: Automatic worker spawning, termination, and error recovery
- **Message Passing**: Simplified message passing with automatic serialization
- **Error Handling**: Comprehensive error handling and recovery
- **TypeScript**: Fully typed worker APIs

## Installation

```bash
pnpm add @open-fin-terminal/workers
```

## Usage

### Basic Worker

```typescript
import { WorkerManager } from '@open-fin-terminal/workers';
import { wrap } from 'comlink';

// Create worker manager
const manager = new WorkerManager();

// Spawn worker
const worker = await manager.spawn(
  new Worker(new URL('./my-worker.ts', import.meta.url), { type: 'module' })
);

// Use worker with Comlink
const api = wrap(worker);
const result = await api.someMethod();

// Terminate when done
manager.terminate(worker);
```

### Worker Pool

```typescript
import { WorkerPool } from '@open-fin-terminal/workers';

// Create worker pool
const pool = new WorkerPool(
  () => new Worker(new URL('./analytics-worker.ts', import.meta.url), { type: 'module' }),
  {
    minWorkers: 2,
    maxWorkers: 4,
    idleTimeout: 60000, // 1 minute
  }
);

// Execute tasks
const results = await Promise.all([
  pool.execute((worker) => worker.calculateIndicator(data1)),
  pool.execute((worker) => worker.calculateIndicator(data2)),
  pool.execute((worker) => worker.calculateIndicator(data3)),
]);

// Cleanup
await pool.destroy();
```

### Example Worker (analytics-worker.ts)

```typescript
import { expose } from 'comlink';

// Worker API
const api = {
  calculateIndicator(data: number[]) {
    // Perform heavy computation in worker
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  },
  
  processTimeSeries(prices: number[]) {
    // Complex analytics
    const sma = calculateSMA(prices, 20);
    const rsi = calculateRSI(prices, 14);
    return { sma, rsi };
  },
};

expose(api);

export type AnalyticsWorkerAPI = typeof api;
```

## Architecture

### Worker Manager

Manages individual worker lifecycle:
- Spawning and initialization
- Health monitoring
- Graceful termination
- Error recovery

### Worker Pool

Manages a pool of workers for parallel execution:
- Dynamic scaling (min/max workers)
- Task queue management
- Load balancing
- Automatic idle worker cleanup

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 114+
- Safari 15.4+

## Development

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Build
pnpm build
```

## Performance Considerations

- Workers have startup overhead (~100-300ms)
- Use worker pools for frequent operations
- Minimize data transfer between main thread and workers
- Use Transferable objects for large data (ArrayBuffer, MessagePort)
- Consider SharedArrayBuffer for shared state (with proper synchronization)

## License

MIT
