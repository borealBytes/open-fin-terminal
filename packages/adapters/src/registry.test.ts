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

  describe('registration', () => {
    it('should register an adapter', () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      const retrieved = registry.getAdapterByName('test-adapter');
      expect(retrieved).toBe(adapter);
    });

    it('should throw error when registering duplicate adapter', () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      expect(() => registry.register(adapter)).toThrow(
        "Adapter 'test-adapter' is already registered",
      );
    });

    it('should unregister an adapter', () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      const removed = registry.unregister('test-adapter');
      expect(removed).toBe(true);

      const retrieved = registry.getAdapterByName('test-adapter');
      expect(retrieved).toBeUndefined();
    });

    it('should return false when unregistering non-existent adapter', () => {
      const removed = registry.unregister('non-existent');
      expect(removed).toBe(false);
    });

    it('should get all registered adapters', () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);

      const all = registry.getAllAdapters();
      expect(all).toHaveLength(2);
      expect(all).toContain(adapter1);
      expect(all).toContain(adapter2);
    });
  });

  describe('fallback chain', () => {
    it('should auto-add built-in adapters to end of chain', () => {
      const builtIn = new MockAdapter('built-in', 'built-in');
      registry.register(builtIn);

      const chain = registry.getFallbackChain();
      expect(chain).toContain('built-in');
      expect(chain[chain.length - 1]).toBe('built-in');
    });

    it('should auto-add optional adapters to start of chain', () => {
      const optional = new MockAdapter('optional', 'optional', true);
      registry.register(optional);

      const chain = registry.getFallbackChain();
      expect(chain).toContain('optional');
      expect(chain[0]).toBe('optional');
    });

    it('should set custom fallback chain', () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);

      registry.setFallbackChain(['adapter-2', 'adapter-1']);

      const chain = registry.getFallbackChain();
      expect(chain).toEqual(['adapter-2', 'adapter-1']);
    });

    it('should throw error when setting chain with unknown adapter', () => {
      const adapter = new MockAdapter('adapter-1');
      registry.register(adapter);

      expect(() => registry.setFallbackChain(['adapter-1', 'unknown'])).toThrow(
        "Unknown adapter 'unknown' in fallback chain",
      );
    });

    it('should remove adapter from chain when unregistered', () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);
      registry.setFallbackChain(['adapter-1', 'adapter-2']);

      registry.unregister('adapter-1');

      const chain = registry.getFallbackChain();
      expect(chain).not.toContain('adapter-1');
      expect(chain).toContain('adapter-2');
    });
  });

  describe('adapter selection', () => {
    it('should get healthy adapter', async () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      const selected = await registry.getAdapter();
      expect(selected).toBe(adapter);
    });

    it('should prefer specified adapter', async () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);
      registry.setFallbackChain(['adapter-1', 'adapter-2']);

      const selected = await registry.getAdapter('adapter-2');
      expect(selected).toBe(adapter2);
    });

    it('should fall back to next adapter when preferred is unhealthy', async () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      adapter1.setHealthStatus('unavailable');
      registry.register(adapter1);
      registry.register(adapter2);
      registry.setFallbackChain(['adapter-1', 'adapter-2']);

      const selected = await registry.getAdapter('adapter-1');
      expect(selected).toBe(adapter2);
    });

    it('should throw error when no healthy adapters available', async () => {
      const adapter = new MockAdapter('test-adapter');
      adapter.setHealthStatus('unavailable');
      registry.register(adapter);

      await expect(registry.getAdapter()).rejects.toThrow(AdapterError);
      await expect(registry.getAdapter()).rejects.toThrow(
        'No healthy data adapters available',
      );
    });

    it('should select degraded adapter when no healthy ones available', async () => {
      const adapter = new MockAdapter('test-adapter');
      adapter.setHealthStatus('degraded');
      registry.register(adapter);

      const selected = await registry.getAdapter();
      expect(selected).toBe(adapter);
    });
  });

  describe('capabilities', () => {
    it('should get adapters with specific capability', () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2', 'optional', true);
      registry.register(adapter1);
      registry.register(adapter2);

      const realtimeAdapters = registry.getAdaptersWithCapability('realtime');
      expect(realtimeAdapters).toHaveLength(1);
      expect(realtimeAdapters[0]).toBe(adapter2);
    });

    it('should return empty array when no adapters have capability', () => {
      const adapter = new MockAdapter('adapter-1');
      registry.register(adapter);

      const optionsAdapters = registry.getAdaptersWithCapability('options');
      expect(optionsAdapters).toHaveLength(0);
    });
  });

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

    it('should start automatic health checks when enabled', () => {
      const registryWithAuto = new AdapterRegistry({
        autoHealthCheck: true,
        healthCheckInterval: 100,
      });

      const adapter = new MockAdapter('test-adapter');
      registryWithAuto.register(adapter);

      // Wait for initial health check
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const healthStatus = registryWithAuto.getHealthStatus();
          expect(healthStatus.has('test-adapter')).toBe(true);
          registryWithAuto.dispose();
          resolve();
        }, 50);
      });
    });

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

  describe('disposal', () => {
    it('should clear all adapters on dispose', () => {
      const adapter1 = new MockAdapter('adapter-1');
      const adapter2 = new MockAdapter('adapter-2');
      registry.register(adapter1);
      registry.register(adapter2);

      registry.dispose();

      const all = registry.getAllAdapters();
      expect(all).toHaveLength(0);
    });

    it('should clear health cache on dispose', async () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);
      await registry.checkHealth('test-adapter');

      registry.dispose();

      const healthStatus = registry.getHealthStatus();
      expect(healthStatus.size).toBe(0);
    });

    it('should clear fallback chain on dispose', () => {
      const adapter = new MockAdapter('test-adapter');
      registry.register(adapter);

      registry.dispose();

      const chain = registry.getFallbackChain();
      expect(chain).toHaveLength(0);
    });
  });
});
