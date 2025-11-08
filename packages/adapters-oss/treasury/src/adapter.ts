import type { DataAdapter, HealthCheck, AdapterCapabilities } from '@open-fin-terminal/adapters';
import type { TreasuryYieldCurve, TreasuryRate, TreasuryMaturity } from './types';
import { TreasuryAPIResponseSchema } from './types';
import { TokenBucketLimiter } from '../../shared/rate-limiter';
import { MemoryCache } from '../../shared/cache';

// ... (rest of adapter code unchanged) ...
