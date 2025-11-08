import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerManager } from './worker-manager';

// Mock Worker class
class MockWorker extends EventTarget {
  terminate = vi.fn();
  postMessage = vi.fn();
}

describe('WorkerManager', () => {
  let manager: WorkerManager;
  let worker: MockWorker;

  beforeEach(() => {
    manager = new WorkerManager();
    worker = new MockWorker() as any;
  });

  afterEach(() => {
    manager.terminateAll();
  });

  describe('spawn', () => {
    it('spawns a worker and tracks metadata', () => {
      const spawned = manager.spawn(worker as any);
      expect(spawned).toBe(worker);

      const metadata = manager.getMetadata(worker as any);
      expect(metadata).toBeDefined();
      expect(metadata?.status).toBe('idle');
      expect(metadata?.createdAt).toBeGreaterThan(0);
    });

    it('generates unique IDs for workers', () => {
      const worker1 = new MockWorker() as any;
      const worker2 = new MockWorker() as any;

      manager.spawn(worker1);
      manager.spawn(worker2);

      const meta1 = manager.getMetadata(worker1);
      const meta2 = manager.getMetadata(worker2);

      expect(meta1?.id).not.toBe(meta2?.id);
    });

    it('uses custom name when provided', () => {
      manager.spawn(worker as any, { name: 'analytics-worker' });

      const metadata = manager.getMetadata(worker as any);
      expect(metadata?.id).toBe('analytics-worker');
    });

    it('sets up error event listener', () => {
      manager.spawn(worker as any);
      
      // Trigger error event
      const errorEvent = new ErrorEvent('error', { message: 'Worker error' });
      worker.dispatchEvent(errorEvent);

      const metadata = manager.getMetadata(worker as any);
      expect(metadata?.status).toBe('error');
      expect(metadata?.error).toBeDefined();
    });
  });

  describe('getMetadata', () => {
    it('returns metadata for tracked worker', () => {
      manager.spawn(worker as any, { name: 'test-worker' });
      const metadata = manager.getMetadata(worker as any);

      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe('test-worker');
    });

    it('returns undefined for untracked worker', () => {
      const untrackedWorker = new MockWorker() as any;
      const metadata = manager.getMetadata(untrackedWorker);

      expect(metadata).toBeUndefined();
    });
  });

  describe('updateStatus', () => {
    it('updates worker status', () => {
      manager.spawn(worker as any);
      manager.updateStatus(worker as any, 'busy');

      const metadata = manager.getMetadata(worker as any);
      expect(metadata?.status).toBe('busy');
    });

    it('updates lastActiveAt timestamp', () => {
      manager.spawn(worker as any);
      const initialTime = manager.getMetadata(worker as any)?.lastActiveAt;

      // Wait a bit
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      manager.updateStatus(worker as any, 'busy');
      const updatedTime = manager.getMetadata(worker as any)?.lastActiveAt;

      expect(updatedTime).toBeGreaterThan(initialTime!);
      vi.useRealTimers();
    });
  });

  describe('markActive / markIdle', () => {
    it('marks worker as active', () => {
      manager.spawn(worker as any);
      manager.markActive(worker as any);

      expect(manager.getMetadata(worker as any)?.status).toBe('busy');
    });

    it('marks worker as idle', () => {
      manager.spawn(worker as any);
      manager.markActive(worker as any);
      manager.markIdle(worker as any);

      expect(manager.getMetadata(worker as any)?.status).toBe('idle');
    });
  });

  describe('terminate', () => {
    it('terminates a worker', () => {
      manager.spawn(worker as any);
      manager.terminate(worker as any);

      expect(worker.terminate).toHaveBeenCalled();
      expect(manager.getMetadata(worker as any)).toBeUndefined();
    });

    it('does nothing for untracked worker', () => {
      const untrackedWorker = new MockWorker() as any;
      manager.terminate(untrackedWorker);

      expect(untrackedWorker.terminate).not.toHaveBeenCalled();
    });
  });

  describe('terminateAll', () => {
    it('terminates all workers', () => {
      const worker1 = new MockWorker() as any;
      const worker2 = new MockWorker() as any;

      manager.spawn(worker1);
      manager.spawn(worker2);

      manager.terminateAll();

      expect(worker1.terminate).toHaveBeenCalled();
      expect(worker2.terminate).toHaveBeenCalled();
      expect(manager.getAllMetadata()).toHaveLength(0);
    });
  });

  describe('getAllMetadata', () => {
    it('returns metadata for all workers', () => {
      const worker1 = new MockWorker() as any;
      const worker2 = new MockWorker() as any;

      manager.spawn(worker1, { name: 'worker-1' });
      manager.spawn(worker2, { name: 'worker-2' });

      const allMetadata = manager.getAllMetadata();
      expect(allMetadata).toHaveLength(2);
      expect(allMetadata.map((m) => m.id)).toContain('worker-1');
      expect(allMetadata.map((m) => m.id)).toContain('worker-2');
    });

    it('returns empty array when no workers', () => {
      expect(manager.getAllMetadata()).toHaveLength(0);
    });
  });

  describe('getCountByStatus', () => {
    it('counts workers by status', () => {
      const worker1 = new MockWorker() as any;
      const worker2 = new MockWorker() as any;
      const worker3 = new MockWorker() as any;

      manager.spawn(worker1);
      manager.spawn(worker2);
      manager.spawn(worker3);

      manager.markActive(worker1);
      manager.markActive(worker2);

      expect(manager.getCountByStatus('busy')).toBe(2);
      expect(manager.getCountByStatus('idle')).toBe(1);
      expect(manager.getCountByStatus('error')).toBe(0);
    });
  });

  describe('isHealthy', () => {
    it('returns true for idle worker', () => {
      manager.spawn(worker as any);
      expect(manager.isHealthy(worker as any)).toBe(true);
    });

    it('returns true for busy worker', () => {
      manager.spawn(worker as any);
      manager.markActive(worker as any);
      expect(manager.isHealthy(worker as any)).toBe(true);
    });

    it('returns false for error worker', () => {
      manager.spawn(worker as any);
      const errorEvent = new ErrorEvent('error', { message: 'Test error' });
      worker.dispatchEvent(errorEvent);

      expect(manager.isHealthy(worker as any)).toBe(false);
    });

    it('returns false for untracked worker', () => {
      const untrackedWorker = new MockWorker() as any;
      expect(manager.isHealthy(untrackedWorker)).toBe(false);
    });
  });
});
