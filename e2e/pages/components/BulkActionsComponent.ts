import { expect, type Locator, type Page } from "@playwright/test";
import { BaseComponent } from "./BaseComponent";

/**
 * Page Object Model for Bulk Actions Component
 * Handles bulk operations on flashcard suggestions
 */
export class BulkActionsComponent extends BaseComponent {
  // Locators
  private readonly bulkActions: Locator;
  private readonly selectionCounter: Locator;
  private readonly saveAllButton: Locator;
  private readonly saveSelectedButton: Locator;

  constructor(page: Page) {
    const rootLocator = page.getByTestId("bulk-actions");
    super(page, rootLocator);
    this.bulkActions = rootLocator;
    this.selectionCounter = page.getByTestId("selection-counter");
    this.saveAllButton = page.getByTestId("save-all-button");
    this.saveSelectedButton = page.getByTestId("save-selected-button");
  }

  /**
   * Click save all button
   */
  async clickSaveAll() {
    await this.saveAllButton.click();
  }

  /**
   * Click save selected button
   */
  async clickSaveSelected() {
    await this.saveSelectedButton.click();
  }

  /**
   * Get selection counter text
   */
  async getSelectionCounterText() {
    return this.selectionCounter.textContent();
  }

  /**
   * Get selected count from counter
   */
  async getSelectedCount(): Promise<number> {
    const text = await this.getSelectionCounterText();
    const match = text?.match(/(\d+)\s+fiszek zaznaczonych/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if save selected button is disabled
   */
  async isSaveSelectedDisabled() {
    return this.saveSelectedButton.isDisabled();
  }

  /**
   * Check if save all button is disabled
   */
  async isSaveAllDisabled() {
    return this.saveAllButton.isDisabled();
  }

  /**
   * Check if buttons are in accepting state
   */
  async isAccepting() {
    const buttonText = await this.saveSelectedButton.textContent();
    return buttonText?.includes("Zapisywanie...");
  }

  /**
   * Verify bulk actions are visible
   */
  async verifyBulkActionsVisible() {
    await expect(this.bulkActions).toBeVisible();
  }

  /**
   * Verify selection counter shows correct count
   */
  async verifySelectionCount(expectedCount: number) {
    if (expectedCount > 0) {
      await expect(this.selectionCounter).toContainText(`${expectedCount} fiszek zaznaczonych`);
    } else {
      await expect(this.selectionCounter).toContainText("Zaznacz fiszki do zapisania");
    }
  }

  /**
   * Verify save selected button is disabled
   */
  async verifySaveSelectedDisabled() {
    await expect(this.saveSelectedButton).toBeDisabled();
  }

  /**
   * Verify save selected button is enabled
   */
  async verifySaveSelectedEnabled() {
    await expect(this.saveSelectedButton).toBeEnabled();
  }

  /**
   * Verify save all button shows correct count
   */
  async verifySaveAllCount(expectedCount: number) {
    await expect(this.saveAllButton).toContainText(`Zapisz wszystkie (${expectedCount})`);
  }

  /**
   * Verify accepting state
   */
  async verifyAcceptingState() {
    await expect(this.saveSelectedButton).toContainText("Zapisywanie...");
  }
}
