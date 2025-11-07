/**
 * Application constants
 */

export const APP_NAME = 'Open Financial Terminal'
export const APP_VERSION = '0.1.0'
export const APP_DESCRIPTION = 'Open-source Bloomberg Terminal alternative'

/**
 * Supported asset types
 */
export const ASSET_TYPES = [
  'equity',
  'etf',
  'option',
  'bond',
  'fx',
  'crypto',
  'future',
] as const

/**
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  theme: 'dark',
  locale: 'en-US',
  timezone: 'America/New_York',
} as const
