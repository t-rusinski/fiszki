import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../playwright/.auth/user.json");

/**
 * Global setup for authenticated tests
 * Logs in once using credentials from .env.test and saves authentication state
 *
 * Required environment variables:
 * - E2E_USERNAME: Email for test user
 * - E2E_PASSWORD: Password for test user
 */
setup("authenticate", async ({ page }) => {
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!username || !password) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
  }

  // Go to login page
  await page.goto("/auth/login");

  // Fill in login form
  await page.fill('input[name="email"]', username);
  await page.fill('input[name="password"]', password);

  // Submit form and wait for successful login API response
  await Promise.all([
    page.waitForResponse((response) => response.url().includes("/api/auth/login") && response.status() === 200, {
      timeout: 10000,
    }),
    page.click('button[type="submit"]'),
  ]);

  // Wait for redirect to home page (login redirects to "/" not "/generate")
  await page.waitForURL("/", { timeout: 10000 });

  // Verify we're logged in by checking for user-specific elements
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible({ timeout: 5000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
