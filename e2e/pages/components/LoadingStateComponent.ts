import { expect, type Locator, type Page } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

/**
 * Page Object Model for Loading State Component
 * Handles loading state during flashcard generation
 */
export class LoadingStateComponent extends BaseComponent {
  // Locators
  private readonly loadingState: Locator;
  private readonly loadingMessage: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    const rootLocator = page.getByTestId("loading-state");
    super(page, rootLocator);
    this.loadingState = rootLocator;
    this.loadingMessage = page.getByTestId("loading-message");
    this.cancelButton = page.getByTestId("cancel-generation-button");
  }

  /**
   * Wait for loading state to appear
   */
  async waitForLoading() {
    await this.loadingState.waitFor({ state: "visible" });
  }

  /**
   * Wait for loading state to disappear
   */
  async waitForLoadingComplete() {
    await this.loadingState.waitFor({ state: "hidden" });
  }

  /**
   * Get loading message text
   */
  async getLoadingMessage() {
    return this.loadingMessage.textContent();
  }

  /**
   * Click cancel button (if available)
   */
  async clickCancel() {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    }
  }

  /**
   * Verify loading state is visible
   */
  async verifyLoadingVisible() {
    await expect(this.loadingState).toBeVisible();
  }

  /**
   * Verify loading message
   */
  async verifyLoadingMessage(expectedMessage: string) {
    await expect(this.loadingMessage).toContainText(expectedMessage);
  }

  /**
   * Verify cancel button is visible
   */
  async verifyCancelButtonVisible() {
    await expect(this.cancelButton).toBeVisible();
  }
}
