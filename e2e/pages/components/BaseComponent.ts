import type { Locator, Page } from "@playwright/test";

/**
 * Base Component class
 * All component objects should extend this class
 */
export class BaseComponent {
  constructor(
    protected page: Page,
    protected rootLocator?: Locator
  ) {}

  /**
   * Wait for component to be visible
   */
  async waitForVisible() {
    if (this.rootLocator) {
      await this.rootLocator.waitFor({ state: "visible" });
    }
  }

  /**
   * Wait for component to be hidden
   */
  async waitForHidden() {
    if (this.rootLocator) {
      await this.rootLocator.waitFor({ state: "hidden" });
    }
  }

  /**
   * Check if component is visible
   */
  async isVisible() {
    if (this.rootLocator) {
      return this.rootLocator.isVisible();
    }
    return false;
  }

  /**
   * Get component root locator
   */
  getRoot() {
    return this.rootLocator;
  }
}
