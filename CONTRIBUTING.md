# Contributing to Open Financial Terminal

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Data Source Compliance](#data-source-compliance)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/borealBytes/open-fin-terminal.git
cd open-fin-terminal

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

## Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

4. **Commit your changes** using Conventional Commits format

5. **Push to your fork** and create a Pull Request

## Pull Request Process

1. **Fill out the PR template** completely
2. **Link related issues** using keywords (Closes #123, Fixes #456)
3. **Ensure CI passes**:
   - All tests pass
   - Type checking succeeds
   - Linting passes
   - Coverage threshold met (≥85%)
   - Accessibility checks pass
   - Lighthouse performance budgets met
4. **Complete the Data Source Compliance checklist** if adding/modifying data sources
5. **Request review** from maintainers
6. **Address review feedback** promptly
7. **Squash and merge** after approval

## Coding Standards

### TypeScript

- Use strict TypeScript with no implicit any
- Prefer interfaces over types for object shapes
- Use discriminated unions for variants
- Document complex types with JSDoc comments
- Use zod for runtime validation at I/O boundaries

### React

- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use semantic HTML elements
- Ensure keyboard accessibility (tabindex, ARIA)

### File Structure

```
packages/
├── component-name/
│   ├── src/
│   │   ├── index.ts           # Public exports
│   │   ├── types.ts           # Type definitions
│   │   ├── component.tsx      # Implementation
│   │   ├── component.test.ts  # Unit tests
│   │   └── utils.ts           # Helper functions
│   ├── package.json
│   └── tsconfig.json
```

### Naming Conventions

- **Files**: kebab-case (e.g., `data-adapter.ts`)
- **Components**: PascalCase (e.g., `DataTable.tsx`)
- **Functions**: camelCase (e.g., `fetchQuotes`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `QuoteData`)

## Testing Requirements

### Unit Tests

- All new code must have unit tests
- Coverage threshold: ≥85%
- Use Vitest for testing
- Mock external dependencies
- Test edge cases and error conditions

```typescript
import { describe, it, expect, vi } from 'vitest'
import { myFunction } from './my-function'

describe('myFunction', () => {
  it('should handle valid input', () => {
    expect(myFunction('valid')).toBe(expected)
  })

  it('should throw on invalid input', () => {
    expect(() => myFunction('invalid')).toThrow()
  })
})
```

### Integration Tests

- Test adapter contracts
- Use recorded fixtures for external APIs
- Avoid hitting real APIs in tests

### E2E Tests

- Test critical user flows
- Use Playwright
- Run in CI on all PRs

## Data Source Compliance

**CRITICAL**: All data sources must comply with these requirements:

### Checklist

- [ ] Source is publicly accessible without authentication (for default adapters)
- [ ] Terms of Service permit programmatic access
- [ ] robots.txt allows access (if applicable)
- [ ] Rate limits are documented and respected
- [ ] User-Agent is set to a descriptive value
- [ ] Conditional requests (ETag, If-Modified-Since) are implemented
- [ ] Exponential backoff with jitter on 429/5xx responses
- [ ] Caching strategy documented
- [ ] CORS constraints documented (for browser access)
- [ ] License/terms summary in data source catalog
- [ ] No proprietary identifiers (CUSIP, SEDOL) unless user-provided
- [ ] No scraping or bypassing access controls

### Documentation

Add new data sources to:
- `packages/docs/data-source-catalog.md`
- `packages/docs/feature-coverage-matrix.csv`

Include:
- Endpoint URLs
- Access method (REST, WebSocket, CSV)
- Update frequency
- Rate limits
- Required headers (User-Agent)
- Terms of Service summary
- CORS constraints
- Example compliant access pattern

## Commit Message Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```
feat(adapters): add SEC EDGAR fundamentals adapter

Implements company facts JSON parsing from SEC EDGAR.
Respects rate limits and User-Agent requirements.

Closes #123
```

```
fix(ui): correct keyboard navigation in command palette

Fixed Tab key behavior to cycle through suggestions.
Added aria-activedescendant for screen reader support.

Fixes #456
```

## Adding Data Adapters

1. **Create adapter in `packages/adapters-oss` (or `-opt` for authenticated)**
2. **Implement the `Adapter` interface**
3. **Add capability discovery**
4. **Implement rate limiting and backoff**
5. **Add comprehensive tests with fixtures**
6. **Document in data source catalog**
7. **Update feature coverage matrix**

## Adding Analytics Functions

1. **Add function to `packages/analytics`**
2. **Ensure deterministic results**
3. **Add unit tests with known outputs**
4. **Document inputs, outputs, and assumptions**
5. **Consider Web Worker compatibility**

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in pull request comments
- Check existing issues and discussions

Thank you for contributing! 🚀
