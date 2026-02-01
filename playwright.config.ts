import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",

    /* E2E test credentials */
    // @ts-expect-error - Custom property for E2E tests
    testUser: {
      username: process.env.E2E_USERNAME,
      userId: process.env.E2E_USERNAME_ID,
      password: process.env.E2E_PASSWORD,
    },
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - authenticates once and saves session state
    // Run manually first: npx playwright test --project=setup
    {
      name: "setup",
      testMatch: /.*\.setup\.ts$/,
    },

    // Tests that require authentication
    // Note: Run setup project first to create auth state
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use saved authentication state from setup
        // If file doesn't exist, tests will fail - run setup first
        storageState: "playwright/.auth/user.json",
      },
      // dependencies removed for better UI mode experience
      // You must run setup manually first: npx playwright test --project=setup
      testIgnore: /.*\.setup\.ts$/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:4321",
    reuseExistingServer: true, // Always reuse existing server
    timeout: 180 * 1000, // Increased to 3 minutes
    stdout: "pipe",
    stderr: "pipe",
  },
});
