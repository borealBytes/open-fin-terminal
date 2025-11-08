import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="This is a helper text" />);
    expect(screen.getByText('This is a helper text')).toBeInTheDocument();
  });

  it('shows error message when error is a string', () => {
    render(<Input error="This field is required" />);
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('applies error styles when error is true', () => {
    render(<Input error />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-500');
  });

  it('applies success styles when success is true', () => {
    render(<Input success />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-green-500');
  });

  it('hides helper text when error message is shown', () => {
    render(<Input error="Error message" helperText="Helper text" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input error="Error" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('associates error message with input via aria-describedby', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(screen.getByText('Error message')).toHaveAttribute('id', describedBy);
  });

  it('applies small size styles', () => {
    render(<Input size="sm" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('text-sm');
  });

  it('applies medium size styles by default', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('text-base');
  });

  it('applies large size styles', () => {
    render(<Input size="lg" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('text-lg');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    await user.type(input, 'Hello');
    expect(input).toHaveValue('Hello');
  });

  it('handles onChange event', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    await user.type(screen.getByRole('textbox'), 'A');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies disabled styles when disabled', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('cursor-not-allowed');
  });

  it('applies full width style when specified', () => {
    render(<Input fullWidth />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('w-full');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" />);
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');
    
    await user.tab();
    expect(input).toHaveFocus();
  });

  it('supports data-testid', () => {
    render(<Input data-testid="test-input" />);
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });
});
