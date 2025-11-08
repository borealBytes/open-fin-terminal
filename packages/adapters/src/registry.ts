/**
 * Adapter registry with intelligent fallback logic.
 *
 * Manages multiple data adapters and automatically falls back to
 * alternative sources when the primary adapter is unavailable.
 *
 * @packageDocumentation
 */

import type { DataAdapter, AdapterCapabilities, HealthCheck } from './types';
import { AdapterError } from './types';

/**
 * Options for adapter registry.
 */
export interface AdapterRegistryOptions {
  /** Health check interval in milliseconds (default: 60000 = 1 minute) */
  healthCheckInterval?: number;
  /** Enable automatic health checks (default: true) */
  autoHealthCheck?: boolean;
}

/**
 * Registry for managing data adapters with fallback logic.
 *
 * The registry maintains a collection of adapters and implements
 * intelligent fallback behavior when adapters fail or are unavailable.
 *
 * @example
 * ```typescript
 * const registry = new AdapterRegistry();
 *
 * // Register built-in adapters (always available)
 * registry.register(new YahooFinanceAdapter());
 * registry.register(new SecEdgarAdapter());
 *
 * // Register optional adapter if available
 * if (process.env.OPENBB_API_URL) {
 *   registry.register(new OpenBBAdapter());
 * }
 *
 * // Set fallback chain (tries in order)
 * registry.setFallbackChain([
 *   'openbb',         // Try premium first
 *   'yahoo-finance',  // Fall back to free
 *   'sec-edgar',
 * ]);
 *
 * // Get adapter (automatically selects healthy one)
 * const adapter = await registry.getAdapter();
 * const quote = await adapter.getQuote({ symbol: 'AAPL' });
 * ```
 */
export class AdapterRegistry {
  private adapters = new Map<string, DataAdapter>();
  private fallbackChain: string[] = [];
  private healthCache = new Map<string, HealthCheck>();
  private healthCheckTimer?: NodeJS.Timeout;
  private options: Required<AdapterRegistryOptions>;

  constructor(options: AdapterRegistryOptions = {}) {
    this.options = {
      healthCheckInterval: options.healthCheckInterval ?? 60000,
      autoHealthCheck: options.autoHealthCheck ?? true,
    };

    if (this.options.autoHealthCheck) {
      this.startHealthChecks();
    }
  }

  /**
   * Register a data adapter.
   *
   * @param adapter - Adapter to register
   * @throws {Error} If adapter with same name already registered
   */
  register(adapter: DataAdapter): void {
    if (this.adapters.has(adapter.name)) {
      throw new Error(`Adapter '${adapter.name}' is already registered`);
    }

    this.adapters.set(adapter.name, adapter);

    // Add to fallback chain if not already present
    if (!this.fallbackChain.includes(adapter.name)) {
      // Built-in adapters go at the end (lowest priority)
      // Optional adapters go at the start (highest priority)
      if (adapter.type === 'built-in') {
        this.fallbackChain.push(adapter.name);
      } else {
        this.fallbackChain.unshift(adapter.name);
      }
    }
  }

  /**
   * Unregister an adapter.
   *
   * @param name - Name of adapter to unregister
   * @returns True if adapter was removed, false if not found
   */
  unregister(name: string): boolean {
    const removed = this.adapters.delete(name);
    if (removed) {
      this.healthCache.delete(name);
      this.fallbackChain = this.fallbackChain.filter((n) => n !== name);
    }
    return removed;
  }

  /**
   * Set the fallback chain order.
   *
   * Adapters earlier in the chain are preferred. If an adapter
   * fails or is unavailable, the next adapter in the chain is tried.
   *
   * @param chain - Ordered array of adapter names
   * @throws {Error} If chain contains unknown adapter names
   */
  setFallbackChain(chain: string[]): void {
    // Validate all adapters exist
    for (const name of chain) {
      if (!this.adapters.has(name)) {
        throw new Error(`Unknown adapter '${name}' in fallback chain`);
      }
    }

    this.fallbackChain = [...chain];
  }

