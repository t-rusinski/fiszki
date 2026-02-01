# Testing Setup Guide

This project is configured with comprehensive testing infrastructure for both unit/integration tests and end-to-end tests.

## 📦 Installed Dependencies

### Unit Testing

- **Vitest**: Fast unit test framework for TypeScript/JavaScript
- **@vitest/ui**: Interactive UI for test visualization
- **@testing-library/react**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom jest-dom matchers for DOM assertions
- **jsdom**: JavaScript implementation of web standards for Node.js
- **happy-dom**: Alternative DOM implementation (lightweight)
- **MSW**: Mock Service Worker for API mocking

### E2E Testing

- **@playwright/test**: Modern E2E testing framework with Chromium support

## 🏗️ Project Structure

```
fiszki/
├── e2e/                          # E2E test files
│   ├── README.md                 # E2E testing guide
│   └── example.spec.ts           # Example E2E test
├── src/
│   ├── test/                     # Unit test utilities
│   │   ├── README.md             # Unit testing guide
│   │   ├── setup.ts              # Global test setup
│   │   └── test-utils.tsx        # Reusable test utilities
│   └── lib/
│       └── example.test.ts       # Example unit test
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
└── TESTING.md                    # This file
```

## 🚀 Running Tests

### Unit Tests

```bash
# Run all unit tests once
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI mode
npm run test:e2e:ui

# Run in debug mode with step-by-step execution
npm run test:e2e:debug

# Generate tests using Playwright codegen
npm run test:e2e:codegen
```

## ✍️ Writing Tests

### Unit Tests

Place test files next to the code they test with `.test.ts` or `.spec.ts` extension:

```typescript
// src/lib/utils.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";

describe("Utils", () => {
  it("should demonstrate basic test", () => {
    // Arrange
    const input = 1 + 1;

    // Act
    const result = input;

    // Assert
    expect(result).toBe(2);
  });
});
```

### E2E Tests

Place test files in the `e2e/` directory with `.spec.ts` extension:

```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });
});
```

## 🎯 Best Practices

### Unit Testing (Vitest)

1. **Use descriptive test names**: Tests should clearly describe what they're testing
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use vi.fn() for mocks**: Create mock functions with `vi.fn()`
4. **Leverage vi.spyOn()**: Monitor existing functions without replacing them
5. **Use inline snapshots**: `expect(value).toMatchInlineSnapshot()`
6. **Keep tests isolated**: Each test should be independent
7. **Mock external dependencies**: Use `vi.mock()` for external modules

### E2E Testing (Playwright)

1. **Use Page Object Model**: Organize page interactions in reusable classes
2. **Prefer user-facing locators**: Use `getByRole`, `getByLabel`, etc.
3. **Use specific assertions**: `expect(page).toHaveTitle()`, not generic checks
4. **Implement test hooks**: Use `beforeEach` and `afterEach` for setup/teardown
5. **Avoid hardcoded waits**: Use Playwright's auto-waiting features
6. **Test one thing at a time**: Keep tests focused and atomic
7. **Use visual regression**: `expect(page).toHaveScreenshot()` for UI changes

## 🔧 Configuration Details

### Vitest Configuration

- **Environment**: jsdom (for DOM testing)
- **Setup file**: `src/test/setup.ts`
- **Test pattern**: `**/*.{test,spec}.{ts,tsx}`
- **Excludes**: node_modules, dist, .astro, e2e
- **Path alias**: `@` → `./src`

### Playwright Configuration

- **Test directory**: `e2e/`
- **Browser**: Chromium (Desktop Chrome)
- **Base URL**: http://localhost:4321
- **Parallel execution**: Enabled
- **Screenshots**: On failure only
- **Traces**: On first retry
- **Web server**: Auto-starts dev server before tests

## 📊 Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- `coverage/` - HTML, JSON, and text reports
- Open `coverage/index.html` in browser for interactive coverage explorer

### Current Coverage Status

✅ **100% Coverage** achieved for critical components:

- `src/lib/validation/flashcard.schemas.ts` (72 tests)
- `src/lib/validation/generation.schemas.ts` (54 tests)
- `src/lib/error-handler.ts` (43 tests)
- `src/lib/model-checker.ts` (24 tests)

See `.ai/test-implementation-summary.md` for detailed test coverage report.

## 🔍 Debugging Tests

### Unit Tests

```bash
# Run specific test file
npm test -- src/lib/utils.test.ts

# Filter tests by name
npm test -- -t "should validate email"

# Run with UI for visual debugging
npm run test:ui
```

### E2E Tests

```bash
# Run specific test file
npm run test:e2e -- e2e/auth.spec.ts

# Run in headed mode (show browser)
npm run test:e2e -- --headed

# Debug mode with step-by-step execution
npm run test:e2e:debug
```

## 🚨 Common Issues

### Unit Tests

**Issue**: "Cannot find module '@/components/Button'"

- **Solution**: Check path alias configuration in `vitest.config.ts`

**Issue**: "Document is not defined"

- **Solution**: Ensure test environment is set to 'jsdom' in config

### E2E Tests

**Issue**: "Target page, context or browser has been closed"

- **Solution**: Increase timeout or check for navigation issues

**Issue**: "browserType.launch: Executable doesn't exist"

- **Solution**: Run `npx playwright install chromium`

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## 🎓 Next Steps

1. Remove example test files when starting real implementation
2. Set up CI/CD pipeline for automated testing
3. Configure code coverage thresholds
4. Implement Page Object Models for E2E tests
5. Create reusable test fixtures and utilities
