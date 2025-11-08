import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders with default label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<Spinner label="Processing..." />);
    expect(screen.getByLabelText('Processing...')).toBeInTheDocument();
  });

  it('has role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has aria-live=polite', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('applies small size styles', () => {
    render(<Spinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('h-4');
    expect(spinner.className).toContain('w-4');
  });

  it('applies medium size styles by default', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('h-8');
    expect(spinner.className).toContain('w-8');
  });

  it('applies large size styles', () => {
    render(<Spinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('h-12');
    expect(spinner.className).toContain('w-12');
  });

  it('applies animation class', () => {
    render(<Spinner />);
    expect(screen.getByRole('status').className).toContain('animate-spin');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    expect(screen.getByRole('status').className).toContain('custom-class');
  });

  it('includes screen reader only text', () => {
    render(<Spinner label="Custom label" />);
    expect(screen.getByText('Custom label')).toBeInTheDocument();
    expect(screen.getByText('Custom label').className).toContain('sr-only');
  });
});