  /**
   * Get fallback chain.
   *
   * @returns Current fallback chain
   */
  getFallbackChain(): string[] {
    return [...this.fallbackChain];
  }

  /**
   * Get a healthy adapter.
   *
   * Returns the first healthy adapter according to the fallback chain.
   * If `preferredName` is provided, tries that adapter first.
   *
   * @param preferredName - Optional preferred adapter name
   * @returns First healthy adapter found
   * @throws {AdapterError} If no healthy adapters available
   */
  async getAdapter(preferredName?: string): Promise<DataAdapter> {
    // Try preferred adapter first
    if (preferredName) {
      const adapter = this.adapters.get(preferredName);
      if (adapter && (await this.isHealthy(adapter.name))) {
        return adapter;
      }
    }

    // Try fallback chain
    for (const name of this.fallbackChain) {
      if (await this.isHealthy(name)) {
        const adapter = this.adapters.get(name);
        if (adapter) {
          return adapter;
        }
      }
    }

    throw new AdapterError(
      'No healthy data adapters available',
      'registry',
      'UNAVAILABLE',
    );
  }

  /**
   * Get adapter by name.
   *
   * Does not check health status - returns adapter even if unhealthy.
   *
   * @param name - Adapter name
   * @returns Adapter or undefined if not found
   */
  getAdapterByName(name: string): DataAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Get all registered adapters.
   *
   * @returns Array of all adapters
   */
  getAllAdapters(): DataAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get adapters with specific capability.
   *
   * @param capability - Capability key to filter by
   * @returns Array of adapters supporting the capability
   */
  getAdaptersWithCapability(
    capability: keyof AdapterCapabilities,
  ): DataAdapter[] {
    return this.getAllAdapters().filter((adapter) => {
      const caps = adapter.getCapabilities();
      return caps[capability] === true;
    });
  }

  /**
   * Get health status for all adapters.
   *
   * @returns Map of adapter names to health checks
   */
  getHealthStatus(): Map<string, HealthCheck> {
    return new Map(this.healthCache);
  }

  /**
   * Perform health check on specific adapter.
   *
   * @param name - Adapter name
   * @returns Health check result or undefined if adapter not found
   */
  async checkHealth(name: string): Promise<HealthCheck | undefined> {
    const adapter = this.adapters.get(name);
    if (!adapter) {
      return undefined;
    }

    try {
      const health = await adapter.healthCheck();
      this.healthCache.set(name, health);
      return health;
    } catch (error) {
      const health: HealthCheck = {
        adapter: name,
        status: 'unavailable',
        latency: -1,
        successRate: 0,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      this.healthCache.set(name, health);
      return health;
    }
  }

  /**
   * Check if adapter is healthy.
   *
   * Uses cached health status if available and recent.
   *
   * @param name - Adapter name
   * @returns True if adapter is healthy
   */
  private async isHealthy(name: string): Promise<boolean> {
    const cached = this.healthCache.get(name);

    // Use cached result if recent (within health check interval)
    if (cached) {
      const age = Date.now() - cached.lastChecked.getTime();
      if (age < this.options.healthCheckInterval) {
        return cached.status === 'healthy' || cached.status === 'degraded';
      }
    }

    // Perform fresh health check
    const health = await this.checkHealth(name);
    return (
      health?.status === 'healthy' || health?.status === 'degraded'
    );
  }

  /**
   * Start automatic health checks.
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      return;
    }

    this.healthCheckTimer = setInterval(() => {
      // Check all adapters
      for (const name of this.adapters.keys()) {
        this.checkHealth(name).catch((error) => {
          console.warn(`Health check failed for ${name}:`, error);
        });
      }
    }, this.options.healthCheckInterval);

    // Initial health checks
    for (const name of this.adapters.keys()) {
      this.checkHealth(name).catch((error) => {
        console.warn(`Initial health check failed for ${name}:`, error);
      });
    }
  }

  /**
   * Stop automatic health checks.
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }

  /**
   * Dispose of registry resources.
   */
  dispose(): void {
    this.stopHealthChecks();
    this.adapters.clear();
    this.healthCache.clear();
    this.fallbackChain = [];
  }
}
