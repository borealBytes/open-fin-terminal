# Open Financial Terminal - Web Application

This is the main web application for Open Financial Terminal, built with Next.js 14 App Router.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Export static site
pnpm export
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features (Coming Soon)

- Bloomberg-style command palette
- Multi-panel workspace
- OpenBB Platform integration
- High-performance charts
- Portfolio analytics
- Keyboard-first navigation

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: CSS (Tailwind coming soon)
- **Testing**: Vitest + Playwright

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript compiler check
- `pnpm test` - Run unit tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:e2e` - Run E2E tests
- `pnpm export` - Export static site

## Directory Structure

```
app/
├── src/
│   ├── app/           # Next.js app directory
│   │   ├── layout.tsx # Root layout
│   │   ├── page.tsx   # Home page
│   │   └── globals.css
├── tests/
│   ├── unit/          # Unit tests
│   └── e2e/           # E2E tests
├── next.config.js
├── tsconfig.json
└── package.json
```
