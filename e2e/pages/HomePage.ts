import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object Model for Home Page
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to home page
   */
  async navigate() {
    await this.goto('/');
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
    return this.page.locator('h1').first();
  }
}
