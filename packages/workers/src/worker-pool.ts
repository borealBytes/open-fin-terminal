import { WorkerManager } from './worker-manager';
import type { WorkerPoolConfig } from './types';

/**
 * Task to be executed in a worker.
 */
type WorkerTask<T> = (worker: Worker) => Promise<T>;

/**
 * Manages a pool of workers for parallel task execution.
 *
 * @example
 * ```typescript
 * const pool = new WorkerPool(
 *   () => new Worker(new URL('./my-worker.ts', import.meta.url), { type: 'module' }),
 *   { minWorkers: 2, maxWorkers: 4 }
 * );
 *
 * const results = await Promise.all([
 *   pool.execute((worker) => worker.someTask(data1)),
 *   pool.execute((worker) => worker.someTask(data2)),
 * ]);
 *
 * await pool.destroy();
 * ```
 */
export class WorkerPool {
  private manager: WorkerManager;
  private workers: Worker[] = [];
  private queue: Array<{
    task: WorkerTask<any>;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  private config: Required<WorkerPoolConfig>;
  private workerFactory: () => Worker;
  private idleTimeouts = new Map<Worker, NodeJS.Timeout>();

  constructor(
    workerFactory: () => Worker,
    config: WorkerPoolConfig = {}
  ) {
    this.workerFactory = workerFactory;
    this.manager = new WorkerManager();
    this.config = {
      minWorkers: config.minWorkers ?? 1,
      maxWorkers: config.maxWorkers ?? 4,
      idleTimeout: config.idleTimeout ?? 60000, // 1 minute
    };

    // Create minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker and add to pool.
   */
  private createWorker(): Worker {
    const worker = this.workerFactory();
    this.manager.spawn(worker, { name: `pool-worker-${this.workers.length}` });
    this.workers.push(worker);
    return worker;
  }

  /**
   * Get an available worker from the pool.
   */
  private getAvailableWorker(): Worker | null {
    // Try to find an idle worker
    for (const worker of this.workers) {
      if (this.manager.isHealthy(worker)) {
        const metadata = this.manager.getMetadata(worker);
        if (metadata?.status === 'idle') {
          // Clear idle timeout
          const timeout = this.idleTimeouts.get(worker);
          if (timeout) {
            clearTimeout(timeout);
            this.idleTimeouts.delete(worker);
          }
          return worker;
        }
      }
    }

    // Create new worker if under max limit
    if (this.workers.length < this.config.maxWorkers) {
      return this.createWorker();
    }

    return null;
  }

  /**
   * Return a worker to the pool.
   */
  private returnWorker(worker: Worker): void {
    this.manager.markIdle(worker);

    // Process next queued task if available
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.executeTask(worker, next.task)
          .then(next.resolve)
          .catch(next.reject);
        return;
      }
    }

    // Set idle timeout for workers above minimum
    if (this.workers.length > this.config.minWorkers) {
      const timeout = setTimeout(() => {
        this.removeWorker(worker);
      }, this.config.idleTimeout);
      this.idleTimeouts.set(worker, timeout);
    }
  }

  /**
   * Remove a worker from the pool.
   */
  private removeWorker(worker: Worker): void {
    const index = this.workers.indexOf(worker);
    if (index !== -1) {
      this.workers.splice(index, 1);
      const timeout = this.idleTimeouts.get(worker);
      if (timeout) {
        clearTimeout(timeout);
        this.idleTimeouts.delete(worker);
      }
      this.manager.terminate(worker);
    }
  }

  /**
   * Execute a task on a specific worker.
   */
  private async executeTask<T>(worker: Worker, task: WorkerTask<T>): Promise<T> {
    this.manager.markActive(worker);
    try {
      const result = await task(worker);
      this.returnWorker(worker);
      return result;
    } catch (error) {
      this.returnWorker(worker);
      throw error;
    }
  }

  /**
   * Execute a task in the worker pool.
   */
  execute<T>(task: WorkerTask<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      if (worker) {
        this.executeTask(worker, task)
          .then(resolve)
          .catch(reject);
      } else {
        // Queue the task
        this.queue.push({ task, resolve, reject });
      }
    });
  }

  /**
   * Get current pool statistics.
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      idleWorkers: this.manager.getCountByStatus('idle'),
      busyWorkers: this.manager.getCountByStatus('busy'),
      queuedTasks: this.queue.length,
    };
  }

  /**
   * Destroy the worker pool.
   */
  async destroy(): Promise<void> {
    // Clear all idle timeouts
    for (const timeout of this.idleTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.idleTimeouts.clear();

    // Terminate all workers
    for (const worker of this.workers) {
      this.manager.terminate(worker);
    }
    
    this.workers = [];
    this.queue = [];
  }
}
