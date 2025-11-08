import type { Size } from '../../types';

export interface SpinnerProps {
  /** Size of the spinner */
  size?: Size;
  /** Additional CSS class names */
  className?: string;
  /** Accessible label */
  label?: string;
}

/**
 * Loading spinner component.
 *
 * @example
 * ```tsx
 * <Spinner size="lg" label="Loading data..." />
 * ```
 */
export function Spinner({
  size = 'md',
  className = '',
  label = 'Loading...',
}: SpinnerProps) {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };
  
  const combinedClassName = [
    'inline-block animate-spin rounded-full border-solid border-blue-500 border-r-transparent',
    sizeStyles[size],
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className="inline-flex items-center justify-center">
      <div
        className={combinedClassName}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
