import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders header when provided', () => {
    render(<Card header={<h3>Card Header</h3>}>Content</Card>);
    expect(screen.getByText('Card Header')).toBeInTheDocument();
  });

  it('renders footer when provided', () => {
    render(<Card footer={<p>Card Footer</p>}>Content</Card>);
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('renders header and footer together', () => {
    render(
      <Card
        header={<h3>Header</h3>}
        footer={<p>Footer</p>}
      >
        Content
      </Card>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('applies padding by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('p-4');
  });

  it('removes padding when padding=false', () => {
    const { container } = render(<Card padding={false}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('p-4');
  });

  it('applies border by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border');
  });

  it('removes border when border=false', () => {
    const { container } = render(<Card border={false}>Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('border');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-class');
  });

  it('supports data-testid', () => {
    render(<Card data-testid="test-card">Content</Card>);
    expect(screen.getByTestId('test-card')).toBeInTheDocument();
  });

  it('renders complex header content', () => {
    render(
      <Card
        header={
          <div>
            <h2>Title</h2>
            <p>Subtitle</p>
          </div>
        }
      >
        Content
      </Card>
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });
});
