# E2E Tests

End-to-end tests using Playwright.

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run with UI mode for interactive testing
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Generate tests using codegen
npm run test:e2e:codegen
```

## Guidelines

- Use Page Object Model for maintainable tests
- Only use Chromium/Desktop Chrome browser
- Leverage locators for resilient element selection
- Implement test hooks for setup and teardown
- Use specific matchers in assertions

## Directory Structure

```
e2e/
├── README.md          # This file
├── example.spec.ts    # Example test file
└── pages/             # Page Object Models (create as needed)
```
