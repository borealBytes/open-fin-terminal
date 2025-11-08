import type { ReactNode } from 'react';
import type { BaseProps } from '../../types';

export interface CardProps extends BaseProps {
  /** Card header content */
  header?: ReactNode;
  /** Card footer content */
  footer?: ReactNode;
  /** Whether card has padding */
  padding?: boolean;
  /** Whether card has border */
  border?: boolean;
}

/**
 * Card container component with optional header and footer.
 *
 * @example
 * ```tsx
 * <Card
 *   header={<h3>Title</h3>}
 *   footer={<Button>Action</Button>}
 * >
 *   Card content
 * </Card>
 * ```
 */
export function Card({
  header,
  footer,
  padding = true,
  border = true,
  className = '',
  children,
  ...props
}: CardProps) {
  const baseStyles = 'bg-gray-900 rounded-lg';
  const borderStyles = border ? 'border border-gray-700' : '';
  const paddingStyles = padding ? 'p-4' : '';
  
  const combinedClassName = [
    baseStyles,
    borderStyles,
    paddingStyles,
    className,
  ].filter(Boolean).join(' ');
  
  return (
    <div className={combinedClassName} {...props}>
      {header && (
        <div className="mb-4 pb-3 border-b border-gray-700">
          {header}
        </div>
      )}
      <div>{children}</div>
      {footer && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
}
