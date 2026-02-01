# E2E Tests

End-to-end tests using Playwright with authentication support.

## Setup

E2E tests use **real authentication** with a test user from your database.

**Required environment variables in `.env.test`:**

```bash
E2E_USERNAME=your-test-user@example.com
E2E_USERNAME_ID=your-test-user-uuid
E2E_PASSWORD=your-test-password
```

**How it works:**
1. Setup runs once (`auth.setup.ts`) and logs in with E2E_USERNAME/E2E_PASSWORD
2. Authentication state is saved to `playwright/.auth/user.json`
3. All tests reuse this authenticated state (no repeated logins)
4. Tests run with real Supabase authentication

**Important:** The test user must exist in your Supabase database before running tests.

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

## Authentication

**Tests use real authentication** via Playwright's authentication state management.

**Global Setup Flow:**
1. `auth.setup.ts` runs once before all tests
2. Logs in using `E2E_USERNAME` and `E2E_PASSWORD`
3. Saves authentication state to `playwright/.auth/user.json`
4. All tests inherit this authenticated state automatically

**Benefits:**
- ✅ Tests real authentication flow
- ✅ Login happens only once (fast test execution)
- ✅ Tests use real database user
- ✅ Consistent authentication state across all tests

**Using Test User in Tests:**

```typescript
import { test, expect } from "./fixtures";

test("example test", async ({ page, testUser }) => {
  // testUser fixture contains credentials from .env.test:
  // - testUser.username (E2E_USERNAME)
  // - testUser.userId (E2E_USERNAME_ID)
  // - testUser.password (E2E_PASSWORD)

  console.log("Testing with user:", testUser.username);

  // Already authenticated via saved state from auth.setup.ts
  await page.goto("/generate");

  // Verify authentication
  await expect(page.locator('[data-testid="user-info"]')).toBeVisible();
});
```

**Troubleshooting:**
- If tests fail with authentication errors, delete `playwright/.auth/user.json` and re-run
- Ensure test user exists in Supabase database with correct email/password

## Directory Structure

```
e2e/
├── README.md          # This file
├── auth.setup.ts      # Global authentication setup
├── fixtures.ts        # Test fixtures with user credentials
├── example.spec.ts    # Example test file
├── generation.spec.ts # Generation view tests
└── pages/             # Page Object Models
    ├── BasePage.ts
    ├── GenerationPage.ts
    └── components/    # Reusable page components
```
