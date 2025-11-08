# @open-fin-terminal/ui

UI component library for Open Financial Terminal. Provides accessible, keyboard-navigable components with dark theme support.

## Features

- **Accessible**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation
- **Dark Theme**: Built-in dark theme optimized for terminal-style interfaces
- **TypeScript**: Fully typed with comprehensive prop interfaces
- **Composable**: Headless patterns for maximum flexibility
- **Lightweight**: Tree-shakeable with minimal dependencies
- **Tested**: Comprehensive unit and accessibility tests

## Components

### Form Controls
- `Button` - Clickable button with variants (primary, secondary, ghost, danger)
- `Input` - Text input with validation states
- `Select` - Dropdown selection

### Layout
- `Card` - Container with optional header and footer
- `Panel` - Collapsible panel

### Feedback
- `Spinner` - Loading spinner
- `Skeleton` - Content placeholder
- `ErrorBoundary` - Error boundary with fallback UI

## Installation

```bash
pnpm add @open-fin-terminal/ui
```

## Usage

```tsx
import { Button, Input, Card } from '@open-fin-terminal/ui';

function MyComponent() {
  return (
    <Card>
      <Input placeholder="Enter symbol..." />
      <Button variant="primary" onClick={handleSearch}>
        Search
      </Button>
    </Card>
  );
}
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management
- Screen reader support

## Theming

Components use CSS custom properties for theming:

```css
:root {
  --color-primary: #0066cc;
  --color-text: #e0e0e0;
  --color-background: #1a1a1a;
  --color-border: #333333;
  /* ... */
}
```

## Development

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck

# Build
pnpm build
```

## License

MIT
