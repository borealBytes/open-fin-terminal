/**
 * Common types for UI components
 */

import type { ReactNode } from 'react';

/**
 * Size variants for components
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Component variant types
 */
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Base props for all components
 */
export interface BaseProps {
  /** Additional CSS class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Children elements */
  children?: ReactNode;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Props for focusable components
 */
export interface FocusableProps extends BaseProps {
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Tab index */
  tabIndex?: number;
}
