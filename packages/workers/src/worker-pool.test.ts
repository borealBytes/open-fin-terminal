import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPool } from './worker-pool';

// Mock Worker class
class MockWorker extends EventTarget {
  terminate = vi.fn();
  postMessage = vi.fn();
}

describe('WorkerPool', () => {
  let pool: WorkerPool;
  let workerCount = 0;

  const createMockWorker = () => {
    workerCount++;
    return new MockWorker() as any as Worker;
  };

  beforeEach(() => {
    workerCount = 0;
  });

  afterEach(async () => {
    if (pool) {
      await pool.destroy();
    }
  });

  describe('constructor', () => {
    it('creates minimum workers on initialization', () => {
      pool = new WorkerPool(createMockWorker, { minWorkers: 2 });
      expect(workerCount).toBe(2);
    });

    it('uses default config when not provided', () => {
      pool = new WorkerPool(createMockWorker);
      expect(workerCount).toBe(1); // default minWorkers
    });
  });

  describe('execute', () => {
    it('executes a task', async () => {
      pool = new WorkerPool(createMockWorker, { minWorkers: 1 });
      
      const task = vi.fn().mockResolvedValue(42);
      const result = await pool.execute(task);
      
      expect(result).toBe(42);
      expect(task).toHaveBeenCalled();
    });

    it('executes multiple tasks in parallel', async () => {
      pool = new WorkerPool(createMockWorker, {
        minWorkers: 2,
        maxWorkers: 2,
      });
      
      const task1 = vi.fn().mockResolvedValue(1);
      const task2 = vi.fn().mockResolvedValue(2);
      
      const results = await Promise.all([
        pool.execute(task1),
        pool.execute(task2),
      ]);
      
      expect(results).toEqual([1, 2]);
    });

    it('queues tasks when all workers are busy', async () => {
      pool = new WorkerPool(createMockWorker, {
        minWorkers: 1,
        maxWorkers: 1,
      });
      
      let resolve1: (value: number) => void;
      const task1 = vi.fn().mockImplementation(
        () => new Promise<number>((res) => { resolve1 = res; })
      );
      const task2 = vi.fn().mockResolvedValue(2);
      
      // Start first task (will block)
      const promise1 = pool.execute(task1);
      
      // Wait a bit for task1 to start
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Start second task (should be queued)
      const promise2 = pool.execute(task2);
      
      expect(pool.getStats().queuedTasks).toBe(1);
      
      // Complete first task
      resolve1!(1);
      const results = await Promise.all([promise1, promise2]);
      
      expect(results).toEqual([1, 2]);
    });

    it('creates new workers up to maxWorkers', async () => {
      pool = new WorkerPool(createMockWorker, {
        minWorkers: 1,
        maxWorkers: 3,
      });
      
      expect(workerCount).toBe(1);
      
      // Execute 3 tasks simultaneously
      await Promise.all([
        pool.execute(vi.fn().mockResolvedValue(1)),
        pool.execute(vi.fn().mockResolvedValue(2)),
        pool.execute(vi.fn().mockResolvedValue(3)),
      ]);
      
      // Should have created up to maxWorkers
      expect(workerCount).toBeLessThanOrEqual(3);
    });

    it('handles task errors', async () => {
      pool = new WorkerPool(createMockWorker, { minWorkers: 1 });
      
      const error = new Error('Task failed');
      const task = vi.fn().mockRejectedValue(error);
      
      await expect(pool.execute(task)).rejects.toThrow('Task failed');
    });
  });

  describe('getStats', () => {
    it('returns correct statistics', async () => {
      pool = new WorkerPool(createMockWorker, {
        minWorkers: 2,
        maxWorkers: 4,
      });
      
      const stats = pool.getStats();
      
      expect(stats.totalWorkers).toBe(2);
      expect(stats.idleWorkers).toBe(2);
      expect(stats.busyWorkers).toBe(0);
      expect(stats.queuedTasks).toBe(0);
    });

    it('tracks busy workers', async () => {
      pool = new WorkerPool(createMockWorker, { minWorkers: 1 });
      
      let resolve: (value: number) => void;
      const task = vi.fn().mockImplementation(
        () => new Promise<number>((res) => { resolve = res; })
      );
      
      // Start task
      const promise = pool.execute(task);
      
      // Wait for task to start
      await new Promise(r => setTimeout(r, 10));
      
      const stats = pool.getStats();
      expect(stats.busyWorkers).toBe(1);
      expect(stats.idleWorkers).toBe(0);
      
      // Complete task
      resolve!(1);
      await promise;
    });
  });

  describe('destroy', () => {
    it('terminates all workers', async () => {
      const workers: MockWorker[] = [];
      const factory = () => {
        const worker = new MockWorker() as any as Worker;
        workers.push(worker as any);
        return worker;
      };
      
      pool = new WorkerPool(factory, { minWorkers: 3 });
      await pool.destroy();
      
      expect(workers.every(w => w.terminate.mock.calls.length > 0)).toBe(true);
      expect(pool.getStats().totalWorkers).toBe(0);
    });

    it('clears task queue', async () => {
      pool = new WorkerPool(createMockWorker, {
        minWorkers: 1,
        maxWorkers: 1,
      });
      
      // Create a blocking task to keep the worker busy
      let resolveFirstTask: (value: number) => void;
      const blockingTask = vi.fn().mockImplementation(
        () => new Promise<number>((res) => { resolveFirstTask = res; })
      );
      
      // Start first task (blocks the only worker)
      const promise1 = pool.execute(blockingTask);
      
      // Wait for first task to start and occupy the worker
      await new Promise(r => setTimeout(r, 10));
      
      // Submit second task - this should be queued since worker is busy
      const promise2 = pool.execute(vi.fn().mockResolvedValue(2));
      
      // Verify task is queued before destroy
      expect(pool.getStats().queuedTasks).toBe(1);
      
      // Destroy pool (should clear queue)
      await pool.destroy();
      
      // Verify queue is cleared
      expect(pool.getStats().queuedTasks).toBe(0);
    });
  });
});
