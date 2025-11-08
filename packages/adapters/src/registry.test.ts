import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdapterRegistry } from './registry';
import type { DataAdapter, HealthCheck, AdapterCapabilities } from './types';
import { AdapterError } from './types';
import type { Quote, HistoricalPrice, Fundamentals } from '@open-fin-terminal/shared';

// Mock adapter implementation
class MockAdapter implements DataAdapter {
  constructor(
    public readonly name: string,
    public readonly type: 'built-in' | 'optional' = 'built-in',
    public readonly requiresSetup: boolean = false,
    private healthStatus: 'healthy' | 'degraded' | 'unavailable' = 'healthy',
  ) {}

  async healthCheck(): Promise<HealthCheck> {
    return {
      adapter: this.name,
      status: this.healthStatus,
      latency: 100,
      successRate: this.healthStatus === 'healthy' ? 1.0 : 0.5,
      lastChecked: new Date(),
    };
  }

  getCapabilities(): AdapterCapabilities {
    return {
      quotes: true,
      historical: true,
      fundamentals: true,
      options: false,
      economic: false,
      forex: false,
      crypto: false,
      news: false,
      realtime: this.type === 'optional',
    };
  }

  async getQuote(): Promise<Quote> {
    return {
      symbol: 'AAPL',
      price: 150.0,
      volume: 1000000,
      timestamp: new Date(),
      realtime: false,
    };
  }

  async getHistoricalPrices(): Promise<HistoricalPrice[]> {
    return [
      {
        date: new Date(),
        ohlcv: { open: 150, high: 155, low: 149, close: 152, volume: 1000000 },
      },
    ];
  }

  async getFundamentals(): Promise<Fundamentals> {
    return {
      symbol: 'AAPL',
      profile: {
        name: 'Apple Inc.',
        industry: 'Technology',
      },
    };
  }

  setHealthStatus(status: 'healthy' | 'degraded' | 'unavailable'): void {
    this.healthStatus = status;
  }
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry({ autoHealthCheck: false });
  });

  afterEach(() => {
    registry.dispose();
  });

  // ... unchanged tests above ...

  describe('health monitoring', () => {
    it('should perform health check on adapter', async () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      const health = await registry.checkHealth('test-adapter');
      expect(health).toBeDefined();
      expect(health?.adapter).toBe('test-adapter');
      expect(health?.status).toBe('healthy');
    });

    it('should return undefined for non-existent adapter', async () => {
      const health = await registry.checkHealth('non-existent');
      expect(health).toBeUndefined();
    });

    it('should cache health check results', async () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      await registry.checkHealth('test-adapter');
      const healthStatus = registry.getHealthStatus();
      expect(healthStatus.has('test-adapter')).toBe(true);
    });

    it('should handle health check errors gracefully', async () => {
      const adapter = new MockAdapter('test-adapter');
      adapter.healthCheck = vi.fn().mockRejectedValue(new Error('Network error'));
      registry.register(adapter);

      const health = await registry.checkHealth('test-adapter');
      expect(health?.status).toBe('unavailable');
      expect(health?.error).toBe('Network error');
    });

    it('should get health status for all adapters', async () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);

      await registry.checkHealth('adapter-1');
      await registry.checkHealth('adapter-2');

      const healthStatus = registry.getHealthStatus();
      expect(healthStatus.size).toBe(2);
      expect(healthStatus.has('adapter-1')).toBe(true);
      expect(healthStatus.has('adapter-2')).toBe(true);
    });

    it('should start automatic health checks when enabled', async () => {
      const registryWithAuto = new AdapterRegistry({
        autoHealthCheck: true,
        healthCheckInterval: 50,
      });

      const adapter = new MockAdapter('test-adapter');
      registryWithAuto.register(adapter);

      // Wait until the health check entry appears or we time out
      const start = Date.now();
      const timeout = 2500; // 2.5 seconds, more robust for CI
      let found = false;
      while (Date.now() - start < timeout) {
        await new Promise((r) => setTimeout(r, 50));
        const healthStatus = registryWithAuto.getHealthStatus();
        if (healthStatus.has('test-adapter')) {
          found = true;
          break;
        }
      }
      expect(found).toBe(true);
      registryWithAuto.dispose();
    }, 3000);

    it('should stop health checks on dispose', () => {
      const registryWithAuto = new AdapterRegistry({
        autoHealthCheck: true,
        healthCheckInterval: 100,
      });

      const adapter = new MockAdapter('test-adapter');
      registryWithAuto.register(adapter);
      registryWithAuto.dispose();

      // Health cache should be cleared
      const healthStatus = registryWithAuto.getHealthStatus();
      expect(healthStatus.size).toBe(0);
    });
  });

  // ... unchanged tests below ...

});
