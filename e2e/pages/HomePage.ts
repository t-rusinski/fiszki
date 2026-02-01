import { expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Page Object Model for Home Page
 */
export class HomePage extends BasePage {
  /**
   * Navigate to home page
   */
  async navigate() {
    await this.goto("/");
  }

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded() {
    await expect(this.page).toHaveTitle(/fiszki/i);
  }

  /**
   * Example: Get main heading
   */
  async getMainHeading() {
    return this.page.locator("h1").first();
  }
}
