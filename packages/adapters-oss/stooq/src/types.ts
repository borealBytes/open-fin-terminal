/**
 * Types for Stooq CSV data adapter.
 */

/**
 * Stooq CSV row structure
 */
export interface StooqCSVRow {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
