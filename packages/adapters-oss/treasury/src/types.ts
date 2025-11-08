import { z } from 'zod';

/**
 * Treasury yield maturities
 */
export type TreasuryMaturity = 
  | '1_MONTH'
  | '3_MONTH' 
  | '6_MONTH'
  | '1_YEAR'
  | '2_YEAR'
  | '5_YEAR'
  | '7_YEAR'
  | '10_YEAR'
  | '20_YEAR'
  | '30_YEAR';

/**
 * Individual yield rate for a specific maturity
 */
export interface TreasuryRate {
  maturity: TreasuryMaturity;
  yield: number; // Percentage (e.g., 4.25 for 4.25%)
  date: Date;
}

/**
 * Complete yield curve for a specific date
 */
export interface TreasuryYieldCurve {
  date: Date;
  rates: TreasuryRate[];
  source: 'treasury.gov';
}

/**
 * API response schema from Treasury.gov
 */
export const TreasuryAPIResponseSchema = z.object({
  data: z.array(
    z.object({
      record_date: z.string(), // YYYY-MM-DD
      bc_1month: z.string().nullable().optional(),
      bc_3month: z.string().nullable().optional(),
      bc_6month: z.string().nullable().optional(),
      bc_1year: z.string().nullable().optional(),
      bc_2year: z.string().nullable().optional(),
      bc_5year: z.string().nullable().optional(),
      bc_7year: z.string().nullable().optional(),
      bc_10year: z.string().nullable().optional(),
      bc_20year: z.string().nullable().optional(),
      bc_30year: z.string().nullable().optional(),
    })
  ),
  meta: z.object({
    count: z.number(),
    labels: z.record(z.string()).optional(),
  }),
});

export type TreasuryAPIResponse = z.infer<typeof TreasuryAPIResponseSchema>;
