# Unit Tests

Unit and integration tests using Vitest.

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Guidelines

- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Place mock factories at the top level of test files
- Use inline snapshots for readable assertions
- Follow Arrange-Act-Assert pattern
- Group related tests with `describe` blocks

## Directory Structure

```
src/test/
├── README.md          # This file
├── setup.ts           # Global test setup
└── test-utils.tsx     # Reusable test utilities
```

## Test Utilities

Import from `@/test/test-utils` instead of `@testing-library/react` directly:

```typescript
import { renderWithProviders, screen, fireEvent } from "@/test/test-utils";
```
