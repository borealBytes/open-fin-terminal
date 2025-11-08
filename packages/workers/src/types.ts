/**
 * Types for Web Worker runtime
 */

/**
 * Worker status
 */
export type WorkerStatus = 'idle' | 'busy' | 'error' | 'terminated';

/**
 * Worker metadata
 */
export interface WorkerMetadata {
  /** Unique identifier for the worker */
  id: string;
  /** Worker status */
  status: WorkerStatus;
  /** Creation timestamp */
  createdAt: number;
  /** Last active timestamp */
  lastActiveAt: number;
  /** Error if worker failed */
  error?: Error;
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  /** Minimum number of workers to maintain */
  minWorkers?: number;
  /** Maximum number of workers */
  maxWorkers?: number;
  /** Worker idle timeout in milliseconds */
  idleTimeout?: number;
}

/**
 * Options for creating a worker
 */
export interface WorkerOptions {
  /** Worker name for debugging */
  name?: string;
  /** Timeout for worker initialization in milliseconds */
  timeout?: number;
}
