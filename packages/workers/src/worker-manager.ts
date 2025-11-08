import type { WorkerMetadata, WorkerOptions, WorkerStatus } from './types';

/**
 * Manages Web Worker lifecycle and health monitoring.
 *
 * @example
 * ```typescript
 * const manager = new WorkerManager();
 * const worker = await manager.spawn(
 *   new Worker(new URL('./my-worker.ts', import.meta.url), { type: 'module' })
 * );
 * 
 * // Use worker...
 * 
 * manager.terminate(worker);
 * ```
 */
export class WorkerManager {
  private workers = new Map<Worker, WorkerMetadata>();
  private nextId = 1;

  /**
   * Spawn a new worker and track its metadata.
   */
  spawn(worker: Worker, options: WorkerOptions = {}): Worker {
    const metadata: WorkerMetadata = {
      id: options.name || `worker-${this.nextId++}`,
      status: 'idle',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    this.workers.set(worker, metadata);

    // Set up error handling
    worker.addEventListener('error', (event) => {
      this.handleError(worker, new Error(event.message));
    });

    worker.addEventListener('messageerror', (event) => {
      this.handleError(worker, new Error('Message deserialization error'));
    });

    return worker;
  }

  /**
   * Get metadata for a worker.
   */
  getMetadata(worker: Worker): WorkerMetadata | undefined {
    return this.workers.get(worker);
  }

  /**
   * Update worker status.
   */
  updateStatus(worker: Worker, status: WorkerStatus): void {
    const metadata = this.workers.get(worker);
    if (metadata) {
      metadata.status = status;
      metadata.lastActiveAt = Date.now();
    }
  }

  /**
   * Mark worker as active.
   */
  markActive(worker: Worker): void {
    this.updateStatus(worker, 'busy');
  }

  /**
   * Mark worker as idle.
   */
  markIdle(worker: Worker): void {
    this.updateStatus(worker, 'idle');
  }

  /**
   * Handle worker error.
   */
  private handleError(worker: Worker, error: Error): void {
    const metadata = this.workers.get(worker);
    if (metadata) {
      metadata.status = 'error';
      metadata.error = error;
      metadata.lastActiveAt = Date.now();
    }
  }

  /**
   * Terminate a worker.
   */
  terminate(worker: Worker): void {
    const metadata = this.workers.get(worker);
    if (metadata) {
      metadata.status = 'terminated';
      worker.terminate();
      this.workers.delete(worker);
    }
  }

  /**
   * Terminate all workers.
   */
  terminateAll(): void {
    for (const worker of this.workers.keys()) {
      this.terminate(worker);
    }
  }

  /**
   * Get all worker metadata.
   */
  getAllMetadata(): WorkerMetadata[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get count of workers by status.
   */
  getCountByStatus(status: WorkerStatus): number {
    return Array.from(this.workers.values()).filter(
      (metadata) => metadata.status === status
    ).length;
  }

  /**
   * Check if a worker is healthy (idle or busy, not error/terminated).
   */
  isHealthy(worker: Worker): boolean {
    const metadata = this.workers.get(worker);
    return metadata?.status === 'idle' || metadata?.status === 'busy';
  }
}
