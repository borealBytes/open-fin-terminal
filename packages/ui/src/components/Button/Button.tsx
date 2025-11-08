import type { ButtonHTMLAttributes } from 'react';
import type { Size, Variant } from '../../types';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Visual variant of the button */
  variant?: Variant;
  /** Size of the button */
  size?: Size;
  /** Whether button is in loading state */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * Accessible button component with multiple variants and states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-800 focus:ring-gray-500 disabled:text-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded',
    md: 'px-4 py-2 text-base rounded-md',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  const cursorStyle = (disabled || loading) ? 'cursor-not-allowed' : 'cursor-pointer';
  
  const combinedClassName = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    widthStyle,
    cursorStyle,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <button
      type={type}
      className={combinedClassName}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" role="status" aria-label="Loading">
          <span className="sr-only">Loading...</span>
        </span>
      )}
      {children}
    </button>
  );
}
