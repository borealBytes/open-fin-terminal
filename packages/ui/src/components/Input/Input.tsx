import type { InputHTMLAttributes } from 'react';
import type { Size } from '../../types';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Size of the input */
  size?: Size;
  /** Error state with optional message */
  error?: boolean | string;
  /** Success state */
  success?: boolean;
  /** Label for the input */
  label?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Accessible input component with validation states.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   error="Invalid email address"
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export function Input({
  size = 'md',
  error = false,
  success = false,
  label,
  helperText,
  fullWidth = false,
  className = '',
  id,
  disabled = false,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helperTextId = `${inputId}-helper`;
  const errorMessageId = `${inputId}-error`;
  
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : undefined;
  
  const baseStyles = 'border rounded-md px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const stateStyles = hasError
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : success
    ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
    : 'border-gray-600 focus:ring-blue-500 focus:border-blue-500';
  
  const sizeStyles = {
    sm: 'text-sm py-1.5',
    md: 'text-base py-2',
    lg: 'text-lg py-3',
  };
  
  const bgStyles = disabled ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-900 text-gray-100';
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const combinedClassName = [
    baseStyles,
    stateStyles,
    sizeStyles[size],
    bgStyles,
    widthStyle,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={combinedClassName}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={
          [errorMessage && errorMessageId, helperText && helperTextId]
            .filter(Boolean)
            .join(' ') || undefined
        }
        {...props}
      />
      {errorMessage && (
        <p id={errorMessageId} className="mt-1 text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && !errorMessage && (
        <p id={helperTextId} className="mt-1 text-sm text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}
